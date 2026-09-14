"use client"
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Globe, 
  Send, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Key, 
  Plus, 
  Download, 
  Search, 
  RefreshCw, 
  Info, 
  Layers, 
  Database, 
  Trash2, 
  FileText, 
  ExternalLink,
  ShieldCheck,
  Zap,
  HelpCircle,
  Code,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';

const DEFAULT_PROJECTS = [
  {
    id: 'proj_1',
    name: 'Main Company Website',
    domain: 'https://example.com',
    serviceAccountEmail: 'gsc-indexing@example-project-1234.iam.gserviceaccount.com',
    accessToken: '',
    credentialsConfigured: false,
    dailyQuotaLimit: 200,
    dailySubmitted: 14,
  },
  {
    id: 'proj_2',
    name: 'Tech Blog & Guides',
    domain: 'https://mytechblog.org',
    serviceAccountEmail: 'gsc-bot@techblog-seo.iam.gserviceaccount.com',
    accessToken: '',
    credentialsConfigured: false,
    dailyQuotaLimit: 200,
    dailySubmitted: 45,
  },
  {
    id: 'proj_3',
    name: 'E-Commerce Store Demo',
    domain: 'https://shop-demo.net',
    serviceAccountEmail: 'indexing-service@shop-demo-app.iam.gserviceaccount.com',
    accessToken: '',
    credentialsConfigured: false,
    dailyQuotaLimit: 200,
    dailySubmitted: 0,
  }
];

const INITIAL_LOGS = [
  {
    id: 'log_101',
    timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    projectId: 'proj_1',
    projectName: 'Main Company Website',
    url: 'https://example.com/blog/getting-started-guide',
    type: 'URL_UPDATED',
    status: 'SUCCESS',
    httpCode: 200,
    latencyMs: 240,
    apiResponse: JSON.stringify({
      urlNotificationMetadata: {
        url: "https://example.com/blog/getting-started-guide",
        latestUpdate: {
          type: "URL_UPDATED",
          notifyTime: new Date().toISOString()
        }
      }
    }, null, 2)
  },
  {
    id: 'log_102',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    projectId: 'proj_2',
    projectName: 'Tech Blog & Guides',
    url: 'https://mytechblog.org/news/tech-trends-2026',
    type: 'URL_UPDATED',
    status: 'SUCCESS',
    httpCode: 200,
    latencyMs: 310,
    apiResponse: JSON.stringify({
      urlNotificationMetadata: {
        url: "https://mytechblog.org/news/tech-trends-2026",
        latestUpdate: {
          type: "URL_UPDATED",
          notifyTime: new Date().toISOString()
        }
      }
    }, null, 2)
  }
];

export default function App() {
  // Application State
  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem('gsc_simple_projects');
    return saved ? JSON.parse(saved) : DEFAULT_PROJECTS;
  });
  
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || 'proj_1');
  const [logs, setLogs] = useState(() => {
    const saved = localStorage.getItem('gsc_simple_logs');
    return saved ? JSON.parse(saved) : INITIAL_LOGS;
  });

  // UI State
  const [activeTab, setActiveTab] = useState('single'); // 'single' | 'bulk' | 'inspect'
  const [singleUrl, setSingleUrl] = useState('');
  const [bulkUrlsText, setBulkUrlsText] = useState('');
  const [indexingAction, setIndexingAction] = useState('URL_UPDATED'); // 'URL_UPDATED' | 'URL_DELETED'
  const [useLiveApi, setUseLiveApi] = useState(false);
  const [accessTokenInput, setAccessTokenInput] = useState('');
  const [serviceAccountJsonInput, setServiceAccountJsonInput] = useState('');

  // Modals & Drawers
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);
  const [inspectResult, setInspectResult] = useState(null);

  // Batch Execution State
  const [isProcessing, setIsProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const [toast, setToast] = useState(null);
  const [copiedText, setCopiedText] = useState(false);

  // Filters for History Table
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [projectFilter, setProjectFilter] = useState('ALL');

  // Persistence
  useEffect(() => {
    localStorage.setItem('gsc_simple_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('gsc_simple_logs', JSON.stringify(logs));
  }, [logs]);

  const activeProject = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId) || projects[0];
  }, [projects, selectedProjectId]);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const parseAndValidateUrls = (rawInput) => {
    if (!rawInput || !rawInput.trim()) return [];
    
    const lines = rawInput.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    const validUrls = [];

    lines.forEach(line => {
      try {
        const urlObj = new URL(line);
        if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
          validUrls.push(urlObj.href);
        }
      } catch (e) {
        // Skip invalid URL strings
      }
    });

    return [...new Set(validUrls)];
  };

  const parsedBulkUrls = useMemo(() => {
    return parseAndValidateUrls(bulkUrlsText);
  }, [bulkUrlsText]);

  const sendGoogleIndexingApiRequest = async (targetUrl, actionType, token) => {
    const endpoint = 'https://indexing.googleapis.com/v1/urlNotifications:publish';
    const payload = {
      url: targetUrl,
      type: actionType
    };

    const startTime = performance.now();

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const latencyMs = Math.round(performance.now() - startTime);
      const data = await response.json();

      return {
        ok: response.ok,
        status: response.status,
        latencyMs,
        data
      };
    } catch (error) {
      const latencyMs = Math.round(performance.now() - startTime);
      return {
        ok: false,
        status: 0,
        latencyMs,
        data: { error: { message: error.message || 'Network error or CORS blocked' } }
      };
    }
  };

  const executeSubmissionBatch = async (urlsToSubmit) => {
    if (urlsToSubmit.length === 0) {
      showToast('Please enter at least one valid URL.', 'error');
      return;
    }

    // Check token if live mode is toggled on
    const currentToken = accessTokenInput.trim() || activeProject.accessToken;
    if (useLiveApi && !currentToken) {
      showToast('Please enter an OAuth2 Bearer Access Token in API Settings first!', 'error');
      setIsSetupModalOpen(true);
      return;
    }

    setIsProcessing(true);
    setBatchProgress({ current: 0, total: urlsToSubmit.length });

    let currentSubmittedCount = activeProject.dailySubmitted;
    const newLogs = [];

    for (let i = 0; i < urlsToSubmit.length; i++) {
      const url = urlsToSubmit[i];
      setBatchProgress({ current: i + 1, total: urlsToSubmit.length });

      let logItem;

      if (useLiveApi && currentToken) {
        // Execute REAL HTTP call to Google's Indexing API Endpoint
        const result = await sendGoogleIndexingApiRequest(url, indexingAction, currentToken);
        
        if (result.ok) {
          currentSubmittedCount += 1;
        }

        logItem = {
          id: 'log_' + Date.now() + '_' + i,
          timestamp: new Date().toISOString(),
          projectId: activeProject.id,
          projectName: activeProject.name,
          url: url,
          type: indexingAction,
          status: result.ok ? 'SUCCESS' : 'FAILED',
          httpCode: result.status,
          latencyMs: result.latencyMs,
          apiResponse: JSON.stringify(result.data, null, 2)
        };
      } else {
        // Simulated API call mode for UI testing and workflow demonstration
        await new Promise(res => setTimeout(res, 350));

        const isQuotaExceeded = currentSubmittedCount >= activeProject.dailyQuotaLimit;
        let status = 'SUCCESS';
        let httpCode = 200;
        let responseObj = {
          urlNotificationMetadata: {
            url: url,
            latestUpdate: {
              type: indexingAction,
              notifyTime: new Date().toISOString()
            }
          }
        };

        if (isQuotaExceeded) {
          status = 'FAILED';
          httpCode = 429;
          responseObj = {
            error: {
              code: 429,
              message: "Quota exceeded for quota metric 'Indexing API requests' and limit 'Indexing API requests per day'",
              status: "RESOURCE_EXHAUSTED"
            }
          };
        } else {
          currentSubmittedCount += 1;
        }

        logItem = {
          id: 'log_' + Date.now() + '_' + i,
          timestamp: new Date().toISOString(),
          projectId: activeProject.id,
          projectName: activeProject.name,
          url: url,
          type: indexingAction,
          status: status,
          httpCode: httpCode,
          latencyMs: Math.floor(Math.random() * 180) + 120,
          apiResponse: JSON.stringify(responseObj, null, 2)
        };
      }

      newLogs.unshift(logItem);
    }

    // Update state
    setProjects(prev => prev.map(p => {
      if (p.id === activeProject.id) {
        return { ...p, dailySubmitted: currentSubmittedCount };
      }
      return p;
    }));

    setLogs(prev => [...newLogs, ...prev]);
    setIsProcessing(false);

    showToast(`Completed processing ${urlsToSubmit.length} URL(s).`, 'success');

    if (activeTab === 'single') setSingleUrl('');
    if (activeTab === 'bulk') setBulkUrlsText('');
  };

  const handleInspectUrl = async () => {
    if (!singleUrl.trim()) {
      showToast('Enter a URL to inspect metadata.', 'error');
      return;
    }

    const currentToken = accessTokenInput.trim() || activeProject.accessToken;
    setIsProcessing(true);

    if (useLiveApi && currentToken) {
      try {
        const encodedUrl = encodeURIComponent(singleUrl.trim());
        const response = await fetch(`https://indexing.googleapis.com/v1/urlNotifications/metadata?url=${encodedUrl}`, {
          headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        const data = await response.json();
        setInspectResult({ status: response.status, data });
      } catch (err) {
        setInspectResult({ status: 0, data: { error: err.message } });
      }
    } else {
      await new Promise(r => setTimeout(r, 400));
      setInspectResult({
        status: 200,
        data: {
          urlNotificationMetadata: {
            url: singleUrl.trim(),
            latestUpdate: {
              type: "URL_UPDATED",
              notifyTime: new Date(Date.now() - 3600000 * 4).toISOString()
            }
          }
        }
      });
    }

    setIsProcessing(false);
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = log.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            log.projectName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || log.status === statusFilter;
      const matchesProject = projectFilter === 'ALL' || log.projectId === projectFilter;

      return matchesSearch && matchesStatus && matchesProject;
    });
  }, [logs, searchQuery, statusFilter, projectFilter]);

  const globalStats = useMemo(() => {
    const totalSubmitted = logs.length;
    const successful = logs.filter(l => l.status === 'SUCCESS').length;
    const successRate = totalSubmitted > 0 ? Math.round((successful / totalSubmitted) * 100) : 100;
    
    return {
      totalSubmitted,
      successRate,
      quotaUsedPercent: Math.round((activeProject.dailySubmitted / activeProject.dailyQuotaLimit) * 100)
    };
  }, [logs, activeProject]);

  const exportLogsCsv = () => {
    const headers = ['Timestamp', 'Project', 'URL', 'Action Type', 'Status', 'HTTP Code', 'Latency (ms)'];
    const csvRows = filteredLogs.map(l => [
      `"${l.timestamp}"`,
      `"${l.projectName}"`,
      `"${l.url}"`,
      `"${l.type}"`,
      `"${l.status}"`,
      l.httpCode,
      l.latencyMs
    ].join(','));

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...csvRows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `gsc_indexing_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported CSV successfully!', 'success');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans antialiased selection:bg-gray-200">
      
      {/* HEADER SECTION */}
      {}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded border border-gray-900 bg-gray-900 flex items-center justify-center text-white font-bold text-sm">
              G
            </div>
            <div>
              <h1 className="font-semibold text-base tracking-tight text-gray-900">
                Google Search Console Indexing Manager
              </h1>
              <p className="text-xs text-gray-500">
                Direct API Submission Engine • Bypass 10 URLs/Day UI Limit
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsSetupModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded border border-gray-300 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
            >
              <Key className="w-3.5 h-3.5 text-gray-600" />
              <span>API Credentials & Auth</span>
            </button>
          </div>
        </div>
      </header>

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50">
          <div className={`px-4 py-2.5 rounded border text-xs font-medium shadow-sm flex items-center space-x-2 ${
            toast.type === 'error' 
              ? 'bg-red-50 text-red-800 border-red-200' 
              : toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-gray-900 text-white border-gray-900'
          }`}>
            {toast.type === 'error' ? <XCircle className="w-4 h-4 text-red-600" /> : <CheckCircle className="w-4 h-4 text-emerald-600" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      {}
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        
        {/* TOP PROJECT & METRICS CONTROL BAR */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Active Project Selector */}
          <div className="md:col-span-1 bg-white border border-gray-200 rounded-md p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  Target Project
                </span>
                <button
                  onClick={() => setIsAddProjectModalOpen(true)}
                  className="text-xs text-gray-900 hover:underline flex items-center gap-0.5 font-medium"
                >
                  <Plus className="w-3 h-3" /> New
                </button>
              </div>

              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full bg-white border border-gray-300 text-gray-900 text-xs rounded p-2 focus:outline-none focus:border-gray-900 font-medium"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <p className="text-xs text-gray-500 mt-2 truncate font-mono">
                {activeProject.domain}
              </p>
            </div>

            <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>Service Account:</span>
              <span className="font-mono text-[10px] text-gray-600 truncate max-w-[120px]" title={activeProject.serviceAccountEmail}>
                {activeProject.serviceAccountEmail.split('@')[0]}
              </span>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Metric 1: Quota tracker */}
            <div className="bg-white border border-gray-200 rounded-md p-4 flex flex-col justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Daily API Quota</span>
              <div className="mt-2">
                <div className="flex items-baseline space-x-1">
                  <span className="text-2xl font-bold text-gray-900 font-mono">
                    {activeProject.dailySubmitted}
                  </span>
                  <span className="text-xs text-gray-500 font-mono">/ {activeProject.dailyQuotaLimit}</span>
                </div>
                <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="bg-gray-900 h-full"
                    style={{ width: `${Math.min(globalStats.quotaUsedPercent, 100)}%` }}
                  ></div>
                </div>
              </div>
              <span className="text-[11px] text-gray-500 mt-2">Default API quota: 200/day</span>
            </div>

            {/* Metric 2: Total Submitted */}
            <div className="bg-white border border-gray-200 rounded-md p-4 flex flex-col justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Total Logged Submissions</span>
              <div className="mt-2">
                <div className="text-2xl font-bold text-gray-900 font-mono">
                  {globalStats.totalSubmitted}
                </div>
                <span className="text-[11px] text-gray-500">Across all projects in session</span>
              </div>
              <span className="text-[11px] text-emerald-700 font-medium">Ready to execute</span>
            </div>

            {/* Metric 3: Success Rate */}
            <div className="bg-white border border-gray-200 rounded-md p-4 flex flex-col justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Success Rate</span>
              <div className="mt-2">
                <div className="text-2xl font-bold text-gray-900 font-mono">
                  {globalStats.successRate}%
                </div>
                <span className="text-[11px] text-gray-500">HTTP 200 OK API responses</span>
              </div>
              <span className="text-[11px] text-gray-500">
                {logs.filter(l => l.status === 'FAILED').length} errors
              </span>
            </div>

          </div>
        </div>

        {/* INDEXING REQUEST HUB */}
        {}
        <section className="bg-white border border-gray-200 rounded-md p-5 space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 gap-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                Submit URL Indexing Requests
              </h2>
              <p className="text-xs text-gray-500">
                Send publish or delete notifications to Google Search Console for instant crawling.
              </p>
            </div>

            {/* Live API Mode Toggle */}
            <div className="flex items-center space-x-3 text-xs bg-gray-50 px-3 py-1.5 rounded border border-gray-200">
              <span className="text-gray-600 font-medium">Execution Engine:</span>
              <button
                type="button"
                onClick={() => setUseLiveApi(!useLiveApi)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition ${
                  useLiveApi 
                    ? 'bg-emerald-600 text-white border-emerald-600' 
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                {useLiveApi ? 'Live GSC HTTP API Mode' : 'Simulated API Sandbox'}
              </button>
            </div>
          </div>

          {/* Action Payload Switcher & Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            
            {/* Tabs */}
            <div className="flex items-center space-x-2 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('single')}
                className={`pb-2 px-1 font-medium border-b-2 transition ${
                  activeTab === 'single'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                Single URL
              </button>
              <button
                onClick={() => setActiveTab('bulk')}
                className={`pb-2 px-1 font-medium border-b-2 transition ${
                  activeTab === 'bulk'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                Bulk URLs ({parsedBulkUrls.length} Ready)
              </button>
              <button
                onClick={() => setActiveTab('inspect')}
                className={`pb-2 px-1 font-medium border-b-2 transition ${
                  activeTab === 'inspect'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                Metadata Status Inspector
              </button>
            </div>

            {/* Notification Action Selector */}
            {activeTab !== 'inspect' && (
              <div className="flex items-center space-x-2">
                <span className="text-gray-500">Action:</span>
                <select
                  value={indexingAction}
                  onChange={(e) => setIndexingAction(e.target.value)}
                  className="bg-white border border-gray-300 text-gray-900 rounded px-2 py-1 focus:outline-none focus:border-gray-900 font-mono text-xs"
                >
                  <option value="URL_UPDATED">URL_UPDATED (Publish / Re-crawl)</option>
                  <option value="URL_DELETED">URL_DELETED (Remove from Index)</option>
                </select>
              </div>
            )}
          </div>

          {/* TAB 1: SINGLE URL */}
          {activeTab === 'single' && (
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Target URL (Must belong to property: <code className="font-mono text-gray-900">{activeProject.domain}</code>)
                </label>
                <input
                  type="url"
                  placeholder={`e.g. ${activeProject.domain}/new-blog-post`}
                  value={singleUrl}
                  onChange={(e) => setSingleUrl(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded p-2.5 text-xs font-mono text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900"
                />
              </div>

              <div className="flex items-center justify-between">
                <p className="text-[11px] text-gray-500">
                  Target Endpoint: <code className="font-mono text-gray-700">https://indexing.googleapis.com/v1/urlNotifications:publish</code>
                </p>

                <button
                  onClick={() => executeSubmissionBatch(parseAndValidateUrls(singleUrl))}
                  disabled={isProcessing || !singleUrl.trim()}
                  className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded text-xs font-medium disabled:opacity-50 transition flex items-center space-x-1.5"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending Request...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Request</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: BULK URLS */}
          {activeTab === 'bulk' && (
            <div className="space-y-3 pt-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-gray-700">
                    Paste URLs (One URL per line)
                  </label>
                  <span className="text-[11px] font-mono text-gray-500">
                    {parsedBulkUrls.length} valid URLs extracted
                  </span>
                </div>
                <textarea
                  rows={6}
                  placeholder={`${activeProject.domain}/page-1\n${activeProject.domain}/page-2\n${activeProject.domain}/products/item-3`}
                  value={bulkUrlsText}
                  onChange={(e) => setBulkUrlsText(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded p-2.5 text-xs font-mono text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900"
                />
              </div>

              {isProcessing && (
                <div className="bg-gray-50 p-3 rounded border border-gray-200 space-y-1.5">
                  <div className="flex justify-between text-xs font-mono text-gray-700">
                    <span>Processing Batch Queue...</span>
                    <span>{batchProgress.current} / {batchProgress.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 h-1 rounded-full overflow-hidden">
                    <div 
                      className="bg-gray-900 h-full transition-all duration-200" 
                      style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-gray-500">
                  Rate-limited sequentially to preserve daily API quotas.
                </p>

                <button
                  onClick={() => executeSubmissionBatch(parsedBulkUrls)}
                  disabled={isProcessing || parsedBulkUrls.length === 0}
                  className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded text-xs font-medium disabled:opacity-50 transition flex items-center space-x-1.5"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Processing ({batchProgress.current}/{batchProgress.total})</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Batch ({parsedBulkUrls.length} URLs)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: INSPECT METADATA */}
          {activeTab === 'inspect' && (
            <div className="space-y-3 pt-2">
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
                  disabled={isProcessing || !singleUrl.trim()}
                  className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded text-xs font-medium disabled:opacity-50 transition"
                >
                  Inspect Status
                </button>
              </div>

              {inspectResult && (
                <div className="bg-gray-50 border border-gray-200 rounded p-3 text-xs font-mono">
                  <div className="flex items-center justify-between mb-2 pb-1 border-b border-gray-200">
                    <span className="font-semibold text-gray-700">HTTP Status: {inspectResult.status}</span>
                    <span className="text-[10px] text-gray-500">GET urlNotifications/metadata</span>
                  </div>
                  <pre className="text-gray-800 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(inspectResult.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

        </section>

        {/* LOGS & AUDIT HISTORY TABLE */}
        {}
        <section className="bg-white border border-gray-200 rounded-md p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                API Request History & Logs
              </h3>
              <p className="text-xs text-gray-500">
                Audit trail of all HTTP calls executed against the Google Indexing API.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by URL or project..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white border border-gray-300 rounded pl-8 pr-2 py-1 text-xs text-gray-900 focus:outline-none focus:border-gray-900 w-48"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-gray-300 rounded px-2 py-1 text-xs text-gray-700 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="SUCCESS">Success (200 OK)</option>
                <option value="FAILED">Failed (Errors)</option>
              </select>

              <button
                onClick={exportLogsCsv}
                className="px-2.5 py-1 border border-gray-300 rounded bg-white hover:bg-gray-50 text-xs font-medium text-gray-700 flex items-center space-x-1"
                title="Download CSV report"
              >
                <Download className="w-3.5 h-3.5 text-gray-600" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 font-sans font-medium">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Project</th>
                  <th className="py-2.5 px-3">Target URL</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">HTTP Code</th>
                  <th className="py-2.5 px-3">Latency</th>
                  <th className="py-2.5 px-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-800">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-gray-400 font-sans">
                      No matching log entries found. Submit URLs above to populate history.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50 transition">
                      <td className="py-2.5 px-3 text-gray-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2.5 px-3 font-sans font-medium text-gray-900 whitespace-nowrap">
                        {log.projectName}
                      </td>
                      <td className="py-2.5 px-3 text-gray-900 max-w-xs truncate" title={log.url}>
                        {log.url}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                          log.type === 'URL_UPDATED' 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                            : 'bg-red-50 text-red-800 border-red-200'
                        }`}>
                          {log.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={`font-semibold ${
                          log.status === 'SUCCESS' ? 'text-emerald-700' : 'text-red-700'
                        }`}>
                          {log.httpCode}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-gray-500 whitespace-nowrap">
                        {log.latencyMs}ms
                      </td>
                      <td className="py-2.5 px-3 text-right font-sans">
                        <button
                          onClick={() => alert(`API Response Payload:\n\n${log.apiResponse}`)}
                          className="text-xs text-gray-600 hover:text-gray-900 underline"
                        >
                          View Response
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

      </main>

      {/* SETUP & CREDENTIALS MODAL */}
      {}
      {isSetupModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-300 rounded-lg max-w-2xl w-full p-6 space-y-5 shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div className="flex items-center space-x-2">
                <Key className="w-4 h-4 text-gray-900" />
                <h3 className="font-semibold text-sm text-gray-900">Google Search Console API Configuration</h3>
              </div>
              <button 
                onClick={() => setIsSetupModalOpen(false)}
                className="text-gray-400 hover:text-gray-900 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-gray-600 leading-relaxed">
              
              {/* How-to guide box */}
              <div className="bg-gray-50 border border-gray-200 p-3.5 rounded space-y-2">
                <h4 className="font-semibold text-gray-900 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-gray-700" /> Step-by-Step Setup Guide
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 text-gray-600 pl-1">
                  <li>
                    Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="text-gray-900 underline">Google Cloud Console</a> and enable the <strong>Web Search Inspect & Indexing API</strong>.
                  </li>
                  <li>
                    Create a <strong>Service Account</strong> under Credentials and copy its email address (e.g. <code className="bg-gray-200 px-1 rounded text-gray-800">gsc-bot@project.iam.gserviceaccount.com</code>).
                  </li>
                  <li>
                    Go to <a href="https://search.google.com/search-console" target="_blank" rel="noreferrer" className="text-gray-900 underline">Google Search Console</a> &gt; Select Property &gt; <strong>Settings &gt; Users and Permissions</strong>.
                  </li>
                  <li>
                    Add the Service Account Email as an <strong>Owner</strong> of your domain property.
                  </li>
                  <li>
                    Generate an OAuth2 Access Token or Service Account Key JSON to execute real requests.
                  </li>
                </ol>
              </div>

              {/* Access Token Input for Live Mode */}
              <div className="space-y-1.5 pt-1">
                <label className="block font-semibold text-gray-900">
                  OAuth2 Bearer Access Token (For Real HTTP Calls)
                </label>
                <input
                  type="password"
                  placeholder="ya29.a0ARdaC..."
                  value={accessTokenInput}
                  onChange={(e) => setAccessTokenInput(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded p-2 text-xs font-mono text-gray-900 focus:outline-none focus:border-gray-900"
                />
                <p className="text-[11px] text-gray-500">
                  You can generate a temporary access token via <code className="bg-gray-100 px-1 font-mono">gcloud auth print-access-token</code> or Google OAuth Playground with scope <code className="bg-gray-100 px-1 font-mono">https://www.googleapis.com/auth/indexing</code>.
                </p>
              </div>

              {/* Service Account JSON Paste */}
              <div className="space-y-1.5">
                <label className="block font-semibold text-gray-900">
                  Service Account Key JSON (Optional / Config Store)
                </label>
                <textarea
                  rows={4}
                  placeholder={`{\n  "type": "service_account",\n  "project_id": "example-project",\n  "client_email": "${activeProject.serviceAccountEmail}"\n}`}
                  value={serviceAccountJsonInput}
                  onChange={(e) => setServiceAccountJsonInput(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded p-2 text-xs font-mono text-gray-900 focus:outline-none focus:border-gray-900"
                />
              </div>

            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-200">
              <button
                onClick={() => setIsSetupModalOpen(false)}
                className="px-3 py-1.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setProjects(prev => prev.map(p => p.id === activeProject.id ? { 
                    ...p, 
                    credentialsConfigured: true,
                    accessToken: accessTokenInput || p.accessToken
                  } : p));
                  setIsSetupModalOpen(false);
                  showToast(`Updated authentication configuration for ${activeProject.name}`, 'success');
                }}
                className="px-4 py-1.5 bg-gray-900 hover:bg-gray-800 text-white rounded text-xs font-medium"
              >
                Save Credentials
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW PROJECT MODAL */}
      {}
      {isAddProjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-300 rounded-lg max-w-md w-full p-5 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <h3 className="font-semibold text-xs text-gray-900 uppercase tracking-wider">
                Add New Domain Project
              </h3>
              <button onClick={() => setIsAddProjectModalOpen(false)} className="text-gray-400 hover:text-gray-900">✕</button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const name = formData.get('name');
              const domain = formData.get('domain');
              const sa = formData.get('sa');

              if (!name || !domain) return;

              const formattedDomain = domain.startsWith('http') ? domain : `https://${domain}`;

              const newProj = {
                id: 'proj_' + Date.now(),
                name,
                domain: formattedDomain,
                serviceAccountEmail: sa || `gsc-service@${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.iam.gserviceaccount.com`,
                accessToken: '',
                credentialsConfigured: false,
                dailyQuotaLimit: 200,
                dailySubmitted: 0
              };

              setProjects([...projects, newProj]);
              setSelectedProjectId(newProj.id);
              setIsAddProjectModalOpen(false);
              showToast(`Created project ${newProj.name}!`, 'success');
            }} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Project Name</label>
                <input
                  name="name"
                  required
                  placeholder="e.g. My Online Store"
                  className="w-full bg-white border border-gray-300 rounded p-2 text-gray-900 focus:outline-none focus:border-gray-900"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Domain URL Property</label>
                <input
                  name="domain"
                  required
                  placeholder="https://example.com"
                  className="w-full bg-white border border-gray-300 rounded p-2 text-gray-900 font-mono focus:outline-none focus:border-gray-900"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Service Account Email (Optional)</label>
                <input
                  name="sa"
                  placeholder="bot@project.iam.gserviceaccount.com"
                  className="w-full bg-white border border-gray-300 rounded p-2 text-gray-900 font-mono focus:outline-none focus:border-gray-900"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddProjectModalOpen(false)}
                  className="px-3 py-1.5 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-gray-900 hover:bg-gray-800 text-white rounded font-medium"
                >
                  Save Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}