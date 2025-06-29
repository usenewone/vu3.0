
import React, { useState, useRef, useEffect } from 'react';
import { PortfolioDataService } from '../services/portfolioDataService'; 
import { useAuth } from '@/contexts/AuthContext';

interface EditableTextProps {
  elementId: string;
  initialValue: string;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
  onSave?: (value: string) => void;
}

export const EditableText: React.FC<EditableTextProps> = ({
  elementId,
  initialValue,
  className = '',
  placeholder = 'Click to edit...',
  multiline = false,
  onSave
}) => {
  const { isOwner } = useAuth();
  const [value, setValue] = useState(initialValue);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select();
      }
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (!isOwner) return;
    
    setIsSaving(true);
    try {
      await PortfolioDataService.saveElement('text', elementId, value);
      setIsEditing(false);
      onSave?.(value);
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setValue(initialValue);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!isOwner) {
    return <div className={className}>{value || placeholder}</div>;
  }

  if (isEditing) {
    const InputComponent = multiline ? 'textarea' : 'input';
    
    return (
      <div className="relative">
        <InputComponent
          ref={inputRef as any}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className={`${className} border-2 border-amber-300 rounded px-2 py-1 w-full bg-white focus:outline-none focus:border-amber-500 ${
            multiline ? 'min-h-20 resize-vertical' : ''
          }`}
          placeholder={placeholder}
          disabled={isSaving}
          {...(multiline ? { rows: 3 } : {})}
        />
        {isSaving && (
          <div className="absolute right-2 top-2">
            <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={`${className} cursor-pointer hover:bg-amber-50 rounded px-2 py-1 border-2 border-transparent hover:border-amber-200 transition-colors group`}
    >
      {value || <span className="text-amber-400 italic">{placeholder}</span>}
      {isOwner && (
        <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-amber-500 text-sm">
          ✏️
        </span>
      )}
    </div>
  );
};
