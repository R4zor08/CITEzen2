import React, { useEffect, useRef, useState } from 'react';
import {
  UploadCloudIcon,
  XIcon,
  FileTextIcon,
  Loader2Icon,
  ShieldCheckIcon,
  ShieldIcon,
  ShieldAlertIcon,
  ScanLineIcon,
  ImageIcon,
  BotIcon,
  UserXIcon
} from 'lucide-react';
import { toast } from 'sonner';
import type { ConcernAttachment } from '../types';
import {
  getApiFieldNameForUpload,
  PDF_AUTHENTICITY_MESSAGE,
  verifyConcernAttachment
} from '../lib/concernAttachments';
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
  fieldLabel?: string;
  files: ConcernAttachment[];
  onChange: (files: ConcernAttachment[]) => void;
  maxFiles?: number;
  disabled?: boolean;
  /** Verified fields: PNG/JPG only and Sightengine check before add. */
  requireAuthenticityVerification?: boolean;
}

type RejectionKind = 'ai_generated' | 'manipulated' | 'unsupported' | 'error';

type VerificationRejection = {
  fileName: string;
  dataUrl: string;
  message: string;
  genai: number;
  deepfake: number;
  kind: RejectionKind;
};

const REJECTION_HEADLINES: Record<RejectionKind, string> = {
  ai_generated: 'Possible AI-generated image',
  manipulated: 'Possible manipulated image',
  unsupported: 'File not accepted',
  error: 'Could not verify file'
};

function classifyRejectionKind(
  message: string,
  genai: number,
  deepfake: number
): RejectionKind {
  const lower = message.toLowerCase();
  if (lower.includes('manipulated') || lower.includes('deepfake')) {
    return 'manipulated';
  }
  if (lower.includes('ai-generated') || lower.includes('ai generated')) {
    return 'ai_generated';
  }
  if (genai > deepfake && genai > 0) return 'ai_generated';
  if (deepfake > genai && deepfake > 0) return 'manipulated';
  return 'ai_generated';
}

function RejectionKindIcon({ kind }: { kind: RejectionKind }) {
  const className = 'h-4 w-4';
  if (kind === 'manipulated') return <UserXIcon className={className} aria-hidden />;
  if (kind === 'error') return <ShieldAlertIcon className={className} aria-hidden />;
  if (kind === 'unsupported') return <FileTextIcon className={className} aria-hidden />;
  return <BotIcon className={className} aria-hidden />;
}

function RejectionThumbnail({
  rejection,
  isManipulated
}: {
  rejection: VerificationRejection;
  isManipulated: boolean;
}) {
  if (rejection.kind === 'unsupported' && !rejection.dataUrl.startsWith('data:image/')) {
    return (
      <div
        className={`verify-rejection-thumb flex items-center justify-center${isManipulated ? ' verify-rejection-card--manipulated' : ''}`}>
        <FileTextIcon
          className="h-6 w-6"
          style={{ color: 'var(--verify-reject-icon-fg)' }}
          aria-hidden
        />
        <span className="verify-rejection-thumb-badge">
          <ShieldAlertIcon className="h-3 w-3" aria-hidden />
        </span>
      </div>
    );
  }

  return (
    <div
      className={`verify-rejection-thumb${isManipulated ? ' verify-rejection-card--manipulated' : ''}`}>
      <img src={rejection.dataUrl} alt="" />
      <div className="verify-rejection-thumb-overlay" />
      <span className="verify-rejection-thumb-badge">
        {rejection.kind === 'manipulated' ? (
          <UserXIcon className="h-3 w-3" aria-hidden />
        ) : rejection.kind === 'error' ? (
          <ShieldAlertIcon className="h-3 w-3" aria-hidden />
        ) : (
          <BotIcon className="h-3 w-3" aria-hidden />
        )}
      </span>
    </div>
  );
}

function VerificationRejectionCard({
  rejection,
  onDismiss,
  onTryAgain
}: {
  rejection: VerificationRejection;
  onDismiss: () => void;
  onTryAgain: () => void;
}) {
  const isManipulated = rejection.kind === 'manipulated';
  const showScores = rejection.genai > 0 || rejection.deepfake > 0;
  const showHint =
    rejection.kind === 'ai_generated' || rejection.kind === 'manipulated';

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`verify-rejection-card pl-4 ${isManipulated ? 'verify-rejection-card--manipulated' : ''}`}>
      <div className="flex gap-3">
        <RejectionThumbnail rejection={rejection} isManipulated={isManipulated} />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-start gap-2">
              <div className="verify-rejection-icon-wrap shrink-0">
                <RejectionKindIcon kind={rejection.kind} />
              </div>
              <div className="min-w-0">
                <p className="verify-rejection-title">
                  {REJECTION_HEADLINES[rejection.kind]}
                </p>
                {rejection.fileName ? (
                  <p className="verify-rejection-filename" title={rejection.fileName}>
                    {rejection.fileName}
                  </p>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              onClick={onDismiss}
              className="verify-rejection-dismiss"
              aria-label="Dismiss rejection notice">
              <XIcon className="h-4 w-4" />
            </button>
          </div>
          <p className="verify-rejection-message">{rejection.message}</p>
          {showHint ? (
            <p className="verify-rejection-hint">
              Upload a clear photo taken with a camera or scanner.
            </p>
          ) : null}
          {showScores ? (
            <div className="flex flex-wrap gap-1.5">
              {rejection.genai > 0 ? (
                <span className="verify-rejection-pill-ai">
                  AI signal {Math.round(rejection.genai * 100)}%
                </span>
              ) : null}
              {rejection.deepfake > 0 ? (
                <span className="verify-rejection-pill-face">
                  Face manipulation {Math.round(rejection.deepfake * 100)}%
                </span>
              ) : null}
            </div>
          ) : null}
          <button type="button" onClick={onTryAgain} className="verify-rejection-btn">
            <UploadCloudIcon className="h-3.5 w-3.5" aria-hidden />
            Try another file
          </button>
        </div>
      </div>
    </div>
  );
}

function AttachmentThumbnail({ file }: { file: ConcernAttachment }) {
  const isImage = file.mimeType.startsWith('image/');
  if (isImage && file.dataUrl) {
    return (
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)]">
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
  fieldLabel,
  files,
  onChange,
  maxFiles = 5,
  disabled = false,
  requireAuthenticityVerification = false
}: FileUploadZoneProps) {
  const apiFieldName = getApiFieldNameForUpload(fieldName, fieldLabel);
  const inputRef = useRef<HTMLInputElement>(null);
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [verifyingLabel, setVerifyingLabel] = useState<string | null>(null);
  const [verificationRejection, setVerificationRejection] =
    useState<VerificationRejection | null>(null);
  const [rejectionFlash, setRejectionFlash] = useState(false);

  const verifiedCount = files.filter((f) => f.verified).length;
  const slotsLeft = maxFiles - files.length;

  const clearRejection = () => {
    setVerificationRejection(null);
    setRejectionFlash(false);
    if (flashTimeoutRef.current) {
      clearTimeout(flashTimeoutRef.current);
      flashTimeoutRef.current = null;
    }
  };

  const triggerRejectionFlash = () => {
    setRejectionFlash(true);
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    flashTimeoutRef.current = setTimeout(() => {
      setRejectionFlash(false);
      flashTimeoutRef.current = null;
    }, 2000);
  };

  const showRejection = (rejection: VerificationRejection, toastTitle?: string) => {
    setVerificationRejection(rejection);
    triggerRejectionFlash();
    if (toastTitle) {
      toast.error(toastTitle);
    }
  };

  const handleTryAnotherFile = () => {
    clearRejection();
    inputRef.current?.click();
  };

  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    };
  }, []);

  const processFile = async (file: File) => {
    clearRejection();

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
      if (mimeType === 'application/pdf') {
        showRejection(
          {
            fileName: file.name,
            dataUrl: '',
            message: PDF_AUTHENTICITY_MESSAGE,
            genai: 0,
            deepfake: 0,
            kind: 'unsupported'
          },
          'File not accepted'
        );
        return;
      }
      if (!isVerifiedImageMimeType(mimeType)) {
        showRejection(
          {
            fileName: file.name,
            dataUrl: '',
            message:
              'Only PNG or JPG files are allowed for AI authenticity checking.',
            genai: 0,
            deepfake: 0,
            kind: 'unsupported'
          },
          'File not accepted'
        );
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
        if (!apiFieldName) {
          showRejection(
            {
              fileName: file.name,
              dataUrl,
              message: 'Unable to verify the file. Please try again.',
              genai: 0,
              deepfake: 0,
              kind: 'error'
            },
            'Could not verify file'
          );
          return;
        }
        let result;
        try {
          result = await verifyConcernAttachment({
            fieldName: apiFieldName,
            dataUrl,
            fileName: file.name,
            mimeType
          });
        } catch {
          showRejection(
            {
              fileName: file.name,
              dataUrl,
              message: 'Unable to verify the file. Please try again.',
              genai: 0,
              deepfake: 0,
              kind: 'error'
            },
            'Could not verify file'
          );
          return;
        }

        if (!result.ok) {
          const kind = classifyRejectionKind(
            result.message,
            result.genai,
            result.deepfake
          );
          showRejection(
            {
              fileName: file.name,
              dataUrl,
              message:
                result.message ||
                'Possible AI-generated or manipulated file',
              genai: result.genai,
              deepfake: result.deepfake,
              kind
            },
            REJECTION_HEADLINES[kind]
          );
          return;
        }

        clearRejection();
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
    if (rejectionFlash) {
      return 'verify-drop-flash animate-pulse';
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
        <div className="verify-info-panel">
          <div className="flex gap-3">
            <div className="verify-info-icon">
              <ShieldIcon className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="verify-info-title">Authenticity check</p>
              <p className="verify-info-desc">
                Files are scanned for AI-generated content and face manipulation
                before they can be attached.
              </p>
              <ul className="flex flex-wrap gap-x-3 gap-y-1 pt-1 text-[11px] text-[var(--text-muted)]">
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
            className="verify-scan-overlay pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 backdrop-blur-[2px]"
            aria-live="polite">
            <div className="relative">
              <ScanLineIcon className="h-10 w-10 text-cyan-400/90 animate-pulse" />
              <Loader2Icon className="absolute -right-1 -bottom-1 h-5 w-5 text-purple-400 animate-spin" />
            </div>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Checking if the file is real...
            </p>
            {verifyingLabel ? (
              <p className="max-w-[90%] truncate text-xs text-[var(--text-secondary)] px-4">
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

      {verificationRejection ? (
        <VerificationRejectionCard
          rejection={verificationRejection}
          onDismiss={clearRejection}
          onTryAgain={handleTryAnotherFile}
        />
      ) : null}

      {requireAuthenticityVerification && verifiedCount > 0 ? (
        <div className="verify-success-bar">
          <span className="verify-success-bar-text">
            <ShieldCheckIcon className="h-3.5 w-3.5 shrink-0" />
            {verifiedCount} verified document{verifiedCount === 1 ? '' : 's'} ready
          </span>
          <span className="text-[11px] text-[var(--text-muted)] tabular-nums">
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
                  ? 'border-[var(--verify-success-border)] bg-[var(--verify-success-bg)]'
                  : 'border-[var(--border-color)] bg-[var(--glass-bg)] hover:bg-[var(--glass-bg-hover)]'
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
                  <span className="verify-file-verified-badge">
                    <ShieldCheckIcon className="h-3 w-3 shrink-0" />
                    Verified as real
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
      ) : requireAuthenticityVerification && !verificationRejection ? (
        <p className="text-center text-[11px] text-[var(--text-muted)] py-1">
          No documents attached yet
        </p>
      ) : null}
    </div>
  );
}
