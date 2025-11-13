'use client';

import { AlertTriangle, Clock, Mail, Lock, Phone } from 'lucide-react';

interface InitialSyncModalProps {
  providerName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function InitialSyncModal({ providerName, onConfirm, onCancel }: InitialSyncModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-normal text-gray-900">Initial Sync</h2>
            <p className="text-sm text-gray-500 font-light">{providerName}</p>
          </div>
        </div>

        {/* Warning Content */}
        <div className="space-y-4 mb-8">
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
            <Clock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">Syncing 1 Year of Data</p>
              <p className="text-xs text-gray-600 font-light mt-1">
                This will sync all your {providerName} data from the past 365 days
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-2xl border border-purple-100">
            <Clock className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">Processing Time: 4-8 Hours</p>
              <p className="text-xs text-gray-600 font-light mt-1">
                You'll receive an email when the sync is complete
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-red-50 rounded-2xl border border-red-100">
            <Lock className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">One-Time Only</p>
              <p className="text-xs text-gray-600 font-light mt-1">
                After this sync, the manual sync button will be locked permanently. Auto-sync will continue in the background.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-green-50 rounded-2xl border border-green-100">
            <Phone className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">Need More Syncs?</p>
              <p className="text-xs text-gray-600 font-light mt-1">
                Contact support if you need to re-sync or require additional historical data
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 font-normal transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:opacity-90 text-white font-normal transition-all"
          >
            Start Sync
          </button>
        </div>
      </div>
    </div>
  );
}
