import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../types';
import {
  CameraIcon,
  LockIcon,
  SaveIcon,
  Loader2Icon,
  PencilIcon,
  XIcon,
  AlertTriangleIcon,
  BadgeCheckIcon,
  CopyIcon,
  MonitorIcon,
  SunIcon,
  MoonIcon,
  CheckIcon,
  SparklesIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { useTheme, ThemePreference } from '../hooks/useTheme';

interface ProfileSectionProps {
  user: User;
  onUpdateProfile: (data: Partial<User>) => Promise<void>;
}

type SettingsTab = 'profile' | 'security' | 'theme';
type EditableCard = 'identity' | 'personal' | 'academic' | 'security' | null;

const ROLE_LABEL: Record<User['role'], string> = {
  student: 'Student',
  staff: 'Staff Member',
  admin: 'Administrator'
};

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

function joinName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.replace(/\s+/g, ' ').trim();
}

function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function FieldBlock({
  label,
  value,
  editing,
  name,
  type = 'text',
  disabled,
  placeholder,
  onChange,
  mono,
  onCopy
}: {
  label: string;
  value: string;
  editing: boolean;
  name: string;
  type?: string;
  disabled?: boolean;
  placeholder?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  mono?: boolean;
  onCopy?: () => void;
}) {
  return (
    <div className="min-w-0">
      <p className="profile-field-label">{label}</p>
      {editing && !disabled ? (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="profile-input"
        />
      ) : (
        <div className="flex items-center gap-1.5 min-w-0">
          <p
            className={`profile-field-value truncate ${mono ? 'font-mono tracking-wide' : ''} ${
              disabled && editing ? 'opacity-70' : ''
            }`}
          >
            {value || '—'}
          </p>
          {onCopy && value && value !== '—' && (
            <button
              type="button"
              onClick={onCopy}
              className="shrink-0 p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors"
              aria-label={`Copy ${label}`}
            >
              <CopyIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function EditButton({
  editing,
  onEdit,
  onCancel
}: {
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
}) {
  return (
    <button
      type="button"
      onClick={editing ? onCancel : onEdit}
      className="profile-edit-btn"
    >
      {editing ? <XIcon className="h-3.5 w-3.5" /> : <PencilIcon className="h-3.5 w-3.5" />}
      {editing ? 'Cancel' : 'Edit'}
    </button>
  );
}

function ThemeSelector() {
  const { theme, preference, setPreference, systemTheme } = useTheme();

  const handleSelect = (pref: ThemePreference) => {
    setPreference(pref);
    if (pref === 'system') {
      toast.success(`Theme set to System (currently ${systemTheme} mode)`);
    } else if (pref === 'dark') {
      toast.success('Dark theme activated');
    } else {
      toast.success('Light theme activated');
    }
  };

  const options: {
    id: ThemePreference;
    label: string;
    badge?: string;
    description: string;
    icon: typeof SunIcon;
  }[] = [
    {
      id: 'light',
      label: 'Light',
      description: 'Clean daylight aesthetic with crisp contrast',
      icon: SunIcon
    },
    {
      id: 'dark',
      label: 'Dark',
      description: 'Deep obsidian navy, comfortable in low light',
      icon: MoonIcon
    },
    {
      id: 'system',
      label: 'System',
      badge: 'Auto',
      description: `Adapts to your device (${systemTheme === 'dark' ? 'currently Dark' : 'currently Light'})`,
      icon: MonitorIcon
    }
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {options.map((opt) => {
          const isSelected = preference === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleSelect(opt.id)}
              className={`group text-left rounded-xl p-3 sm:p-3.5 border transition-all duration-200 flex flex-col justify-between gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                isSelected
                  ? 'border-sky-500 bg-sky-500/[0.08] shadow-md shadow-sky-500/10 ring-1 ring-sky-500/40'
                  : 'border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-sky-500/40 hover:bg-[var(--glass-bg-hover)]'
              }`}
              aria-pressed={isSelected}
            >
              {/* Visual Mockup Preview */}
              {opt.id === 'light' && (
                <div className="relative w-full h-20 rounded-lg overflow-hidden border border-slate-200/90 bg-[#F3F6FA] p-2 flex flex-col justify-between shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    </div>
                    <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">
                      Light
                    </span>
                  </div>
                  <div className="rounded-md bg-white border border-slate-200 p-1.5 shadow-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="h-1.5 w-12 rounded-full bg-sky-500" />
                      <span className="h-1 w-5 rounded-full bg-slate-300" />
                    </div>
                    <span className="block h-1 w-full rounded-full bg-slate-200" />
                  </div>
                </div>
              )}

              {opt.id === 'dark' && (
                <div className="relative w-full h-20 rounded-lg overflow-hidden border border-white/10 bg-[#0B131F] p-2 flex flex-col justify-between shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    </div>
                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                      Dark
                    </span>
                  </div>
                  <div className="rounded-md bg-[#111C2E] border border-white/10 p-1.5 shadow-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="h-1.5 w-12 rounded-full bg-cyan-400" />
                      <span className="h-1 w-5 rounded-full bg-slate-600" />
                    </div>
                    <span className="block h-1 w-full rounded-full bg-slate-700" />
                  </div>
                </div>
              )}

              {opt.id === 'system' && (
                <div className="relative w-full h-20 rounded-lg overflow-hidden border border-[var(--border-color)] flex shadow-xs">
                  <div className="w-1/2 h-full bg-[#F3F6FA] p-2 flex flex-col justify-between border-r border-slate-300/40">
                    <div className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    </div>
                    <div className="rounded bg-white border border-slate-200 p-1 space-y-1">
                      <span className="block h-1.5 w-8 rounded-full bg-sky-500" />
                      <span className="block h-1 w-full rounded-full bg-slate-200" />
                    </div>
                  </div>
                  <div className="w-1/2 h-full bg-[#0B131F] p-2 flex flex-col justify-between">
                    <div className="flex items-center justify-end">
                      <span className="text-[8px] font-semibold text-cyan-400 uppercase">
                        Auto
                      </span>
                    </div>
                    <div className="rounded bg-[#111C2E] border border-white/10 p-1 space-y-1">
                      <span className="block h-1.5 w-8 rounded-full bg-cyan-400" />
                      <span className="block h-1 w-full rounded-full bg-slate-700" />
                    </div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="h-5 w-5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-md flex items-center justify-center">
                      <SparklesIcon className="h-2.5 w-2.5 text-sky-400" />
                    </div>
                  </div>
                </div>
              )}

              {/* Title, Badge & Radio Indicator */}
              <div className="flex items-center justify-between gap-2 pt-0.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`h-6 w-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-sky-500 text-white shadow-xs'
                        : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <opt.icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs sm:text-sm font-semibold text-[var(--text-primary)]">
                      {opt.label}
                    </span>
                    {opt.badge && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/20">
                        {opt.badge}
                      </span>
                    )}
                  </div>
                </div>

                <div
                  className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 transition-all ${
                    isSelected
                      ? 'bg-sky-500 text-white shadow-xs shadow-sky-500/40'
                      : 'border-2 border-[var(--border-color)] group-hover:border-sky-500/40'
                  }`}
                >
                  {isSelected && <CheckIcon className="h-2.5 w-2.5 stroke-[3]" />}
                </div>
              </div>

              {/* Subtitle */}
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                {opt.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Dynamic Status Banner */}
      <div className="p-3 sm:p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)] flex items-start gap-2.5 sm:gap-3">
        <div className="h-7 w-7 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
          <SparklesIcon className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-[var(--text-primary)]">
              Current display mode:
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/20 capitalize">
              {theme} mode
            </span>
            {preference === 'system' && (
              <span className="text-xs text-[var(--text-muted)]">
                (Synced with OS: {systemTheme} mode)
              </span>
            )}
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] mt-1 leading-relaxed">
            {preference === 'system'
              ? `System mode is active. CITEzen is rendering in ${theme} mode to match your device, and will automatically adapt whenever your OS appearance changes.`
              : preference === 'dark'
                ? 'Dark mode is locked. The interface remains in high-contrast obsidian dark mode regardless of device settings.'
                : 'Light mode is locked. The interface remains in clean daylight mode regardless of device settings.'}
          </p>
        </div>
      </div>
    </div>
  );
}

export function ProfileSection({ user, onUpdateProfile }: ProfileSectionProps) {
  const { systemTheme } = useTheme();
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('profile');
  const [editingCard, setEditingCard] = useState<EditableCard>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const split = splitName(user.name);
  const [formData, setFormData] = useState({
    name: user.name,
    firstName: split.firstName,
    lastName: split.lastName,
    email: user.email,
    studentId: user.studentId || '',
    department: user.department || '',
    course: user.course || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user.profilePicture || null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const next = splitName(user.name);
    setFormData((prev) => ({
      ...prev,
      name: user.name,
      firstName: next.firstName,
      lastName: next.lastName,
      email: user.email,
      studentId: user.studentId || '',
      department: user.department || '',
      course: user.course || ''
    }));
    setAvatarPreview(user.profilePicture || null);
  }, [user]);

  const roleLabel = ROLE_LABEL[user.role];
  const displayName = editingCard === 'identity' ? formData.name : user.name;
  const subtitle =
    user.role === 'student'
      ? user.course || 'College of Information Technology Education'
      : user.role === 'staff'
        ? user.department || 'Staff'
        : 'System Administrator';

  const resetForm = () => {
    const next = splitName(user.name);
    setFormData({
      name: user.name,
      firstName: next.firstName,
      lastName: next.lastName,
      email: user.email,
      studentId: user.studentId || '',
      department: user.department || '',
      course: user.course || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setAvatarPreview(user.profilePicture || null);
  };

  const startEdit = (card: EditableCard) => {
    resetForm();
    setEditingCard(card);
  };

  const cancelEdit = () => {
    setEditingCard(null);
    resetForm();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      if (name === 'firstName' || name === 'lastName') {
        const firstName = name === 'firstName' ? value : prev.firstName;
        const lastName = name === 'lastName' ? value : prev.lastName;
        return { ...prev, firstName, lastName, name: joinName(firstName, lastName) };
      }
      if (name === 'name') {
        const parts = splitName(value);
        return { ...prev, name: value, firstName: parts.firstName, lastName: parts.lastName };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
        if (editingCard !== 'identity') setEditingCard('identity');
      };
      reader.readAsDataURL(file);
    }
  };

  const copyValue = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Could not copy');
    }
  };

  const validateAndConfirm = () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (user.role !== 'student') {
      if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email)) {
        toast.error('Valid email is required');
        return;
      }
    }
    if (editingCard === 'security' && formData.newPassword) {
      if (formData.newPassword.length < 6) {
        toast.error('New password must be at least 6 characters');
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        toast.error('New passwords do not match');
        return;
      }
    }
    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    setIsLoading(true);
    try {
      const updateData: Partial<User> = {
        name: formData.name,
        email: formData.email,
        ...(user.role === 'staff' && {
          department: formData.department
        }),
        ...(user.role === 'student' && {
          course: formData.course
        }),
        ...(avatarPreview && {
          profilePicture: avatarPreview
        })
      };
      await onUpdateProfile(updateData);
      toast.success('Profile updated successfully');
      setEditingCard(null);
      setShowConfirmModal(false);
      setFormData((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiscard = () => {
    setShowConfirmModal(false);
    setEditingCard(null);
    resetForm();
  };

  const switchTab = (tab: SettingsTab) => {
    setSettingsTab(tab);
    setEditingCard(null);
    resetForm();
  };

  const navItems: { id: SettingsTab; label: string }[] = [
    { id: 'profile', label: 'My Profile' },
    { id: 'security', label: 'Security' },
    { id: 'theme', label: 'Theme' }
  ];

  const saveBar = (visible: boolean) =>
    visible ? (
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-5 mt-5 border-t border-[var(--border-color)]">
        <button
          type="button"
          onClick={cancelEdit}
          disabled={isLoading}
          className="px-4 py-2 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors"
        >
          Discard
        </button>
        <button
          type="button"
          onClick={validateAndConfirm}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-semibold shadow-md shadow-sky-500/20 transition-all disabled:opacity-70"
        >
          {isLoading ? (
            <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <SaveIcon className="h-3.5 w-3.5" />
          )}
          Save changes
        </button>
      </div>
    ) : null;

  const avatarNode = (
    <div className="relative shrink-0">
      <div className="profile-avatar-ring h-[4.25rem] w-[4.25rem] sm:h-[4.75rem] sm:w-[4.75rem] rounded-full bg-[var(--bg-tertiary)] overflow-hidden flex items-center justify-center">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
            alt={displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
          <span className="text-lg sm:text-xl font-semibold text-sky-400 tracking-wide">
            {initialsFrom(displayName)}
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="absolute -bottom-0.5 -right-0.5 h-7 w-7 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-lg border-2 border-[var(--bg-secondary)] hover:bg-sky-400 transition-colors"
        aria-label="Change profile photo"
      >
        <CameraIcon className="h-3.5 w-3.5" />
      </button>
                    <input
                      type="file"
                      accept="image/jpeg, image/png, image/webp"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleAvatarChange}
                    />
            </div>
  );

  return (
    <div className="profile-settings animate-fade-in max-w-5xl mx-auto">
      <div className="mb-7">
        <h1 className="text-2xl sm:text-[1.75rem] font-semibold text-[var(--text-primary)] tracking-tight">
          Account Settings
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Manage your profile details and security preferences.
        </p>
        </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
        <nav className="lg:w-[11.5rem] shrink-0 lg:sticky lg:top-2 lg:self-start">
          <div className="flex lg:flex-col gap-0.5 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0 -mx-1 px-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => switchTab(item.id)}
                className={`profile-nav-item ${settingsTab === item.id ? 'is-active' : ''}`}
              >
                {item.label}
              </button>
            ))}
            </div>
        </nav>

        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {settingsTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="space-y-4 sm:space-y-5"
              >
                <section className="profile-card">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      {avatarNode}
                      <div className="min-w-0">
                        {editingCard === 'identity' ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                            className="profile-input max-w-xs mb-1.5 font-semibold"
                          />
                        ) : (
                          <h2 className="text-[1.05rem] sm:text-lg font-semibold text-[var(--text-primary)] truncate">
                            {user.name}
                          </h2>
                        )}
                        <p className="text-sm text-[var(--text-secondary)] truncate">
                          {roleLabel}
                        </p>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">
                          {subtitle}
                        </p>
                </div>
              </div>
                    <EditButton
                      editing={editingCard === 'identity'}
                      onEdit={() => startEdit('identity')}
                      onCancel={cancelEdit}
                    />
                  </div>
                  {saveBar(editingCard === 'identity')}
                </section>

                <section className="profile-card">
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <h3 className="text-base font-semibold text-[var(--text-primary)]">
                      Personal information
                    </h3>
                    <EditButton
                      editing={editingCard === 'personal'}
                      onEdit={() => startEdit('personal')}
                      onCancel={cancelEdit}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
                    <FieldBlock
                      label="First Name"
                      name="firstName"
                      value={
                        editingCard === 'personal'
                          ? formData.firstName
                          : splitName(user.name).firstName
                      }
                      editing={editingCard === 'personal'}
                      onChange={handleChange}
                    />
                    <FieldBlock
                      label="Last Name"
                      name="lastName"
                      value={
                        editingCard === 'personal'
                          ? formData.lastName
                          : splitName(user.name).lastName || '—'
                      }
                      editing={editingCard === 'personal'}
                      onChange={handleChange}
                    />
                    <FieldBlock
                      label="Email address"
                      name="email"
                      type="email"
                      value={
                        editingCard === 'personal' ? formData.email : user.email
                      }
                      editing={editingCard === 'personal'}
                      disabled={user.role === 'student'}
                      onChange={handleChange}
                      onCopy={
                        editingCard === 'personal'
                          ? undefined
                          : () => copyValue(user.email)
                      }
                    />
                    <FieldBlock
                      label="Role"
                      name="role"
                      value={roleLabel}
                      editing={false}
                      onChange={handleChange}
                    />
                  </div>
                  {saveBar(editingCard === 'personal')}
                </section>

                <section className="profile-card">
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <h3 className="text-base font-semibold text-[var(--text-primary)]">
                      {user.role === 'student'
                        ? 'Academic details'
                        : user.role === 'staff'
                          ? 'Assignment details'
                          : 'Account details'}
                    </h3>
                    {(user.role === 'student' || user.role === 'staff') && (
                      <EditButton
                        editing={editingCard === 'academic'}
                        onEdit={() => startEdit('academic')}
                        onCancel={cancelEdit}
                      />
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
                    {user.role === 'student' && (
                      <>
                        <FieldBlock
                          label="Student ID"
                          name="studentId"
                          value={user.studentId || '—'}
                          editing={false}
                          mono
                          onChange={handleChange}
                          onCopy={
                            user.studentId
                              ? () => copyValue(user.studentId as string)
                              : undefined
                          }
                        />
                        <FieldBlock
                          label="Course / Program"
                          name="course"
                          value={
                            editingCard === 'academic'
                              ? formData.course
                              : user.course || '—'
                          }
                          editing={editingCard === 'academic'}
                          placeholder="e.g., BSIT, BSCS"
                          onChange={handleChange}
                        />
                        <FieldBlock
                          label="College"
                          name="college"
                          value="College of Information Technology Education"
                          editing={false}
                          onChange={handleChange}
                        />
                        <FieldBlock
                          label="Member since"
                          name="createdAt"
                          value={
                            user.createdAt
                              ? new Date(user.createdAt).toLocaleDateString(undefined, {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })
                              : '—'
                          }
                          editing={false}
                          onChange={handleChange}
                        />
                      </>
                    )}
                    {user.role === 'staff' && (
                      <>
                        <FieldBlock
                          label="Assigned department"
                          name="department"
                          value={
                            editingCard === 'academic'
                              ? formData.department
                              : user.department || '—'
                          }
                          editing={editingCard === 'academic'}
                          onChange={handleChange}
                        />
                        <FieldBlock
                          label="Member since"
                          name="createdAt"
                          value={
                            user.createdAt
                              ? new Date(user.createdAt).toLocaleDateString(undefined, {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })
                              : '—'
                          }
                          editing={false}
                          onChange={handleChange}
                        />
                      </>
                    )}
                    {user.role === 'admin' && (
                      <>
                        <FieldBlock
                          label="Access level"
                          name="access"
                          value="Full administration"
                          editing={false}
                          onChange={handleChange}
                        />
                        <div className="min-w-0">
                          <p className="profile-field-label">Status</p>
                          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-400">
                            <BadgeCheckIcon className="h-4 w-4" />
                            Active
                          </span>
                </div>
                      </>
              )}
            </div>
                  {saveBar(editingCard === 'academic')}
                </section>

                <section className="profile-card">
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div>
                      <h3 className="text-base font-semibold text-[var(--text-primary)]">
                        Theme & Appearance
                      </h3>
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        Choose whether CITEzen displays in light, dark, or syncs with your system.
                      </p>
                    </div>
                  </div>
                  <ThemeSelector />
                </section>
              </motion.div>
            )}

            {settingsTab === 'security' && (
                <motion.div
                key="security"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="space-y-4 sm:space-y-5"
              >
                <section className="profile-card">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h3 className="text-base font-semibold text-[var(--text-primary)]">
                        Password
                      </h3>
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        Leave blank if you do not want to change your password.
                      </p>
                    </div>
                    <EditButton
                      editing={editingCard === 'security'}
                      onEdit={() => startEdit('security')}
                      onCancel={cancelEdit}
                    />
                  </div>

                  {editingCard === 'security' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6 mt-6">
                      <div>
                        <p className="profile-field-label">New password</p>
                      <div className="relative">
                          <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                        <input
                          type="password"
                          name="newPassword"
                          value={formData.newPassword}
                          onChange={handleChange}
                          placeholder="Min. 6 characters"
                            className="profile-input pl-9"
                        />
                      </div>
                    </div>
                    <div>
                        <p className="profile-field-label">Confirm new password</p>
                      <div className="relative">
                          <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                        <input
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="Repeat new password"
                            className="profile-input pl-9"
                        />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6 mt-6">
                      <div>
                        <p className="profile-field-label">Password</p>
                        <p className="profile-field-value tracking-[0.28em]">••••••••</p>
                      </div>
                      <div>
                        <p className="profile-field-label">Last updated</p>
                        <p className="profile-field-value">
                          {user.updatedAt
                            ? new Date(user.updatedAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })
                            : '—'}
                        </p>
                      </div>
                    </div>
                  )}
                  {saveBar(editingCard === 'security')}
                </section>

                <section className="profile-card">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="h-9 w-9 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
                      <MonitorIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-[var(--text-primary)]">
                        Active session
                      </h3>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        You are signed in on this device.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
                    <div>
                      <p className="profile-field-label">Device</p>
                      <p className="profile-field-value">This browser</p>
                    </div>
                    <div>
                      <p className="profile-field-label">Status</p>
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        Active now
                      </span>
                    </div>
              </div>
                </section>
              </motion.div>
            )}

            {settingsTab === 'theme' && (
              <motion.div
                key="theme"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="space-y-4 sm:space-y-5"
              >
                <section className="profile-card">
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div>
                      <h3 className="text-base font-semibold text-[var(--text-primary)]">
                        Theme Preferences
                      </h3>
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        Customize your visual experience across CITEzen. Choose between light, dark, or system mode.
                      </p>
                    </div>
                  </div>
                  <ThemeSelector />
                </section>

                <section className="profile-card">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="h-9 w-9 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
                      <MonitorIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-[var(--text-primary)]">
                        Display & Device Sync
                      </h3>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        Your theme preference is saved and applies across all pages on this device.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
                    <div>
                      <p className="profile-field-label">System Appearance</p>
                      <p className="profile-field-value capitalize">Device currently set to {systemTheme} mode</p>
                    </div>
                    <div>
                      <p className="profile-field-label">Header Quick Toggle</p>
                      <p className="profile-field-value text-xs text-[var(--text-secondary)] font-normal">
                        Click the sun/moon icon at the top right of your screen anytime to quickly flip modes.
                      </p>
                    </div>
                  </div>
                </section>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-dark-900/80 backdrop-blur-sm animate-fade-in">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="glass-panel w-full max-w-sm p-6 rounded-2xl flex flex-col items-center text-center shadow-2xl border border-sky-500/20"
            >
              <div className="h-12 w-12 rounded-full bg-sky-500/10 flex items-center justify-center mb-4 border border-sky-500/20 text-sky-400">
                <AlertTriangleIcon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                Save profile changes?
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed">
                Are you sure you want to apply these updates to your account
                details?
              </p>
              <div className="flex w-full gap-3">
                <button
                  type="button"
                  onClick={handleDiscard}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-[var(--text-primary)] text-sm font-medium hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSave}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-sm font-semibold shadow-lg shadow-sky-500/25 transition-all disabled:opacity-70"
                >
                  {isLoading ? (
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                  ) : (
                    <SaveIcon className="h-4 w-4" />
                  )}
                  Save
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
