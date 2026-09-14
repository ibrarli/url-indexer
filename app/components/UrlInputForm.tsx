'use client';

import { useState, useEffect } from 'react';

interface Props {
  onSubmit: (urls: string[], action: 'URL_UPDATED' | 'URL_DELETED') => void;
  loading: boolean;
  activeDomain: string;
}

export default function UrlInputForm({ onSubmit, loading, activeDomain }: Props) {
  const [urlInputs, setUrlInputs] = useState<string[]>(['']);
  const [rawText, setRawText] = useState('');
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [action, setAction] = useState<'URL_UPDATED' | 'URL_DELETED'>('URL_UPDATED');

  // Helper to format active domain into a standard base URL
  const getFormattedBaseUrl = (domain: string): string => {
    if (!domain) return 'https://';
    let clean = domain.replace(/^sc-domain:/, '').trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = `https://${clean}`;
    }
    return clean.endsWith('/') ? clean : `${clean}/`;
  };

  // Pre-fill input when active target domain changes
  useEffect(() => {
    const defaultUrl = getFormattedBaseUrl(activeDomain);
    setUrlInputs([defaultUrl]);
    setRawText(defaultUrl);
  }, [activeDomain]);

  // Helper function to sanitize individual URLs
  const sanitizeUrl = (input: string): string => {
    let clean = input.trim();
    if (!clean) return '';
    if (clean.startsWith('sc-domain:')) {
      clean = clean.replace('sc-domain:', '');
    }
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = `https://${clean}`;
    }
    return clean;
  };

  // Extract parsed URLs depending on active mode
  const parsedUrls = isBulkMode
    ? rawText.split('\n').map(sanitizeUrl).filter((url) => url.length > 0 && url !== 'https://')
    : urlInputs.map(sanitizeUrl).filter((url) => url.length > 0 && url !== 'https://');

  const handleInputChange = (index: number, value: string) => {
    const updated = [...urlInputs];
    updated[index] = value;
    setUrlInputs(updated);
  };

  const handleAddInput = () => {
    const defaultUrl = getFormattedBaseUrl(activeDomain);
    setUrlInputs((prev) => [...prev, defaultUrl]);
  };

  const handleRemoveInput = (index: number) => {
    if (urlInputs.length === 1) return;
    setUrlInputs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedUrls.length === 0) return;
    onSubmit(parsedUrls, action);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
            Target URL(s)
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsBulkMode(!isBulkMode)}
              className="text-[11px] text-gray-600 hover:text-gray-900 underline font-medium cursor-pointer"
            >
              {isBulkMode ? 'Switch to Single Input Mode' : 'Switch to Bulk Mode'}
            </button>
            <span className="text-[11px] font-mono text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded">
              {parsedUrls.length} valid URL(s)
            </span>
          </div>
        </div>

        {!isBulkMode ? (
          /* Single / Dynamic Multi-Input View */
          <div className="space-y-2">
            {urlInputs.map((url, index) => (
              <div key={index} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  placeholder="https://example.com/page"
                  className="flex-1 bg-white border border-gray-300 rounded p-2 text-xs font-mono text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900"
                />
                {urlInputs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveInput(index)}
                    className="p-2 text-gray-400 hover:text-red-600 transition cursor-pointer"
                    title="Remove input field"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddInput}
              className="mt-1 flex items-center gap-1.5 text-xs text-gray-700 hover:text-gray-900 font-medium px-2 py-1 rounded border border-dashed border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100 cursor-pointer transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Another URL</span>
            </button>
          </div>
        ) : (
          /* Bulk Textarea View */
          <textarea
            rows={5}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="https://example.com/page-1&#10;https://example.com/page-2"
            className="w-full bg-white border border-gray-300 rounded p-3 text-xs font-mono text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900"
          />
        )}
      </div>

      {loading && (
        <div className="bg-gray-50 p-3 rounded border border-gray-200 space-y-1.5">
          <div className="flex justify-between text-xs font-mono text-gray-700">
            <span>Processing Batch Queue...</span>
            <span>Batch Dispatching</span>
          </div>
          <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
            <div className="bg-gray-900 h-full animate-pulse w-2/3"></div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-gray-700">Notification Type:</label>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value as 'URL_UPDATED' | 'URL_DELETED')}
            className="bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs font-medium text-gray-800 focus:outline-none focus:border-gray-900 cursor-pointer"
          >
            <option value="URL_UPDATED">URL_UPDATED (Publish/Update Index)</option>
            <option value="URL_DELETED">URL_DELETED (Remove from Index)</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading || parsedUrls.length === 0}
          className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded text-xs font-medium disabled:opacity-50 transition flex items-center gap-1.5 cursor-pointer"
        >
          {loading ? (
            <span>Processing Request...</span>
          ) : (
            <span>Submit Request ({parsedUrls.length})</span>
          )}
        </button>
      </div>
    </form>
  );
}