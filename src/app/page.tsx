'use client';

import { useState } from 'react';

export default function HomePage() {
  const [url, setUrl] = useState('');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setPdfUrl(null);

    // Format the URL - ensure it has the correct protocol
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: formattedUrl }),
      });

      if (!response.ok) {
        const { error } = await response.json();
        setError(error);
        setLoading(false);
        return;
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      setPdfUrl(downloadUrl);
    } catch (err) {
      setError('Failed to generate PDF.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">Next.js PDF Generator</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Enter website URL (e.g., example.com)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          className="border px-4 py-2 rounded w-80"
        />
        <p className="text-xs text-gray-500 mt-1">
          The https:// prefix will be added automatically if not provided
        </p>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate PDF'}
        </button>
      </form>

      {error && <p className="text-red-500 mt-4">{error}</p>}

      {pdfUrl && (
        <a
          href={pdfUrl}
          download="generated.pdf"
          className="mt-6 text-blue-700 underline"
        >
          Download your PDF
        </a>
      )}
    </div>
  );
}
