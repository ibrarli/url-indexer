'use client';

import { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activeDomain: string;
}

export default function SetupModal({ isOpen, onClose, activeDomain }: Props) {
  const [accessToken, setAccessToken] = useState('');
  const [serviceAccountJson, setServiceAccountJson] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white border border-gray-300 rounded-lg max-w-2xl w-full p-6 space-y-5 shadow-lg max-h-[90vh] overflow-y-auto text-xs">
        <div className="flex items-center justify-between border-b border-gray-200 pb-3">
          <h3 className="font-semibold text-sm text-gray-900">Google Search Console API Configuration</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 text-sm font-semibold cursor-pointer">
            ✕
          </button>
        </div>

        <div className="space-y-4 text-gray-600 leading-relaxed">
          {/* Step-by-Step Guide */}
          <div className="bg-gray-50 border border-gray-200 p-3.5 rounded space-y-2">
            <h4 className="font-semibold text-gray-900">Step-by-Step Setup Guide</h4>
            <ol className="list-decimal list-inside space-y-1.5 text-gray-600 pl-1">
              <li>
                Open <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="text-gray-900 underline font-medium">Google Cloud Console</a> and enable the <strong>Web Search Inspect & Indexing API</strong>.
              </li>
              <li>
                Create a <strong>Service Account</strong> under Credentials and copy its email address.
              </li>
              <li>
                Open <a href="https://search.google.com/search-console" target="_blank" rel="noreferrer" className="text-gray-900 underline font-medium">Google Search Console</a> &gt; Select Property &gt; <strong>Settings &gt; Users and Permissions</strong>.
              </li>
              <li>
                Add the Service Account Email as an <strong>Owner</strong> of your domain property.
              </li>
              <li>Generate an Access Token or Service Account Key JSON below.</li>
            </ol>
          </div>

          <div className="space-y-1.5 pt-1">
            <label className="block font-semibold text-gray-900">OAuth2 Bearer Access Token</label>
            <input
              type="password"
              placeholder="ya29.a0ARdaC..."
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded p-2 text-xs font-mono text-gray-900 focus:outline-none focus:border-gray-900"
            />
            <p className="text-[11px] text-gray-500">
              Generate a temporary access token via <code className="bg-gray-100 px-1 font-mono">gcloud auth print-access-token</code> or Google OAuth Playground.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block font-semibold text-gray-900">Service Account Key JSON</label>
            <textarea
              rows={4}
              placeholder={`{\n  "type": "service_account",\n  "project_id": "example-project",\n  "client_email": "bot@iam.gserviceaccount.com"\n}`}
              value={serviceAccountJson}
              onChange={(e) => setServiceAccountJson(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded p-2 text-xs font-mono text-gray-900 focus:outline-none focus:border-gray-900"
            />
          </div>
        </div>

        <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-3 py-1.5 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-900 hover:bg-gray-800 text-white rounded font-medium cursor-pointer"
          >
            Save Credentials
          </button>
        </div>
      </div>
    </div>
  );
}