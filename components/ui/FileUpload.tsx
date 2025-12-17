'use client'
import React, { useRef } from 'react';
import { Upload, X } from 'lucide-react';
import Image from 'next/image';

interface FileUploadProps {
  label: string;
  accept?: string;
  maxSize?: number; // in bytes
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  preview?: string;
  // Optional static image to show when there is no preview yet
  placeholderImage?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  label,
  accept = 'image/png,image/jpeg,image/jpg,image/gif',
  maxSize = 10 * 1024 * 1024, // 10MB default
  onFileSelect,
  onFileRemove,
  preview,
  placeholderImage,
  error,
  required = false,
  className = ''
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size
      if (file.size > maxSize) {
        // Don't call onFileSelect, let parent handle the error
        return;
      }

      // Validate file type
      const allowedTypes = accept.split(',').map(type => type.trim());
      if (!allowedTypes.includes(file.type)) {
        // Don't call onFileSelect, let parent handle the error
        return;
      }

      onFileSelect(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getAcceptedFormats = (): string => {
    return accept
      .split(',')
      .map(type => type.trim().split('/')[1]?.toUpperCase())
      .filter(Boolean)
      .join(', ');
  };

  return (
    <div className={className}>
      <label className="block text-sm font-semibold text-slate-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div
        onClick={handleClick}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${error
          ? 'border-red-300 bg-red-50'
          : 'border-slate-300 bg-slate-50/50 hover:border-emerald-500 hover:bg-emerald-50'
          }`}
      >
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt={label}
              className="max-h-40 mx-auto rounded shadow-sm"
            />
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : placeholderImage ? (
          <div className="flex flex-col items-center gap-3">
            <Image
              src={placeholderImage}
              width={100}
              height={100}
              alt={`${label} placeholder`}
              className="max-h-32 mx-auto rounded shadow-sm"
            />
          </div>
        ) : (
          <div>
            <Upload className="w-12 h-12 mx-auto text-emerald-100 mb-4 drop-shadow-sm" />
          </div>
        )}
        <div>
          <p className="text-slate-600">
            <span className="text-emerald-600 hover:text-emerald-700 hover:underline font-bold">
              Upload a file
            </span>{' '}
            or drag and drop
          </p>
          <p className="text-xs font-medium text-slate-500 mt-2 uppercase tracking-wide">
            {getAcceptedFormats()} up to {formatFileSize(maxSize)}
          </p>
        </div>

      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />

      {error && (
        <p className="mt-2 text-sm text-red-600 font-medium flex items-center gap-1">
          ⚠️ {error}
        </p>
      )}
    </div>
  );
};

export default FileUpload;