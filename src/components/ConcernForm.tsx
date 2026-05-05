import React, { useState } from 'react';
import { User, Template, Concern } from '../types';
import { categories, templates } from '../data/templates';
import {
  BookOpenIcon,
  FileTextIcon,
  WrenchIcon,
  MessageSquareWarningIcon,
  ArrowLeftIcon,
  CheckCircle2Icon,
  UploadCloudIcon,
  AlertCircleIcon } from
'lucide-react';
interface ConcernFormProps {
  user: User;
  onSubmit: (concern: Partial<Concern>) => void;
  onCancel: () => void;
}
const iconMap: Record<string, React.ElementType> = {
  BookOpen: BookOpenIcon,
  FileText: FileTextIcon,
  Wrench: WrenchIcon,
  MessageSquareWarning: MessageSquareWarningIcon
};
export function ConcernForm({ user, onSubmit, onCancel }: ConcernFormProps) {
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [priority, setPriority] = useState<
    'low' | 'medium' | 'high' | 'urgent'>(
    'medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setStep(2);
  };
  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    // Initialize form data with default title and description
    setFormData({
      title: template.title,
      description: ''
    });
    setStep(3);
  };
  const handleInputChange = (
  e: React.ChangeEvent<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>

  {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;
    setIsSubmitting(true);
    // Extract title and description, keep the rest in formData
    const { title, description, ...restFormData } = formData;
    // Simulate API delay
    setTimeout(() => {
      onSubmit({
        title: title || selectedTemplate.title,
        description: description || 'No description provided.',
        category: selectedTemplate.category,
        subcategory: selectedTemplate.subcategory,
        priority,
        department: selectedTemplate.routeTo,
        formData: restFormData
      });
      setIsSubmitting(false);
    }, 1000);
  };
  const availableTemplates = templates.filter(
    (t) => t.category === selectedCategory
  );
  return (
    <div className="glass-panel p-4 sm:p-6 md:p-8 lg:p-10 animate-fade-in max-w-full w-full rounded-2xl">
      {/* Progress Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-white">
            Submit a Concern
          </h2>
          <div className="text-sm font-medium text-gray-400">
            Step {step} of 3
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <div
            className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-purple-500' : 'bg-white/10'}`} />
          
          <div
            className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-purple-500' : 'bg-white/10'}`} />
          
          <div
            className={`h-1.5 flex-1 rounded-full ${step >= 3 ? 'bg-purple-500' : 'bg-white/10'}`} />
          
        </div>
      </div>

      {/* Step 1: Category Selection */}
      {step === 1 &&
      <div className="animate-slide-up">
          <h3 className="text-lg font-medium text-white mb-4">
            What type of concern do you have?
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {categories.map((cat) => {
            const Icon = iconMap[cat.icon] || AlertCircleIcon;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategorySelect(cat.id)}
                className="flex flex-col items-start p-4 sm:p-5 min-h-[120px] sm:min-h-0 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-purple-500/50 transition-all text-left group touch-manipulation active:scale-[0.99]">
                
                  <div className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 text-purple-400 mb-3 sm:mb-4 group-hover:scale-105 transition-transform">
                    <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
                  </div>
                  <h4 className="text-base font-semibold text-white mb-1 leading-snug">
                    {cat.id}
                  </h4>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {cat.description}
                  </p>
                </button>);

          })}
          </div>
        </div>
      }

      {/* Step 2: Template Selection */}
      {step === 2 &&
      <div className="animate-slide-up">
          <button
          onClick={() => setStep(1)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 transition-colors">
          
            <ArrowLeftIcon className="h-4 w-4" /> Back to Categories
          </button>

          <h3 className="text-lg font-medium text-white mb-4">
            Select a specific template
          </h3>

          <div className="space-y-2.5 sm:space-y-3">
            {availableTemplates.map((template) =>
          <button
            key={template.id}
            type="button"
            onClick={() => handleTemplateSelect(template)}
            className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-purple-500/50 transition-all text-left group touch-manipulation min-h-[44px] active:scale-[0.99]">
            
                <div className="min-w-0 flex-1">
                  <h4 className="text-base font-medium text-white mb-1 group-hover:text-purple-300 transition-colors leading-snug">
                    {template.title}
                  </h4>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {template.description}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2 text-xs font-medium text-cyan-400 bg-cyan-400/10 px-2.5 py-1.5 rounded-full border border-cyan-400/20 self-start sm:self-center">
                  <span className="hidden sm:inline">Routes to:</span>
                  <span className="sm:hidden">→</span>{' '}
                  {template.routeTo}
                </div>
              </button>
          )}
          </div>
        </div>
      }

      {/* Step 3: Dynamic Form */}
      {step === 3 && selectedTemplate &&
      <div className="animate-slide-up">
          <button
          onClick={() => setStep(2)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 transition-colors">
          
            <ArrowLeftIcon className="h-4 w-4" /> Back to Templates
          </button>

          <div className="mb-6 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-start gap-3">
            <AlertCircleIcon className="h-5 w-5 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-purple-300">
                Smart Routing Active
              </h3>
              <p className="text-xs text-purple-400/80 mt-1">
                This form will be automatically routed to the{' '}
                <strong className="text-purple-300">
                  {selectedTemplate.routeTo}
                </strong>{' '}
                department.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Auto-filled Student Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
              <div>
                <span className="citezen-label text-xs !text-gray-500">
                  Student Name
                </span>
                <div className="text-sm text-gray-300 py-1">{user.name}</div>
              </div>
              <div>
                <span className="citezen-label text-xs !text-gray-500">
                  Student ID
                </span>
                <div className="text-sm text-gray-300 py-1">
                  {user.studentId || 'N/A'}
                </div>
              </div>
            </div>

            {/* Title & Description (Always present) */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="citezen-label" htmlFor="concern-title">
                  Concern Title <span className="text-red-400">*</span>
                </label>
                <input
                id="concern-title"
                type="text"
                name="title"
                value={formData.title || ''}
                onChange={handleInputChange}
                required
                className="citezen-input" />
              
              </div>

              <div className="space-y-1.5">
                <label className="citezen-label" htmlFor="concern-desc">
                  General Description <span className="text-red-400">*</span>
                </label>
                <textarea
                id="concern-desc"
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                required
                rows={4}
                className="citezen-input citezen-textarea"
                placeholder="Provide a brief overview of your concern..." />
              
              </div>
            </div>

            <div className="h-px w-full bg-white/10 my-6" />

            {/* Dynamic Fields from Template */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-1">
                Specific Details
              </h4>

              {selectedTemplate.fields.map((field) =>
            <div key={field.name} className="space-y-1.5">
                  <label className="citezen-label" htmlFor={`field-${field.name}`}>
                    {field.label}{' '}
                    {field.required && <span className="text-red-400">*</span>}
                  </label>

                  {field.type === 'text' || field.type === 'date' ?
              <input
                id={`field-${field.name}`}
                type={field.type}
                name={field.name}
                value={formData[field.name] || ''}
                onChange={handleInputChange}
                required={field.required}
                placeholder={field.placeholder}
                className="citezen-input" /> :

              field.type === 'textarea' ?
              <textarea
                id={`field-${field.name}`}
                name={field.name}
                value={formData[field.name] || ''}
                onChange={handleInputChange}
                required={field.required}
                placeholder={field.placeholder}
                rows={4}
                className="citezen-input citezen-textarea" /> :

              field.type === 'select' ?
              <select
                id={`field-${field.name}`}
                name={field.name}
                value={formData[field.name] || ''}
                onChange={handleInputChange}
                required={field.required}
                className="citezen-input appearance-none bg-[var(--bg-secondary)]">
                
                      <option value="" disabled>
                        Select an option
                      </option>
                      {field.options?.map((opt) =>
                <option key={opt} value={opt}>
                          {opt}
                        </option>
                )}
                    </select> :
              field.type === 'file' ?
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-white/10 border-dashed rounded-xl hover:border-purple-500/50 transition-colors bg-dark-800 cursor-pointer group">
                      <div className="space-y-1 text-center">
                        <UploadCloudIcon className="mx-auto h-10 w-10 text-gray-400 group-hover:text-purple-400 transition-colors" />
                        <div className="flex text-sm text-gray-400 justify-center">
                          <span className="relative cursor-pointer rounded-md font-medium text-purple-400 hover:text-purple-300 focus-within:outline-none">
                            <span>Upload a file</span>
                            <input type="file" className="sr-only" disabled />
                          </span>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, PDF up to 10MB
                        </p>
                      </div>
                    </div> :
              null}
                </div>
            )}
            </div>

            {/* Priority Selection */}
            <div className="pt-4">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Priority Level
              </label>
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
                {(['low', 'medium', 'high', 'urgent'] as const).map((p) =>
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={`min-h-[48px] sm:min-h-[44px] px-3 sm:px-4 py-2.5 rounded-xl text-sm font-medium capitalize border transition-all touch-manipulation ${priority === p ? p === 'urgent' ? 'bg-red-500/20 border-red-500/50 text-red-400' : p === 'high' ? 'bg-orange-500/20 border-orange-500/50 text-orange-400' : p === 'medium' ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-gray-500/20 border-gray-500/50 text-gray-300' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}>
                
                    {p}
                  </button>
              )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-6 border-t border-white/10 mt-6 sm:mt-8">
              <button
              type="button"
              onClick={onCancel}
              className="min-h-[48px] sm:min-h-0 px-5 py-3 sm:py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors text-center border border-white/10 sm:border-transparent touch-manipulation">
              
                Cancel
              </button>
              <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-[48px] sm:min-h-0 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 sm:py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/25 hover:from-purple-500 hover:to-indigo-500 transition-all active:scale-[0.99] disabled:opacity-70 touch-manipulation">
              
                {isSubmitting ?
              <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> :

              <CheckCircle2Icon className="h-4 w-4" />
              }
                Submit Concern
              </button>
            </div>
          </form>
        </div>
      }
    </div>);

}