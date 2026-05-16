import React, { useRef, useState } from 'react';
import { UploadCloudIcon, XIcon, FileTextIcon, ImageIcon, Loader2Icon } from 'lucide-react';
import { toast } from 'sonner';
import type { ConcernAttachment } from '../types';
import {
  formatFileSize,
  isValidConcernMimeType,
  MAX_CONCERN_FILE_SIZE,
  readFileAsDataUrl
} from '../lib/files';

interface FileUploadZoneProps {
  fieldName: string;
  files: ConcernAttachment[];
  onChange: (files: ConcernAttachment[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

export function FileUploadZone({
  fieldName,
  files,
  onChange,
  maxFiles = 5,
  disabled = false
}: FileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const processFile = async (file: File) => {
    if (files.length >= maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    if (file.size > MAX_CONCERN_FILE_SIZE) {
      toast.error('File too large', {
        description: 'Maximum file size is 10MB.'
      });
      return;
    }

    const mimeType = file.type || 'application/octet-stream';
    if (!isValidConcernMimeType(mimeType)) {
      toast.error('Invalid file type', {
        description: 'Please upload PNG, JPG, or PDF files only.'
      });
      return;
    }

    setIsProcessing(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const attachment: ConcernAttachment = {
        name: file.name,
        mimeType,
        size: file.size,
        dataUrl,
        field: fieldName
      };
      onChange([...files, attachment]);
    } catch {
      toast.error('Error reading file');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || disabled || isProcessing) return;
    const remaining = maxFiles - files.length;
    const toAdd = Array.from(fileList).slice(0, remaining);
    if (fileList.length > remaining) {
      toast.error(`Maximum ${maxFiles} files allowed`);
    }
    void (async () => {
      for (const file of toAdd) {
        await processFile(file);
      }
    })();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isProcessing) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onClick={() => !disabled && !isProcessing && inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-xl transition-colors bg-dark-800 cursor-pointer group ${
          disabled
            ? 'opacity-50 cursor-not-allowed border-white/10'
            : isDragging
              ? 'border-purple-500/70 bg-purple-500/10'
              : 'border-white/10 hover:border-purple-500/50'
        }`}>
        <div className="space-y-1 text-center pointer-events-none">
          {isProcessing ? (
            <Loader2Icon className="mx-auto h-10 w-10 text-purple-400 animate-spin" />
          ) : (
            <UploadCloudIcon className="mx-auto h-10 w-10 text-gray-400 group-hover:text-purple-400 transition-colors" />
          )}
          <div className="flex text-sm text-gray-400 justify-center">
            <span className="font-medium text-purple-400 group-hover:text-purple-300">
              Upload a file
            </span>
            <p className="pl-1">or drag and drop</p>
          </div>
          <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept=".png,.jpg,.jpeg,.pdf,image/png,image/jpeg,application/pdf"
          multiple
          disabled={disabled || isProcessing || files.length >= maxFiles}
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center gap-3 bg-white/5 px-3 py-2 rounded-lg border border-white/10">
              {file.mimeType.startsWith('image/') ? (
                <ImageIcon className="h-4 w-4 text-cyan-400 shrink-0" />
              ) : (
                <FileTextIcon className="h-4 w-4 text-purple-400 shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-200 truncate">{file.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                disabled={disabled}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                aria-label={`Remove ${file.name}`}>
                <XIcon className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
