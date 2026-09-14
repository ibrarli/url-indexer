'use client';

import { useState, useEffect } from 'react';
import { submitUrlsToGSC } from './actions/indexing';
import { getVerifiedSites } from './actions/get-sites';
import UrlInputForm from './components/UrlInputForm';
import ResultsTable from './components/ResultsTable';
import RankingsTable from './components/RankingsTable';
import SetupModal from './components/SetupModal';
import AddProjectModal from './components/AddProjectModal';
import IndexedPagesManager from './components/IndexedPagesManager';
import Toast, { ToastMessage } from './components/Toast';
import { inspectUrlGSC } from './actions/inspect-url';

export default function Page() {
  const [activeTab, setActiveTab] = useState<'indexing' | 'rankings' | 'inspect' | 'indexed'>('indexing');
  const [loading, setLoading] = useState(false);
  const [inspectLoading, setInspectLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const [sites, setSites] = useState<string[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [fetchingSites, setFetchingSites] = useState<boolean>(true);
  const [sitesError, setSitesError] = useState<string | null>(null);

  // Sidebar collapse state
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Modals
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);

  // Notification Toasts State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const notify = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, title, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Single URL Inspection State
  const [singleUrl, setSingleUrl] = useState('');
  const [inspectResult, setInspectResult] = useState<any | null>(null);

  useEffect(() => {
    async function loadSites() {
      setFetchingSites(true);
      setSitesError(null);
      const res = await getVerifiedSites();

      if (res.success && res.sites && res.sites.length > 0) {
        setSites(res.sites);
        setSelectedSite(res.sites[0]);
      } else if (res.success && res.sites?.length === 0) {
        setSitesError('No verified properties found.');
      } else {
        setSitesError(res.error || 'Failed to fetch properties.');
      }
      setFetchingSites(false);
    }

    loadSites();
  }, []);

  useEffect(() => {
    setInspectResult(null);
    setSingleUrl('');
  }, [selectedSite]);

  const handleIndexingSubmit = async (urls: string[], action: 'URL_UPDATED' | 'URL_DELETED') => {
    setLoading(true);
    setResults([]);

    const res = await submitUrlsToGSC(urls, action);

    if (res.success && res.results) {
      setResults(res.results);
      notify('success', 'Batch API Request Processed', `Submitted ${urls.length} URL(s) to Google.`);
    } else {
      notify('error', 'Indexing Submission Failed', res.error || 'An unexpected error occurred.');
    }

    setLoading(false);
  };

  const handleInspectUrl = async () => {
    if (!singleUrl.trim() || !selectedSite) return;
    setInspectLoading(true);

    const res = await inspectUrlGSC(singleUrl, selectedSite);

    if (res.success && res.data) {
      setInspectResult({
        status: 200,
        data: res.data.indexStatusResult ?? res.data,
      });
      notify('success', 'Metadata Inspected Successfully');
    } else {
      notify('error', 'URL Inspection Failed', res.error);
    }

    setInspectLoading(false);
  };

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900 font-sans antialiased w-full relative">
      {/* Toast Notification Container */}
      <Toast toasts={toasts} onClose={removeToast} />

      {/* Sidebar Navigation */}
      <aside
        className={`bg-white border-r border-gray-200 flex flex-col justify-between transition-all duration-200 ease-in-out shrink-0 sticky top-0 h-screen ${
          sidebarOpen ? 'w-64' : 'w-16'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header / Brand */}
          <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4">
            {sidebarOpen && (
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="truncate">
                  <span className="font-semibold text-sm text-gray-900 block leading-tight truncate">
                    Aral Studio
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono block leading-none truncate">
                    Google Indexing Engine
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
              title={sidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={sidebarOpen ? "M11 19l-7-7 7-7m8 14l-7-7 7-7" : "M13 5l7 7-7 7M5 5l7 7-7 7"} />
              </svg>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 flex-1">
            <button
              onClick={() => setActiveTab('indexing')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded text-xs font-medium transition cursor-pointer ${
                activeTab === 'indexing'
                  ? 'bg-gray-100 text-gray-900 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <svg className="w-4 h-4 shrink-0 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {sidebarOpen && <span>Batch Indexing</span>}
            </button>

            <button
              onClick={() => setActiveTab('indexed')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded text-xs font-medium transition cursor-pointer ${
                activeTab === 'indexed'
                  ? 'bg-gray-100 text-gray-900 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <svg className="w-4 h-4 shrink-0 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {sidebarOpen && <span>Indexed Pages</span>}
            </button>

            <button
              onClick={() => setActiveTab('inspect')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded text-xs font-medium transition cursor-pointer ${
                activeTab === 'inspect'
                  ? 'bg-gray-100 text-gray-900 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <svg className="w-4 h-4 shrink-0 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {sidebarOpen && <span>Inspect Metadata</span>}
            </button>

            <button
              onClick={() => setActiveTab('rankings')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded text-xs font-medium transition cursor-pointer ${
                activeTab === 'rankings'
                  ? 'bg-gray-100 text-gray-900 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <svg className="w-4 h-4 shrink-0 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              {sidebarOpen && <span>Search Analytics</span>}
            </button>
          </nav>

          {/* Sidebar Footer Controls */}
          <div className="p-3 border-t border-gray-200 space-y-2">
            <button
              onClick={() => setIsSetupModalOpen(true)}
              className="w-full flex items-center justify-center gap-1.5 h-8 px-3 bg-gray-900 hover:bg-gray-800 text-white rounded text-xs font-medium cursor-pointer transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 0121 9z" />
              </svg>
              {sidebarOpen && <span>API Credentials</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Sticky Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30 h-14 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500">Active Property:</span>
            {fetchingSites ? (
              <div className="h-8 w-56 bg-gray-100 border border-gray-200 rounded text-xs px-2 flex items-center text-gray-400 font-mono">
                Loading properties...
              </div>
            ) : sitesError ? (
              <input
                type="text"
                placeholder="sc-domain:example.com"
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                className="h-8 w-56 bg-white border border-red-300 rounded text-xs px-2 font-mono text-gray-900 focus:outline-none focus:border-gray-900"
              />
            ) : (
              <select
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                className="h-8 w-60 bg-white border border-gray-300 rounded text-xs font-mono text-gray-800 px-2 focus:outline-none focus:border-gray-900 cursor-pointer"
              >
                {sites.map((site) => (
                  <option key={site} value={site}>
                    {site}
                  </option>
                ))}
              </select>
            )}
          </div>

          <button
            onClick={() => {
              setFetchingSites(true);
              getVerifiedSites().then((res) => {
                if (res.success && res.sites) {
                  setSites(res.sites);
                  if (!selectedSite && res.sites.length > 0) setSelectedSite(res.sites[0]);
                  notify('info', 'Properties Synced', `Loaded ${res.sites.length} site(s)`);
                }
                setFetchingSites(false);
              });
            }}
            className="px-2.5 py-1 text-xs text-gray-700 hover:text-gray-900 border border-gray-300 rounded bg-white hover:bg-gray-50 cursor-pointer font-medium"
          >
            Sync Properties
          </button>
        </header>

        {/* Main Body */}
        <main className="w-full px-6 py-6 space-y-6 flex-1 overflow-y-auto">
          {/* Domain Overview & API Health Bar */}
          <section className="bg-white border border-gray-200 rounded-md p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-gray-50 border border-gray-200 rounded">
                <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Active Target Property</p>
                <p className="text-sm font-mono font-bold text-gray-900">{selectedSite || 'No Domain Selected'}</p>
              </div>
            </div>
          </section>

          {/* Tab Content Display */}
          <section className="bg-white border border-gray-200 rounded-md p-4">
            {activeTab === 'indexing' && (
              <div className="space-y-6">
                <UrlInputForm onSubmit={handleIndexingSubmit} loading={loading} activeDomain={selectedSite} />
              </div>
            )}

            {activeTab === 'indexed' && (
              <IndexedPagesManager
                selectedSite={selectedSite}
                onReindex={(url) => handleIndexingSubmit([url], 'URL_UPDATED')}
              />
            )}

            {activeTab === 'inspect' && (
              <div className="space-y-4 pt-1">
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="Enter URL to check indexing notification metadata..."
                    value={singleUrl}
                    onChange={(e) => setSingleUrl(e.target.value)}
                    className="flex-1 bg-white border border-gray-300 rounded p-2 text-xs font-mono text-gray-900 focus:outline-none focus:border-gray-900"
                  />
                  <button
                    onClick={handleInspectUrl}
                    disabled={!singleUrl.trim() || inspectLoading}
                    className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded text-xs font-medium disabled:opacity-50 cursor-pointer flex items-center gap-2"
                  >
                    {inspectLoading ? 'Inspecting...' : 'Inspect Status'}
                  </button>
                </div>

                {inspectResult && (
                  <div className="bg-gray-50 border border-gray-200 rounded p-3 text-xs font-mono">
                    <div className="flex items-center justify-between mb-2 pb-1 border-b border-gray-200">
                      <span className="font-semibold text-gray-700">HTTP Status: {inspectResult.status}</span>
                      <span className="text-[10px] text-gray-500">searchconsole.urlInspection.index.inspect</span>
                    </div>
                    <pre className="text-gray-800 overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(inspectResult.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'rankings' && (
              <div>
                {!selectedSite ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded font-mono">
                    Please select a property from the top header to fetch Search Console metrics.
                  </div>
                ) : (
                  <RankingsTable siteUrl={selectedSite} />
                )}
              </div>
            )}
          </section>

          {/* Audit Log Section */}
          <ResultsTable results={results} selectedSite={selectedSite} />
        </main>
      </div>

      {/* Modals */}
      <SetupModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        activeDomain={selectedSite}
      />

      <AddProjectModal
        isOpen={isAddProjectModalOpen}
        onClose={() => setIsAddProjectModalOpen(false)}
        onAddProject={(newDomain) => {
          setSites((prev) => [...prev, newDomain]);
          setSelectedSite(newDomain);
          notify('success', 'Project Added', `Selected domain: ${newDomain}`);
        }}
      />
    </div>
  );
}