"use client";

import { X, Download, ExternalLink } from "lucide-react";
import { useEffect } from "react";

interface FileViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
  mimeType?: string | null;
}

const FileViewerModal = ({ isOpen, onClose, fileUrl, fileName, mimeType }: FileViewerModalProps) => {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden"; // Prevent background scrolling
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDownload = async () => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      // Fallback to opening in new tab
      window.open(fileUrl, "_blank");
    }
  };

  // Determine if file is viewable based on mime type OR file extension
  const isPDF = mimeType?.includes("pdf") || fileUrl.toLowerCase().includes(".pdf") || fileUrl.toLowerCase().includes("pdf");
  const isImage = mimeType?.startsWith("image/") ||
    fileUrl.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)/i);
  const isViewable = isPDF || isImage;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-[95vw] h-[95vh] max-w-7xl bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 truncate">
              {fileName}
            </h2>
            {mimeType && (
              <p className="text-sm text-gray-500 mt-0.5">{mimeType}</p>
            )}
          </div>

          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Download className="h-4 w-4" />
              Download
            </button>

            <button
              onClick={() => window.open(fileUrl, "_blank")}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              <ExternalLink className="h-4 w-4" />
              Open in Tab
            </button>

            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-gray-50 flex items-center justify-center">
          {isViewable ? (
            isImage ? (
              <img
                src={fileUrl}
                alt={fileName}
                className="max-w-full max-h-full object-contain"
                style={{ imageRendering: 'auto' }}
              />
            ) : (
              <iframe
                src={fileUrl}
                className="w-full h-full border-0"
                title={fileName}
              />
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="w-20 h-20 mb-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center">
                <Download className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Preview Not Available
              </h3>
              <p className="text-gray-600 mb-6 max-w-md">
                This file type cannot be previewed in the browser. Click the download button above to save it to your device.
              </p>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
              >
                <Download className="h-5 w-5" />
                Download File
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileViewerModal;
