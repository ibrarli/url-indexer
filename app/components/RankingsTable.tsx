'use client';

import { useState } from 'react';
import { getGscPerformanceData } from '../actions/gsc-analytics';

export default function RankingsTable({ siteUrl }: { siteUrl: string }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchRankings = async () => {
    setLoading(true);
    setErrorMessage(null);

    const res = await getGscPerformanceData(siteUrl);

    if (res.success) {
      setData(res.rows ?? []);
    } else {
      setData([]);
      setErrorMessage(res.error || 'An error occurred while fetching performance data.');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
        <div>
          <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Search Console Analytics</h4>
          <p className="text-xs text-gray-500">Live query keywords, landing paths, and search positions</p>
        </div>
        <button
          onClick={fetchRankings}
          disabled={loading}
          className="bg-gray-900 hover:bg-black text-white text-xs px-3 py-1.5 rounded font-medium disabled:opacity-50 cursor-pointer"
        >
          {loading ? 'Fetching Analytics...' : 'Fetch Analytics Metrics'}
        </button>
      </div>

      {errorMessage && (
        <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded font-mono">
          <strong>API Error:</strong> {errorMessage}
        </div>
      )}

      {data && data.length > 0 && (
        <div className="overflow-x-auto w-full">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-600 bg-gray-50/50 uppercase text-[10px] font-bold">
                <th className="py-2.5 px-3">Top Keyword</th>
                <th className="py-2.5 px-3">Page Path</th>
                <th className="py-2.5 px-3 text-right">Avg Position</th>
                <th className="py-2.5 px-3 text-right">Clicks</th>
                <th className="py-2.5 px-3 text-right">Impressions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 font-mono">
              {data.map((row, idx) => (
                <tr key={idx} className="text-gray-900 hover:bg-gray-50">
                  <td className="py-2.5 px-3 font-sans font-medium text-gray-900">{row.keys?.[1] || 'N/A'}</td>
                  <td className="py-2.5 px-3 text-gray-600 truncate max-w-sm">{row.keys?.[0] || 'N/A'}</td>
                  <td className="py-2.5 px-3 text-right font-semibold">
                    #{row.position ? row.position.toFixed(1) : '-'}
                  </td>
                  <td className="py-2.5 px-3 text-right text-emerald-700 font-semibold">{row.clicks ?? 0}</td>
                  <td className="py-2.5 px-3 text-right text-gray-600">{row.impressions ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.length === 0 && !errorMessage && (
        <div className="p-6 text-center bg-gray-50 rounded border border-gray-200">
          <p className="text-xs font-semibold text-gray-800">No Performance Data Found</p>
          <p className="text-xs text-gray-500 mt-1">
            Google Search Console typically takes up to 48 hours to compile search performance metrics for newly verified properties.
          </p>
        </div>
      )}
    </div>
  );
}