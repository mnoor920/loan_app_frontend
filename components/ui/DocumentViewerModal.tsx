'use client'
import { useState, useEffect } from 'react';
import { X, Download, ZoomIn, ZoomOut } from 'lucide-react';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    id: string;
    document_type: string;
    original_filename?: string;
    file_size?: number;
    mime_type?: string;
  } | null;
}

const DocumentViewerModal = ({ isOpen, onClose, document }: DocumentViewerModalProps) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (isOpen && document) {
      loadDocument();
    } else {
      setImageUrl('');
      setZoom(1);
      setError('');
    }
  }, [isOpen, document]);

  const loadDocument = async () => {
    if (!document) return;

    setLoading(true);
    setError('');

    try {
      // Add timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${API_URL}/api/documents/${document.id}/content`, {
        credentials: 'include',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setImageUrl(url);
      } else if (response.status === 408) {
        const { error } = await response.json().catch(() => ({ error: 'Request timed out' }));
        setError(error || 'Document loading timed out. Please try again.');
      } else {
        const { error } = await response.json().catch(() => ({ error: 'Failed to load document' }));
        setError(error || 'Failed to load document');
      }
    } catch (error: any) {
      console.error('Error loading document:', error);
      if (error.name === 'AbortError') {
        setError('Document loading timed out. Please try again.');
      } else {
        setError('Error loading document. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (imageUrl && document) {
      const link = window.document.createElement('a');
      link.href = imageUrl;
      link.download = document.original_filename || 'document';
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-4xl max-h-[90vh] w-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
              {document?.document_type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Document'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {document?.original_filename}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <button
              onClick={handleZoomOut}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </span>

            <button
              onClick={handleZoomIn}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-red-500 mb-2">⚠️</div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
                <button
                  onClick={loadDocument}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : imageUrl ? (
            <div className="flex justify-center">
              <img
                src={imageUrl}
                alt={document?.original_filename || 'Document'}
                className="max-w-full h-auto rounded-lg shadow-lg transition-transform"
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'center top'
                }}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-600 dark:text-gray-400">No document to display</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {document && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>
                {document.file_size ? `${Math.round(document.file_size / 1024)} KB` : 'Unknown size'}
              </span>
              <span>
                {document.mime_type || 'Unknown type'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentViewerModal;