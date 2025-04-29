# 📄 Next.js PDF Generator – Browserless Challenge

This project is a take-home exercise for generating a PDF from a given URL using Browserless and Puppeteer, with an efficient memory streaming approach.  
It includes:
- API validation
- Custom image loading strategy
- Memory-efficient PDF streaming
- Minimal, clean frontend UI

---

## 🚀 Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Puppeteer-Core
- Browserless (Remote WebSocket Connection)

---

## 📂 Project Structure

```
app/
  api/
    generate-pdf/
      route.ts  # API Route for generating PDF
  page.tsx       # Frontend user input and download link
```

---

## ⚙️ Setup Instructions

1. **Clone the repository:**

```bash
git clone https://github.com/your-username/nextjs-pdf-generator.git
cd nextjs-pdf-generator
```

2. **Install dependencies:**

```bash
npm install
```

3. **Setup environment variables:**

Create a `.env.local` file:

```bash
cp env.local.example .env.local
```

Then, fill in the required values:

```env
BROWSERLESS_URL=wss://production-sfo.browserless.io
BROWSERLESS_TOKEN=your_browserless_api_token_here
```

4. **Run the development server:**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ How It Works

- **API Endpoint** `/api/generate-pdf`
  - Accepts `POST` with a JSON payload:
    ```json
    { "url": "https://example.com" }
    ```
  - Validates input: Only `url` is allowed.
  - Connects to **Browserless** using WebSocket.
  - Ensures all images are loaded manually before PDF generation.
  - Streams the PDF response directly to the client (memory-efficient).

- **Frontend Page** `/`
  - Simple form to input URL.
  - Shows a download link once the PDF is ready.

---

## 📋 Submission Notes

- JSON validation handles unexpected fields.
- Memory-efficient streaming via `Readable.from()`.
- Custom solution for image loading (no `networkidle0` reliance).
- Clean and minimal frontend for better UX.
- `.env.local.example` is included for easy setup.

---

## 📸 Demo Screenshot

> _(You can add a screenshot after running locally)_

---

## 📄 License

This project is provided for assessment purposes only.

