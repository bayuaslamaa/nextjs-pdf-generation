import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function POST(req: NextRequest) {
  let browser = null;
  
  try {
    const payload = await req.json();

    // Validate input
    const keys = Object.keys(payload);
    if (keys.length !== 1 || !payload.url) {
      const unexpected = keys.filter((key) => key !== 'url');
      return NextResponse.json(
        { error: `Unexpected property: ${unexpected.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate URL format
    let urlObj: URL;
    try {
      urlObj = new URL(payload.url);
      
      // Ensure the URL has http or https protocol
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return NextResponse.json(
          { error: `Invalid URL protocol: ${urlObj.protocol}. URL must use http or https.` },
          { status: 400 }
        );
      }
    } catch (urlError) {
      return NextResponse.json(
        { error: `Invalid URL format: ${payload.url}. Please provide a valid URL with protocol (e.g., https://example.com).` },
        { status: 400 }
      );
    }

    const browserlessToken = process.env.BROWSERLESS_TOKEN;
    const browserlessEndpoint = 'wss://production-sfo.browserless.io';

    if (browserlessToken) {
      try {
        console.log(`Attempting to connect to Browserless at ${browserlessEndpoint}...`);
        browser = await puppeteer.connect({
          browserWSEndpoint: browserlessEndpoint,
          headers: {
            'Authorization': `Bearer ${browserlessToken}`,
          },
          protocolTimeout: 120000, // Increase timeout to 120 seconds
        });
        console.log('Successfully connected to Browserless.');
      } catch (connError: unknown) {
        const errorMessage = connError instanceof Error ? connError.message : 'Unknown connection error';
        console.warn(`Failed to connect to Browserless: ${errorMessage}. Falling back to local Puppeteer.`);
        // Fallback handled below
      }
    }

    // If browser is still null (no token or connection failed), launch locally
    if (!browser) {
      try {
        console.log('No Browserless token found or connection failed. Launching local Puppeteer instance...');
        browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
          protocolTimeout: 120000, // Increase timeout to 120 seconds
        });
        console.log('Local Puppeteer instance launched.');
      } catch (browserError: unknown) {
        const errorMessage = browserError instanceof Error ? browserError.message : 'Unknown browser error';
        console.error('Failed to launch local browser:', errorMessage);
        return NextResponse.json(
          { error: 'Failed to initialize browser. Please try again later.' },
          { status: 500 }
        );
      }
    }

    const page = await browser.newPage();
    
    // Set viewport size for consistent PDF output
    await page.setViewport({ width: 1280, height: 1024 });

    try {
      console.log(`Navigating to URL: ${payload.url}`);
      await page.goto(payload.url, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 // 30 second timeout
      });
    } catch (navigationError: unknown) {
      await browser.close();
      const errorMessage = navigationError instanceof Error 
        ? navigationError.message 
        : 'Navigation failed';
      console.error('Navigation error:', errorMessage);
      return NextResponse.json(
        { error: `Failed to navigate to URL: ${errorMessage}` },
        { status: 400 }
      );
    }

    // Wait for images to load
    await page.evaluate(async () => {
      const imgs = Array.from(document.images);
      await Promise.all(imgs.map((img) => {
        if (img.complete) return;
        return new Promise((resolve) => {
          img.onload = img.onerror = resolve;
        });
      }));
    });

    console.log('Generating PDF...');
    // Generate PDF Buffer
    const pdfBuffer = await page.pdf({ 
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });

    await page.close();
    await browser.close();
    console.log('PDF generated successfully');

    // Convert Buffer to a Web Stream
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(pdfBuffer);
        controller.close();
      }
    });

    // Return the stream in the Response
    return new Response(stream, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="page.pdf"',
        'Content-Length': pdfBuffer.length.toString() // Add content length for better client handling
      },
    });
  } catch (error: unknown) {
    // Make sure browser is closed on error
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }
    
    console.error('Error generating PDF:', error);
    // Return more specific error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'PDF Generation Failed', 
      message: errorMessage 
    }, { status: 500 });
  }
}
