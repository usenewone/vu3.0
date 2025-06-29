import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Save, X, Trash2, Edit3, Check, Loader2, AlertCircle } from 'lucide-react';
import { EnhancedPortfolioDataService } from '../../services/enhancedPortfolioDataService';
import { DataValidator } from '../../services/dataValidation';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface EnhancedEditableFieldProps {
  value: string;
  onSave: (value: string) => void;
  onDelete?: () => void;
  className?: string;
  isEditMode: boolean;
  multiline?: boolean;
  placeholder?: string;
  label?: string;
  fieldType?: 'text' | 'title' | 'description' | 'email' | 'url';
  elementId: string;
  elementType?: string;
  autoSave?: boolean;
  autoSaveDelay?: number;
  maxLength?: number;
  required?: boolean;
  validateOnChange?: boolean;
}

export const EnhancedEditableField: React.FC<EnhancedEditableFieldProps> = ({
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
  autoSave = true,
  autoSaveDelay = 2000,
  maxLength = 10000,
  required = false,
  validateOnChange = true
}) => {
  const { isOwner } = useAuth();
  const [editValue, setEditValue] = useState(value);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setEditValue(value);
    setHasUnsavedChanges(false);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select();
      }
    }
  }, [isEditing]);

  // Validation function
  const validateValue = useCallback((val: string) => {
    const errors: string[] = [];
    
    if (required && !val.trim()) {
      errors.push('This field is required');
    }
    
    if (val.length > maxLength) {
      errors.push(`Maximum ${maxLength} characters allowed`);
    }
    
    // Field-specific validation
    switch (fieldType) {
      case 'email':
        const emailValidation = DataValidator.validateEmail(val);
        if (val && !emailValidation.isValid) {
          errors.push(...emailValidation.errors);
        }
        break;
      case 'url':
        const urlValidation = DataValidator.validateUrl(val);
        if (val && !urlValidation.isValid) {
          errors.push(...urlValidation.errors);
        }
        break;
      default:
        const textValidation = DataValidator.validateText(val, maxLength);
        if (!textValidation.isValid) {
          errors.push(...textValidation.errors);
        }
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  }, [fieldType, maxLength, required]);

  // Auto-save functionality
  const triggerAutoSave = useCallback((val: string) => {
    if (!autoSave || !isOwner || val === value) return;
    
    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    // Set new timeout
    autoSaveTimeoutRef.current = setTimeout(async () => {
      if (validateValue(val)) {
        setIsSaving(true);
        const result = await EnhancedPortfolioDataService.saveElement(
          elementType,
          elementId,
          val,
          { autoSave: true, showNotifications: false }
        );
        
        if (result.success) {
          onSave(val);
          setLastSaved(new Date());
          setHasUnsavedChanges(false);
        }
        setIsSaving(false);
      }
    }, autoSaveDelay);
  }, [autoSave, autoSaveDelay, elementType, elementId, isOwner, onSave, validateValue, value]);

  const handleSave = async () => {
    if (!isOwner || !validateValue(editValue)) return;
    
    setIsSaving(true);
    try {
      const result = await EnhancedPortfolioDataService.saveElement(
        elementType,
        elementId,
        editValue,
        { autoSave: false, showNotifications: true }
      );
      
      if (result.success) {
        onSave(editValue);
        setIsEditing(false);
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
    setValidationErrors([]);
    setHasUnsavedChanges(false);
    
    // Clear auto-save timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || !isOwner) return;
    
    if (window.confirm('Are you sure you want to delete this field?')) {
      const success = await EnhancedPortfolioDataService.deleteElement(elementType, elementId);
      if (success) {
        onDelete();
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setEditValue(newValue);
    setHasUnsavedChanges(newValue !== value);
    
    if (validateOnChange) {
      validateValue(newValue);
    }
    
    // Trigger auto-save
    triggerAutoSave(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

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
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              className="w-full border-none outline-none resize-vertical min-h-20"
              placeholder={placeholder}
              rows={3}
              disabled={isSaving}
              maxLength={maxLength}
            />
          ) : (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type={fieldType === 'email' ? 'email' : fieldType === 'url' ? 'url' : 'text'}
              value={editValue}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              className="w-full border-none outline-none"
              placeholder={placeholder}
              disabled={isSaving}
              maxLength={maxLength}
            />
          )}
          
          {/* Character count */}
          <div className="text-xs text-gray-500 mt-1">
            {editValue.length}/{maxLength} characters
          </div>
          
          {/* Validation errors */}
          {validationErrors.length > 0 && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
              {validationErrors.map((error, index) => (
                <div key={index} className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {error}
                </div>
              ))}
            </div>
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
                  ) : hasUnsavedChanges ? (
                    <>
                      <AlertCircle size={12} />
                      Unsaved changes
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
                disabled={isSaving || validationErrors.length > 0 || editValue.trim() === ''}
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
          
          {hasUnsavedChanges && (
            <div className="text-xs text-orange-600 mt-1 flex items-center gap-1">
              <AlertCircle size={12} />
              Unsaved changes
            </div>
          )}
        </div>
      )}
    </div>
  );
};