'use client';

import { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAddProject: (domain: string) => void;
}

export default function AddProjectModal({ isOpen, onClose, onAddProject }: Props) {
  const [domain, setDomain] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) return;

    const formattedDomain = domain.startsWith('http') ? domain : `https://${domain}`;
    onAddProject(formattedDomain);
    setDomain('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white border border-gray-300 rounded-lg max-w-md w-full p-5 space-y-4 shadow-lg text-xs">
        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
          <h3 className="font-semibold text-gray-900 uppercase tracking-wider">Add New Domain Property</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 font-semibold cursor-pointer">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Domain Property URL</label>
            <input
              required
              placeholder="https://example.com or sc-domain:example.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded p-2 font-mono text-gray-900 focus:outline-none focus:border-gray-900"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-gray-900 hover:bg-gray-800 text-white rounded font-medium cursor-pointer"
            >
              Add Property
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}