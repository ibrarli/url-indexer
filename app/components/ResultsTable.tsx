'use client';

import { useState } from 'react';

interface Result {
  url: string;
  status: 'success' | 'error';
  error?: string;
}

interface Props {
  results: Result[];
  selectedSite: string;
}

export default function ResultsTable({ results, selectedSite }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = results.filter((res) => {
    const matchesSearch = res.url.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'SUCCESS' && res.status === 'success') ||
      (statusFilter === 'FAILED' && res.status === 'error');
    return matchesSearch && matchesStatus;
  });

  const exportCsv = () => {
    if (results.length === 0) return;
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['URL,Status,Error'].concat(results.map((r) => `"${r.url}","${r.status}","${r.error || ''}"`)).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `indexing_log_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section className="bg-white border border-gray-200 rounded-md p-5 space-y-4 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">API Request History & Audit Logs</h3>
          <p className="text-xs text-gray-500">
            Real-time execution details for Google Indexing API calls.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Filter by URL..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-white border border-gray-300 rounded px-2.5 py-1 text-xs text-gray-900 focus:outline-none focus:border-gray-900 w-48"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-gray-300 rounded px-2 py-1 text-xs text-gray-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUCCESS">Success (200 OK)</option>
            <option value="FAILED">Failed (Errors)</option>
          </select>

          <button
            onClick={exportCsv}
            disabled={results.length === 0}
            className="px-2.5 py-1 border border-gray-300 rounded bg-white hover:bg-gray-50 text-xs font-medium text-gray-700 flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto w-full">
        <table className="w-full text-left text-xs font-mono border-collapse">
          <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 font-sans font-medium uppercase text-[10px] tracking-wider">
            <tr>
              <th className="py-2.5 px-3">Timestamp</th>
              <th className="py-2.5 px-3">Property</th>
              <th className="py-2.5 px-3">Target URL</th>
              <th className="py-2.5 px-3">HTTP Code</th>
              <th className="py-2.5 px-3 text-right">Response</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-400 font-sans">
                  No execution logs available. Dispatch URLs above to record API history.
                </td>
              </tr>
            ) : (
              filtered.map((log, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition">
                  <td className="py-2.5 px-3 text-gray-500 whitespace-nowrap">
                    {new Date().toLocaleTimeString()}
                  </td>
                  <td className="py-2.5 px-3 font-sans font-medium text-gray-900 whitespace-nowrap">
                    {selectedSite || 'Default Domain'}
                  </td>
                  <td className="py-2.5 px-3 text-gray-900 truncate max-w-md">{log.url}</td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span
                      className={`font-semibold ${
                        log.status === 'success' ? 'text-emerald-700' : 'text-red-700'
                      }`}
                    >
                      {log.status === 'success' ? '200 OK' : '400 / 500 Error'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-sans">
                    <button
                      onClick={() => alert(`Log Details:\n${JSON.stringify(log, null, 2)}`)}
                      className="text-xs text-gray-600 hover:text-gray-900 underline cursor-pointer"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}