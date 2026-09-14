'use client';

import { useState, useEffect } from 'react';
import { fetchSitemapUrls } from '../actions/get-sitemap';

export interface IndexedPage {
  id: string;
  url: string;
  property: string;
  indexedAt: string;
  status: 'INDEXED' | 'DISCOVERED_NOT_INDEXED' | 'CRAWLED_NOT_INDEXED';
  lastCrawled?: string;
}

interface Props {
  pages?: IndexedPage[];
  selectedSite: string;
  onReindex?: (url: string) => void;
}

export default function IndexedPagesManager({
  pages = [],
  selectedSite,
  onReindex,
}: Props) {
  const [localPages, setLocalPages] = useState<IndexedPage[]>(pages);
  const [loadingSitemap, setLoadingSitemap] = useState<boolean>(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Sync prop changes into local state
  useEffect(() => {
    if (pages.length > 0) {
      setLocalPages(pages);
    }
  }, [pages]);

  // Handler to fetch site pages directly from sitemap.xml
  const handleFetchSitemap = async () => {
    if (!selectedSite) return;
    setLoadingSitemap(true);

    const res = await fetchSitemapUrls(selectedSite);

    if (res.success && res.urls && res.urls.length > 0) {
      const fetchedPages: IndexedPage[] = res.urls.map((url, index) => ({
        id: `sitemap-${index}-${Date.now()}`,
        url,
        property: selectedSite,
        indexedAt: new Date().toLocaleDateString(),
        status: 'INDEXED',
        lastCrawled: 'Via Sitemap',
      }));

      setLocalPages(fetchedPages);
    } else {
      alert(`Could not retrieve sitemap URLs: ${res.error || 'No URLs found.'}`);
    }

    setLoadingSitemap(false);
  };

  // Filter logic based on property, search query, and status
  const filteredPages = localPages.filter((page) => {
    const matchesSearch = page.url.toLowerCase().includes(search.toLowerCase());
    const matchesProperty =
      !selectedSite ||
      page.property === selectedSite ||
      page.url.includes(selectedSite.replace('sc-domain:', ''));
    const matchesStatus = statusFilter === 'ALL' || page.status === statusFilter;
    return matchesSearch && matchesProperty && matchesStatus;
  });

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  return (
    <section className="bg-white border border-gray-200 rounded-md p-5 space-y-4 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Registered & Indexed Pages
          </h3>
          <p className="text-xs text-gray-500">
            Catalog of active URLs indexed in Search Console for{' '}
            <span className="font-mono text-gray-800">{selectedSite || 'All Properties'}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleFetchSitemap}
            disabled={loadingSitemap || !selectedSite}
            className="px-3 py-1 bg-gray-900 hover:bg-gray-800 text-white rounded text-xs font-medium cursor-pointer transition disabled:opacity-50 flex items-center gap-1.5"
          >
            {loadingSitemap ? (
              <span>Syncing Sitemap...</span>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Fetch via Sitemap</span>
              </>
            )}
          </button>

          <span className="text-xs font-mono bg-gray-100 border border-gray-200 text-gray-700 px-2.5 py-1 rounded">
            Total Active: {filteredPages.length}
          </span>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          type="text"
          placeholder="Search active URLs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-white border border-gray-300 rounded px-2.5 py-1 text-xs text-gray-900 focus:outline-none focus:border-gray-900 w-full sm:w-72"
        />

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-gray-300 rounded px-2.5 py-1 text-xs text-gray-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Index States</option>
            <option value="INDEXED">Indexed & Active</option>
            <option value="DISCOVERED_NOT_INDEXED">Discovered (Pending)</option>
            <option value="CRAWLED_NOT_INDEXED">Crawled (Not Indexed)</option>
          </select>
        </div>
      </div>

      {/* Table Display */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left text-xs font-mono border-collapse">
          <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 font-sans font-medium uppercase text-[10px] tracking-wider">
            <tr>
              <th className="py-2.5 px-3">Indexed Page URL</th>
              <th className="py-2.5 px-3">Coverage Status</th>
              <th className="py-2.5 px-3">Last Googlebot Crawl</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-800">
            {filteredPages.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-gray-400 font-sans">
                  No indexed pages found. Click <span className="font-semibold text-gray-700">"Fetch via Sitemap"</span> above to load your active site pages.
                </td>
              </tr>
            ) : (
              filteredPages.map((page) => (
                <tr key={page.id} className="hover:bg-gray-50 transition">
                  {/* URL */}
                  <td className="py-2.5 px-3 font-medium text-gray-900 truncate max-w-md">
                    {page.url}
                  </td>

                  {/* Coverage Status */}
                  <td className="py-2.5 px-3 whitespace-nowrap font-sans">
                    {page.status === 'INDEXED' && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Indexed
                      </span>
                    )}
                    {page.status === 'DISCOVERED_NOT_INDEXED' && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        Pending Crawl
                      </span>
                    )}
                    {page.status === 'CRAWLED_NOT_INDEXED' && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-50 text-red-700 border border-red-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                        Excluded
                      </span>
                    )}
                  </td>

                  {/* Last Crawl */}
                  <td className="py-2.5 px-3 text-gray-500 whitespace-nowrap">
                    {page.lastCrawled || 'Recently'}
                  </td>

                  {/* Actions */}
                  <td className="py-2.5 px-3 text-right font-sans space-x-3">
                    <button
                      onClick={() => handleCopy(page.url)}
                      className="text-xs text-gray-600 hover:text-gray-900 underline cursor-pointer"
                    >
                      {copiedUrl === page.url ? 'Copied!' : 'Copy'}
                    </button>

                    {onReindex && (
                      <button
                        onClick={() => onReindex(page.url)}
                        className="text-xs text-gray-900 hover:text-black font-semibold underline cursor-pointer"
                      >
                        Re-Index
                      </button>
                    )}

                    <a
                      href={`https://www.google.com/search?q=site:${encodeURIComponent(page.url)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-gray-600 hover:text-gray-900 underline cursor-pointer"
                    >
                      Verify on Google ↗
                    </a>
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