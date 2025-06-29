import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, GripVertical, Save } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
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

interface FormTemplate {
  id: string;
  name: string;
  description: string;
  fields: FormField[];
}

interface FormBuilderProps {
  onFormCreated: (form: FormTemplate) => void;
}

export const FormBuilder: React.FC<FormBuilderProps> = ({ onFormCreated }) => {
  const { isOwner } = useAuth();
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [fields, setFields] = useState<FormField[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fieldTypes = [
    { value: 'text', label: 'Text' },
    { value: 'textarea', label: 'Long Text' },
    { value: 'number', label: 'Number' },
    { value: 'email', label: 'Email' },
    { value: 'url', label: 'URL' }
  ];

  const sections = [
    'Personal Information',
    'Contact Details',
    'Project Information',
    'Additional Details'
  ];

  const addField = () => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      label: 'New Field',
      type: 'text',
      value: '',
      required: false,
      maxLength: 255,
      placeholder: 'Enter value...',
      section: 'Personal Information'
    };
    setFields([...fields, newField]);
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    setFields(prev => prev.map((field, i) => 
      i === index ? { ...field, ...updates } : field
    ));
  };

  const removeField = (index: number) => {
    setFields(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    const draggedField = fields[draggedIndex];
    const newFields = [...fields];
    newFields.splice(draggedIndex, 1);
    newFields.splice(dropIndex, 0, draggedField);
    
    setFields(newFields);
    setDraggedIndex(null);
  };

  const saveForm = async () => {
    if (!isOwner) return;
    
    if (!formName.trim()) {
      toast.error('Please enter a form name');
      return;
    }

    if (fields.length === 0) {
      toast.error('Please add at least one field');
      return;
    }

    setIsSaving(true);
    try {
      const formTemplate: FormTemplate = {
        id: `form_${Date.now()}`,
        name: formName,
        description: formDescription,
        fields
      };

      await EnhancedPortfolioDataService.saveElement(
        'form_template',
        formTemplate.id,
        formTemplate
      );

      toast.success('Form template saved successfully!');
      onFormCreated(formTemplate);
      
      // Reset form
      setFormName('');
      setFormDescription('');
      setFields([]);
    } catch (error) {
      console.error('Failed to save form:', error);
      toast.error('Failed to save form template');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOwner) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-500">
            Only owners can create form templates
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Form Template</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Form Name</label>
            <Input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Enter form name..."
              className="mt-1"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700">Description</label>
            <Textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Enter form description..."
              className="mt-1"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Form Fields</CardTitle>
            <Button onClick={addField} size="sm" className="flex items-center gap-2">
              <Plus size={16} />
              Add Field
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {fields.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No fields added yet. Click "Add Field" to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="cursor-move mt-2">
                      <GripVertical size={16} className="text-gray-400" />
                    </div>
                    
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="text-xs font-medium text-gray-600">Label</label>
                        <Input
                          value={field.label}
                          onChange={(e) => updateField(index, { label: e.target.value })}
                          placeholder="Field label"
                          size="sm"
                        />
                      </div>
                      
                      <div>
                        <label className="text-xs font-medium text-gray-600">Type</label>
                        <Select
                          value={field.type}
                          onValueChange={(value) => updateField(index, { type: value as any })}
                        >
                          <SelectTrigger size="sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {fieldTypes.map(type => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="text-xs font-medium text-gray-600">Section</label>
                        <Select
                          value={field.section}
                          onValueChange={(value) => updateField(index, { section: value })}
                        >
                          <SelectTrigger size="sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {sections.map(section => (
                              <SelectItem key={section} value={section}>
                                {section}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="text-xs font-medium text-gray-600">Placeholder</label>
                        <Input
                          value={field.placeholder}
                          onChange={(e) => updateField(index, { placeholder: e.target.value })}
                          placeholder="Placeholder text"
                          size="sm"
                        />
                      </div>
                      
                      <div>
                        <label className="text-xs font-medium text-gray-600">Max Length</label>
                        <Input
                          type="number"
                          value={field.maxLength}
                          onChange={(e) => updateField(index, { maxLength: parseInt(e.target.value) || 255 })}
                          placeholder="255"
                          size="sm"
                        />
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => updateField(index, { required: e.target.checked })}
                            className="rounded"
                          />
                          <span className="text-xs font-medium text-gray-600">Required</span>
                        </label>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => removeField(index)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                  
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant="secondary">{field.type}</Badge>
                    {field.required && <Badge variant="destructive">Required</Badge>}
                    <Badge variant="outline">{field.section}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {fields.length > 0 && (
        <div className="flex justify-end">
          <Button
            onClick={saveForm}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            <Save size={16} />
            {isSaving ? 'Saving...' : 'Save Form Template'}
          </Button>
        </div>
      )}
    </div>
  );
};