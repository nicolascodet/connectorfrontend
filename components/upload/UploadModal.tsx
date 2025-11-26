"use client";

import React, { useState, useCallback } from 'react';
import { Upload, X, File, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: 'owner' | 'admin' | 'user';
  onUploadSuccess?: () => void;
}

export default function UploadModal({ isOpen, onClose, userRole, onUploadSuccess }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [visibility, setVisibility] = useState<'private' | 'team' | 'company'>('private');
  const [teamId, setTeamId] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const canSetVisibility = userRole === 'owner' || userRole === 'admin';

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setUploadStatus('idle');
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadStatus('idle');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setUploadStatus('idle');
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('visibility', visibility);
      if (visibility === 'team' && teamId) {
        formData.append('team_id', teamId);
      }

      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/upload/file`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Upload failed');
      }

      const result = await response.json();
      console.log('Upload success:', result);
      
      setUploadStatus('success');
      setFile(null);
      
      // Call success callback after 1.5s
      setTimeout(() => {
        onUploadSuccess?.();
        onClose();
      }, 1500);

    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      setErrorMessage(error.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const resetModal = () => {
    setFile(null);
    setVisibility('private');
    setTeamId('');
    setUploadStatus('idle');
    setErrorMessage('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full p-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Upload Document</h2>
          <button
            onClick={resetModal}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : file 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {!file ? (
            <>
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-600 mb-2">
                Drag and drop your file here, or
              </p>
              <label className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
                Browse Files
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.txt,.md,.html,.csv,.png,.jpg,.jpeg,.tiff,.bmp"
                />
              </label>
              <p className="text-xs text-gray-500 mt-4">
                Supported: PDF, Word, PowerPoint, Excel, Images, Text (max 100MB)
              </p>
            </>
          ) : (
            <div className="flex items-center justify-center space-x-3">
              <File className="h-10 w-10 text-green-600" />
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                onClick={() => setFile(null)}
                className="text-gray-400 hover:text-red-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {/* Visibility Settings */}
        {file && (
          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Who can see this document?
              </label>
              <div className="space-y-2">
                {/* Private (always available) */}
                <label className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="visibility"
                    value="private"
                    checked={visibility === 'private'}
                    onChange={(e) => setVisibility(e.target.value as any)}
                    className="mt-1"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">🔒 Private (Only Me)</p>
                    <p className="text-xs text-gray-500">Only you can search and view this document</p>
                  </div>
                </label>

                {/* Team (admin/owner only) */}
                {canSetVisibility && (
                  <label className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="visibility"
                      value="team"
                      checked={visibility === 'team'}
                      onChange={(e) => setVisibility(e.target.value as any)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">👥 Team</p>
                      <p className="text-xs text-gray-500">Your team members can search and view</p>
                    </div>
                  </label>
                )}

                {/* Company (admin/owner only) */}
                {canSetVisibility && (
                  <label className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="visibility"
                      value="company"
                      checked={visibility === 'company'}
                      onChange={(e) => setVisibility(e.target.value as any)}
                      className="mt-1"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">🏢 Company-Wide</p>
                      <p className="text-xs text-gray-500">Everyone in your company can search and view</p>
                    </div>
                  </label>
                )}
              </div>
            </div>

            {/* Team ID input (if team visibility and admin) */}
            {visibility === 'team' && canSetVisibility && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team ID (Optional)
                </label>
                <input
                  type="text"
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  placeholder="Leave empty to use your admin ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Your team members (users you manage) will be able to see this
                </p>
              </div>
            )}

            {/* Role restriction notice for regular users */}
            {!canSetVisibility && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  ℹ️ Only admins and owners can share documents company-wide or with teams.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Status Messages */}
        {uploadStatus === 'success' && (
          <div className="mt-4 flex items-center space-x-2 text-green-600 bg-green-50 p-3 rounded-lg">
            <CheckCircle className="h-5 w-5" />
            <p className="text-sm font-medium">Upload successful!</p>
          </div>
        )}

        {uploadStatus === 'error' && (
          <div className="mt-4 flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">{errorMessage}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex space-x-3">
          <button
            onClick={resetModal}
            disabled={uploading}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                <span>Upload</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

