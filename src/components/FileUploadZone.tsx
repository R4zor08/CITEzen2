import React, { useRef, useState } from 'react';
import {
  UploadCloudIcon,
  XIcon,
  FileTextIcon,
  Loader2Icon,
  ShieldCheckIcon,
  ShieldIcon,
  ScanLineIcon,
  ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';
import type { ConcernAttachment } from '../types';
import { verifyConcernAttachment } from '../lib/concernAttachments';
import {
  formatFileSize,
  isValidConcernMimeType,
  isVerifiedImageMimeType,
  MAX_CONCERN_FILE_SIZE,
  normalizeImageMimeType,
  readFileAsDataUrl
} from '../lib/files';

interface FileUploadZoneProps {
  fieldName: string;
  files: ConcernAttachment[];
  onChange: (files: ConcernAttachment[]) => void;
  maxFiles?: number;
  disabled?: boolean;
  /** Supporting Documents: PNG/JPG only and Sightengine verification before add. */
  requireAuthenticityVerification?: boolean;
}

function AttachmentThumbnail({ file }: { file: ConcernAttachment }) {
  const isImage = file.mimeType.startsWith('image/');
  if (isImage && file.dataUrl) {
    return (
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-dark-900">
        <img
          src={file.dataUrl}
          alt=""
          className="h-full w-full object-cover"
        />
        {file.verified ? (
          <span className="absolute bottom-0.5 right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/90 text-white shadow-lg shadow-emerald-900/50">
            <ShieldCheckIcon className="h-3 w-3" aria-hidden />
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-purple-500/10">
      {isImage ? (
        <ImageIcon className="h-6 w-6 text-cyan-400/80" />
      ) : (
        <FileTextIcon className="h-6 w-6 text-purple-400/80" />
      )}
    </div>
  );
}

export function FileUploadZone({
  fieldName,
  files,
  onChange,
  maxFiles = 5,
  disabled = false,
  requireAuthenticityVerification = false
}: FileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [verifyingLabel, setVerifyingLabel] = useState<string | null>(null);

  const verifiedCount = files.filter((f) => f.verified).length;
  const slotsLeft = maxFiles - files.length;

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

    const mimeType = normalizeImageMimeType(
      file.type || 'application/octet-stream',
      file.name
    );

    if (requireAuthenticityVerification) {
      if (!isVerifiedImageMimeType(mimeType)) {
        toast.error('Invalid file type', {
          description:
            'Supporting documents must be PNG or JPG images for authenticity verification.'
        });
        return;
      }
    } else if (!isValidConcernMimeType(mimeType)) {
      toast.error('Invalid file type', {
        description: 'Please upload PNG, JPG, or PDF files only.'
      });
      return;
    }

    setIsProcessing(true);
    setVerifyingLabel(
      requireAuthenticityVerification ? file.name : null
    );

    try {
      const dataUrl = await readFileAsDataUrl(file);

      if (requireAuthenticityVerification) {
        let result;
        try {
          result = await verifyConcernAttachment({
            dataUrl,
            fileName: file.name,
            mimeType
          });
        } catch {
          toast.error('Unable to verify this file. Please try again.');
          return;
        }

        if (!result.ok) {
          toast.error(
            result.message || 'Possible AI-generated or manipulated image'
          );
          return;
        }

        const attachment: ConcernAttachment = {
          name: file.name,
          mimeType,
          size: file.size,
          dataUrl,
          field: fieldName,
          verified: true
        };
        onChange([...files, attachment]);
        return;
      }

      const attachment: ConcernAttachment = {
        name: file.name,
        mimeType,
        size: file.size,
        dataUrl,
        field: fieldName,
        verified: undefined
      };
      onChange([...files, attachment]);
    } catch {
      toast.error('Error reading file');
    } finally {
      setIsProcessing(false);
      setVerifyingLabel(null);
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

  const accept = requireAuthenticityVerification
    ? '.png,.jpg,.jpeg,image/png,image/jpeg'
    : '.png,.jpg,.jpeg,.pdf,image/png,image/jpeg,application/pdf';

  const dropZoneClass = (() => {
    if (disabled) {
      return 'opacity-50 cursor-not-allowed border-white/10 bg-dark-800/60';
    }
    if (isProcessing && requireAuthenticityVerification) {
      return 'border-cyan-400/50 bg-cyan-500/5 shadow-[0_0_24px_rgba(34,211,238,0.12)]';
    }
    if (isDragging) {
      return 'border-purple-500/70 bg-purple-500/10 shadow-[0_0_20px_rgba(168,85,247,0.15)]';
    }
    if (requireAuthenticityVerification && verifiedCount > 0) {
      return 'border-emerald-500/30 bg-emerald-500/[0.04] hover:border-emerald-400/50';
    }
    return 'border-white/10 bg-dark-800/80 hover:border-purple-500/50 hover:bg-purple-500/[0.06]';
  })();

  return (
    <div className="space-y-3">
      {requireAuthenticityVerification ? (
        <div className="rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/[0.08] via-transparent to-emerald-500/[0.06] p-3.5 sm:p-4">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-400/25 text-cyan-300">
              <ShieldIcon className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-medium text-white">
                Authenticity check
              </p>
              <p className="text-xs text-gray-400 leading-relaxed">
                Supporting documents are scanned for AI-generated content and
                face manipulation before they can be attached.
              </p>
              <ul className="flex flex-wrap gap-x-3 gap-y-1 pt-1 text-[11px] text-gray-500">
                <li className="flex items-center gap-1">
                  <span className="h-1 w-1 rounded-full bg-cyan-400/80" />
                  PNG or JPG only
                </li>
                <li className="flex items-center gap-1">
                  <span className="h-1 w-1 rounded-full bg-emerald-400/80" />
                  Max 10MB per file
                </li>
                <li className="flex items-center gap-1">
                  <span className="h-1 w-1 rounded-full bg-purple-400/80" />
                  PDF not accepted here
                </li>
              </ul>
            </div>
          </div>
        </div>
      ) : null}

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-busy={isProcessing}
        aria-label={
          requireAuthenticityVerification
            ? 'Upload supporting document image'
            : 'Upload file'
        }
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
        className={`relative mt-1 overflow-hidden rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer group ${dropZoneClass}`}>
        {isProcessing && requireAuthenticityVerification ? (
          <div
            className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-dark-900/75 backdrop-blur-[2px]"
            aria-live="polite">
            <div className="relative">
              <ScanLineIcon className="h-10 w-10 text-cyan-400/90 animate-pulse" />
              <Loader2Icon className="absolute -right-1 -bottom-1 h-5 w-5 text-purple-400 animate-spin" />
            </div>
            <p className="text-sm font-medium text-white">Checking authenticity</p>
            {verifyingLabel ? (
              <p className="max-w-[90%] truncate text-xs text-gray-400 px-4">
                {verifyingLabel}
              </p>
            ) : null}
            <div className="flex gap-1 pt-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-cyan-400/80 animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex justify-center px-6 py-6 sm:py-7">
          <div className="space-y-2 text-center pointer-events-none max-w-sm">
            {isProcessing && !requireAuthenticityVerification ? (
              <Loader2Icon className="mx-auto h-10 w-10 text-purple-400 animate-spin" />
            ) : (
              <div
                className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border transition-colors ${
                  requireAuthenticityVerification
                    ? 'border-cyan-500/25 bg-cyan-500/10 group-hover:border-cyan-400/40 group-hover:bg-cyan-500/15'
                    : 'border-white/10 bg-white/5 group-hover:border-purple-500/40 group-hover:bg-purple-500/10'
                }`}>
                <UploadCloudIcon
                  className={`h-6 w-6 transition-colors ${
                    requireAuthenticityVerification
                      ? 'text-cyan-300/90 group-hover:text-cyan-200'
                      : 'text-gray-400 group-hover:text-purple-400'
                  }`}
                />
              </div>
            )}
            <div className="text-sm text-gray-400">
              <span
                className={`font-medium ${
                  requireAuthenticityVerification
                    ? 'text-cyan-300 group-hover:text-cyan-200'
                    : 'text-purple-400 group-hover:text-purple-300'
                }`}>
                Choose a file
              </span>
              <span className="text-gray-500"> or drag and drop</span>
            </div>
            <p className="text-xs text-gray-500">
              {requireAuthenticityVerification
                ? 'PNG or JPG · up to 10MB'
                : 'PNG, JPG, or PDF · up to 10MB'}
            </p>
            {requireAuthenticityVerification ? (
              <p className="text-[11px] text-gray-600">
                {slotsLeft > 0
                  ? `${slotsLeft} slot${slotsLeft === 1 ? '' : 's'} remaining`
                  : 'Maximum files reached'}
              </p>
            ) : null}
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept={accept}
          multiple
          disabled={disabled || isProcessing || files.length >= maxFiles}
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {requireAuthenticityVerification && verifiedCount > 0 ? (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-2">
          <span className="flex items-center gap-2 text-xs text-emerald-300/95">
            <ShieldCheckIcon className="h-3.5 w-3.5 shrink-0" />
            {verifiedCount} verified document{verifiedCount === 1 ? '' : 's'} ready
          </span>
          <span className="text-[11px] text-gray-500 tabular-nums">
            {verifiedCount}/{maxFiles}
          </span>
        </div>
      ) : null}

      {files.length > 0 ? (
        <ul className="space-y-2" aria-label="Uploaded files">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className={`flex items-center gap-3 rounded-xl border p-2.5 sm:p-3 transition-colors ${
                file.verified
                  ? 'border-emerald-500/25 bg-gradient-to-r from-emerald-500/[0.07] to-transparent'
                  : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.06]'
              }`}>
              <AttachmentThumbnail file={file} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-100 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {formatFileSize(file.size)}
                </p>
                {file.verified ? (
                  <span className="inline-flex items-center gap-1 mt-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                    <ShieldCheckIcon className="h-3 w-3 shrink-0" />
                    Verified
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                disabled={disabled || isProcessing}
                className="shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40"
                aria-label={`Remove ${file.name}`}>
                <XIcon className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : requireAuthenticityVerification ? (
        <p className="text-center text-[11px] text-gray-600 py-1">
          No documents attached yet
        </p>
      ) : null}
    </div>
  );
}
