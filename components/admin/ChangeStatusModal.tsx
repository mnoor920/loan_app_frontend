'use client';

import { useState } from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';

interface ChangeStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStatus: string;
  onStatusChange: (status: string, note: string) => Promise<void>;
  loading?: boolean;
}

const STATUS_OPTIONS = [
  { value: 'Approved', label: 'Approved', color: 'bg-green-100 text-green-800 border-green-300' },
  { value: 'Review', label: 'Review', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { value: 'Pending', label: 'Pending', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { value: 'Reject', label: 'Reject', color: 'bg-red-100 text-red-800 border-red-300' },
  { value: 'On hold', label: 'On Hold', color: 'bg-orange-100 text-orange-800 border-orange-300' },
];

export default function ChangeStatusModal({
  isOpen,
  onClose,
  currentStatus,
  onStatusChange,
  loading = false
}: ChangeStatusModalProps) {
  const [useCustomStatus, setUseCustomStatus] = useState<boolean>(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [customStatus, setCustomStatus] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = async () => {
    // Reset error
    setError('');

    // Determine the final status
    const finalStatus = useCustomStatus ? customStatus.trim() : selectedStatus;

    // Validate
    if (!finalStatus) {
      setError(useCustomStatus ? 'Please enter a custom status' : 'Please select a status');
      return;
    }

    if (finalStatus === currentStatus) {
      setError('Please enter a different status');
      return;
    }

    if (finalStatus.length < 2) {
      setError('Status must be at least 2 characters long');
      return;
    }

    if (finalStatus.length > 50) {
      setError('Status must be less than 50 characters');
      return;
    }

    if (!note.trim()) {
      setError('Please provide a note explaining the status change');
      return;
    }

    if (note.trim().length < 10) {
      setError('Note must be at least 10 characters long');
      return;
    }

    try {
      await onStatusChange(finalStatus, note.trim());
      // Reset form on success
      setSelectedStatus('');
      setCustomStatus('');
      setNote('');
      setUseCustomStatus(false);
      setError('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    }
  };

  const handleClose = () => {
    if (!loading) {
      setSelectedStatus('');
      setCustomStatus('');
      setNote('');
      setUseCustomStatus(false);
      setError('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Change Loan Status</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Current Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Status
            </label>
            <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
              <span className="text-gray-900 font-medium">{currentStatus}</span>
            </div>
          </div>

          {/* Status Selection Mode Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              New Status <span className="text-red-500">*</span>
            </label>
            
            {/* Toggle between predefined and custom */}
            <div className="flex gap-2 mb-4 p-1 bg-gray-100 rounded-lg">
              <button
                type="button"
                onClick={() => {
                  setUseCustomStatus(false);
                  setCustomStatus('');
                  setError('');
                }}
                disabled={loading}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  !useCustomStatus
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Predefined
              </button>
              <button
                type="button"
                onClick={() => {
                  setUseCustomStatus(true);
                  setSelectedStatus('');
                  setError('');
                }}
                disabled={loading}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  useCustomStatus
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Custom
              </button>
            </div>

            {/* Predefined Status Options */}
            {!useCustomStatus && (
              <div className="grid grid-cols-2 gap-3">
                {STATUS_OPTIONS.map((option) => {
                  const isCurrentStatus = option.value === currentStatus;
                  const isDisabled = loading || isCurrentStatus;
                  
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        if (!isDisabled) {
                          setSelectedStatus(option.value);
                          setError('');
                        }
                      }}
                      disabled={isDisabled}
                      title={isCurrentStatus ? 'This is the current status' : ''}
                      className={`
                        px-4 py-3 rounded-lg border-2 transition-all relative
                        ${selectedStatus === option.value
                          ? `${option.color} border-current font-semibold`
                          : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
                        }
                        ${isCurrentStatus
                          ? 'opacity-50 cursor-not-allowed'
                          : 'cursor-pointer hover:shadow-md'
                        }
                        disabled:opacity-50 disabled:cursor-not-allowed
                      `}
                    >
                      {option.label}
                      {isCurrentStatus && (
                        <span className="absolute top-1 right-1 text-[10px] text-gray-500 font-normal">(Current)</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Custom Status Input */}
            {useCustomStatus && (
              <div>
                <input
                  type="text"
                  value={customStatus}
                  onChange={(e) => {
                    setCustomStatus(e.target.value);
                    setError('');
                  }}
                  disabled={loading}
                  placeholder="Enter custom status (e.g., Under Review, Processing, etc.)"
                  maxLength={50}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {customStatus.length}/50 characters
                </p>
              </div>
            )}
          </div>

          {/* Note Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Admin Note <span className="text-red-500">*</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                setError('');
              }}
              disabled={loading}
              rows={4}
              placeholder="Enter a note explaining the reason for this status change (minimum 10 characters)..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed resize-none"
            />
            <p className="mt-1 text-xs text-gray-500">
              {note.length} characters (minimum 10 required)
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              loading || 
              (!useCustomStatus && !selectedStatus) || 
              (useCustomStatus && !customStatus.trim()) || 
              !note.trim() || 
              note.trim().length < 10 ||
              (useCustomStatus && customStatus.trim().length < 2)
            }
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Update Status
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

