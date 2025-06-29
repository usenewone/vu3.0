import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { EnhancedEditableField } from './EnhancedEditableField';
import { DataPersistenceStatus } from './DataPersistenceStatus';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, Share2, History, Users, Lock, Unlock } from 'lucide-react';
import { EnhancedPortfolioDataService } from '../../services/enhancedPortfolioDataService';
import { toast } from 'sonner';

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'url' | 'textarea';
  value: string;
  required?: boolean;
  maxLength?: number;
  placeholder?: string;
  section: string;
}

interface RealTimeEditableFormProps {
  formId: string;
  title: string;
  description?: string;
  fields: FormField[];
  onFieldUpdate?: (fieldId: string, value: string) => void;
  isShared?: boolean;
  shareId?: string;
}

export const RealTimeEditableForm: React.FC<RealTimeEditableFormProps> = ({
  formId,
  title,
  description,
  fields: initialFields,
  onFieldUpdate,
  isShared = false,
  shareId
}) => {
  const { isOwner, isGuest } = useAuth();
  const [fields, setFields] = useState<FormField[]>(initialFields);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [pendingChanges, setPendingChanges] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [shareLink, setShareLink] = useState<string>('');
  const [editHistory, setEditHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load form data on mount
  useEffect(() => {
    loadFormData();
    if (isOwner) {
      loadEditHistory();
    }
  }, [formId]);

  // Real-time data synchronization
  useEffect(() => {
    if (!isShared) return;

    const unsubscribe = EnhancedPortfolioDataService.onDataChange((event) => {
      if (event.elementType === 'form' && event.elementId.startsWith(formId)) {
        // Update field value in real-time
        const fieldId = event.elementId.replace(`${formId}_`, '');
        setFields(prev => prev.map(field => 
          field.id === fieldId 
            ? { ...field, value: event.newValue }
            : field
        ));
        
        toast.info('Form updated by owner', {
          duration: 3000,
        });
      }
    });

    return unsubscribe;
  }, [formId, isShared]);

  const loadFormData = async () => {
    try {
      const formData = await EnhancedPortfolioDataService.getElement('form', formId);
      if (formData && formData.fields) {
        setFields(formData.fields);
        setLastSaved(new Date(formData.lastSaved || Date.now()));
      }
    } catch (error) {
      console.error('Failed to load form data:', error);
    }
  };

  const loadEditHistory = async () => {
    try {
      const history = await EnhancedPortfolioDataService.getAuditLog(20);
      const formHistory = history.filter(entry => 
        entry.table_name === 'portfolio_data_v2' && 
        entry.new_data?.element_id?.startsWith(formId)
      );
      setEditHistory(formHistory);
    } catch (error) {
      console.error('Failed to load edit history:', error);
    }
  };

  const handleFieldChange = useCallback(async (fieldId: string, value: string) => {
    if (!isOwner) return;

    // Update local state immediately
    setFields(prev => prev.map(field => 
      field.id === fieldId ? { ...field, value } : field
    ));

    // Auto-save with debouncing
    setPendingChanges(prev => prev + 1);
    
    try {
      const result = await EnhancedPortfolioDataService.saveElement(
        'form',
        `${formId}_${fieldId}`,
        value,
        { autoSave: true, showNotifications: false }
      );

      if (result.success) {
        setPendingChanges(prev => Math.max(0, prev - 1));
        setLastSaved(new Date());
        onFieldUpdate?.(fieldId, value);
      }
    } catch (error) {
      console.error('Failed to save field:', error);
      setPendingChanges(prev => Math.max(0, prev - 1));
    }
  }, [formId, isOwner, onFieldUpdate]);

  const handleBulkSave = async () => {
    if (!isOwner) return;

    setIsSaving(true);
    try {
      const updates = fields.map(field => ({
        elementType: 'form',
        elementId: `${formId}_${field.id}`,
        value: field.value
      }));

      const result = await EnhancedPortfolioDataService.bulkSave(updates);
      
      if (result.success) {
        setLastSaved(new Date());
        setPendingChanges(0);
        toast.success(`Saved ${result.savedCount} fields successfully!`);
        
        // Also save form metadata
        await EnhancedPortfolioDataService.saveElement('form', formId, {
          fields,
          lastSaved: new Date().toISOString(),
          title,
          description
        });
      }
    } catch (error) {
      console.error('Bulk save failed:', error);
      toast.error('Failed to save form. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const generateShareLink = async () => {
    if (!isOwner) return;

    try {
      const shareId = `share_${formId}_${Date.now()}`;
      const shareData = {
        formId,
        shareId,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        permissions: ['read']
      };

      await EnhancedPortfolioDataService.saveElement('share', shareId, shareData);
      
      const link = `${window.location.origin}${window.location.pathname}?share=${shareId}`;
      setShareLink(link);
      
      // Copy to clipboard
      await navigator.clipboard.writeText(link);
      toast.success('Share link copied to clipboard!');
    } catch (error) {
      console.error('Failed to generate share link:', error);
      toast.error('Failed to generate share link');
    }
  };

  const getFieldsBySection = () => {
    const sections = fields.reduce((acc, field) => {
      if (!acc[field.section]) {
        acc[field.section] = [];
      }
      acc[field.section].push(field);
      return acc;
    }, {} as Record<string, FormField[]>);

    return sections;
  };

  const fieldsBySection = getFieldsBySection();

  return (
    <div className="space-y-6">
      {/* Form Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-blue-900 flex items-center gap-2">
                {title}
                {isShared && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    <Users size={14} className="mr-1" />
                    Shared View
                  </Badge>
                )}
              </CardTitle>
              {description && (
                <p className="text-blue-700 mt-2">{description}</p>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {isOwner && (
                <>
                  <Button
                    onClick={() => setIsEditMode(!isEditMode)}
                    variant={isEditMode ? "default" : "outline"}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    {isEditMode ? <Lock size={16} /> : <Unlock size={16} />}
                    {isEditMode ? 'Lock' : 'Edit'}
                  </Button>
                  
                  <Button
                    onClick={handleBulkSave}
                    disabled={isSaving || pendingChanges === 0}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Save size={16} />
                    {isSaving ? 'Saving...' : 'Save All'}
                  </Button>
                  
                  <Button
                    onClick={generateShareLink}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Share2 size={16} />
                    Share
                  </Button>
                  
                  <Button
                    onClick={() => setShowHistory(!showHistory)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <History size={16} />
                    History
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Edit History Panel */}
      {showHistory && isOwner && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Edit History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {editHistory.map((entry, index) => (
                <div key={entry.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">{entry.action}</span>
                    <span className="text-sm text-gray-600 ml-2">
                      {entry.changed_fields?.join(', ')}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(entry.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Sections */}
      {Object.entries(fieldsBySection).map(([sectionName, sectionFields]) => (
        <Card key={sectionName}>
          <CardHeader>
            <CardTitle className="text-lg capitalize">{sectionName}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sectionFields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  
                  <EnhancedEditableField
                    value={field.value}
                    onSave={(value) => handleFieldChange(field.id, value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    isEditMode={isEditMode && isOwner}
                    multiline={field.type === 'textarea'}
                    placeholder={field.placeholder}
                    fieldType={field.type}
                    elementId={field.id}
                    elementType="form"
                    autoSave={true}
                    autoSaveDelay={1500}
                    maxLength={field.maxLength}
                    required={field.required}
                    validateOnChange={true}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Share Link Display */}
      {shareLink && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-green-900">Share Link Generated</h3>
                <p className="text-sm text-green-700 mt-1">
                  Anyone with this link can view the form (read-only)
                </p>
              </div>
              <Button
                onClick={() => navigator.clipboard.writeText(shareLink)}
                variant="outline"
                size="sm"
                className="border-green-300 text-green-700 hover:bg-green-100"
              >
                Copy Link
              </Button>
            </div>
            <div className="mt-3 p-2 bg-white border border-green-200 rounded text-sm font-mono break-all">
              {shareLink}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Persistence Status */}
      <DataPersistenceStatus
        isOnline={isOnline}
        pendingChanges={pendingChanges}
        lastSyncTime={lastSaved}
      />
    </div>
  );
};