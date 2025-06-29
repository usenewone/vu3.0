import React, { useState, useRef, useEffect } from 'react';
import { Save, X, Trash2, Edit3, Check, Loader2 } from 'lucide-react';
import { PortfolioDataService } from '../services/portfolioDataService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface EditableFieldProps {
  value: string;
  onSave: (value: string) => void;
  onDelete?: () => void;
  className?: string;
  isEditMode: boolean;
  multiline?: boolean;
  placeholder?: string;
  label?: string;
  fieldType?: 'text' | 'title' | 'description';
  elementId: string;
  elementType?: string;
  autoSave?: boolean;
}

export const EditableField: React.FC<EditableFieldProps> = ({
  value,
  onSave,
  onDelete,
  className = '',
  isEditMode,
  multiline = false,
  placeholder = 'Click to edit...',
  label,
  fieldType = 'text',
  elementId,
  elementType = 'text',
  autoSave = true
}) => {
  const { isOwner } = useAuth();
  const [editValue, setEditValue] = useState(value);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select();
      }
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (editValue.trim() === '' || !isOwner) return;
    
    setIsSaving(true);
    try {
      // Save to Supabase
      await PortfolioDataService.saveElement(elementType, elementId, editValue);
      
      // Update local state
      onSave(editValue);
      setIsEditing(false);
      setLastSaved(new Date());
      
      toast.success('Changes saved successfully!', {
        duration: 2000,
      });
    } catch (error) {
      console.error('Failed to save:', error);
      toast.error('Failed to save changes. Please try again.', {
        duration: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!onDelete || !isOwner) return;
    
    if (window.confirm('Are you sure you want to delete this field?')) {
      try {
        setIsSaving(true);
        // Delete from Supabase
        await PortfolioDataService.deleteElement(elementType, elementId);
        onDelete();
        toast.success('Field deleted successfully!');
      } catch (error) {
        console.error('Failed to delete:', error);
        toast.error('Failed to delete field. Please try again.');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || !isEditing || !isOwner || editValue === value) return;

    const timeoutId = setTimeout(() => {
      if (editValue.trim() !== '' && editValue !== value) {
        handleSave();
      }
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timeoutId);
  }, [editValue, autoSave, isEditing, isOwner, value]);

  if (!isEditMode || !isOwner) {
    return (
      <div className={className}>
        {label && <label className="text-sm font-semibold text-amber-700 block mb-2">{label}</label>}
        <div className="text-amber-800">{value || placeholder}</div>
        {lastSaved && (
          <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
            <Check size={12} />
            Last saved: {lastSaved.toLocaleTimeString()}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-semibold text-amber-700 block">{label}</label>}
      
      {isEditing ? (
        <div className="border-2 border-amber-300 rounded-lg p-3 bg-white shadow-lg">
          {multiline ? (
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full border-none outline-none resize-vertical min-h-20"
              placeholder={placeholder}
              rows={3}
              disabled={isSaving}
            />
          ) : (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full border-none outline-none"
              placeholder={placeholder}
              disabled={isSaving}
            />
          )}
          
          <div className="flex justify-between items-center mt-3 pt-2 border-t border-amber-100">
            <div className="flex items-center space-x-2">
              {autoSave && (
                <div className="text-xs text-amber-600 flex items-center gap-1">
                  {isSaving ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={12} />
                      Auto-save enabled
                    </>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={handleCancel}
                className="flex items-center space-x-1 px-3 py-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors text-sm"
                disabled={isSaving}
              >
                <X size={14} />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || editValue.trim() === ''}
                className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 text-white hover:bg-green-700 disabled:bg-green-400 rounded-md transition-colors text-sm"
              >
                {isSaving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                <span>{isSaving ? 'Saving...' : 'Save'}</span>
              </button>
              {onDelete && (
                <button
                  onClick={handleDelete}
                  disabled={isSaving}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400 rounded-md transition-colors text-sm"
                >
                  <Trash2 size={14} />
                  <span>Delete</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="group relative border border-transparent hover:border-amber-200 rounded-lg p-3 hover:bg-amber-50/50 transition-all cursor-pointer">
          <div
            onClick={() => setIsEditing(true)}
            className={`${className} ${!value ? 'text-amber-400 italic' : 'text-amber-800'}`}
          >
            {value || placeholder}
          </div>
          
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded-md transition-colors"
              title="Edit"
            >
              <Edit3 size={14} />
            </button>
            {onDelete && (
              <button
                onClick={handleDelete}
                className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-md transition-colors"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
          
          {lastSaved && (
            <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <Check size={12} />
              Last saved: {lastSaved.toLocaleTimeString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};