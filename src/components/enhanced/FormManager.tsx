import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FormBuilder } from './FormBuilder';
import { RealTimeEditableForm } from './RealTimeEditableForm';
import { Plus, FileText, Users, Settings, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { EnhancedPortfolioDataService } from '../../services/enhancedPortfolioDataService';
import { toast } from 'sonner';

interface FormTemplate {
  id: string;
  name: string;
  description: string;
  fields: any[];
  createdAt?: string;
  updatedAt?: string;
}

interface FormInstance {
  id: string;
  templateId: string;
  name: string;
  isActive: boolean;
  shareId?: string;
  createdAt: string;
}

export const FormManager: React.FC = () => {
  const { isOwner, isGuest } = useAuth();
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [instances, setInstances] = useState<FormInstance[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);
  const [selectedInstance, setSelectedInstance] = useState<FormInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('templates');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadTemplates(),
        loadInstances()
      ]);
    } catch (error) {
      console.error('Failed to load form data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const dataMap = await EnhancedPortfolioDataService.loadAllData();
      const templateData: FormTemplate[] = [];
      
      dataMap.forEach((value, key) => {
        if (key.startsWith('form_template_')) {
          templateData.push(value);
        }
      });
      
      setTemplates(templateData);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const loadInstances = async () => {
    try {
      const dataMap = await EnhancedPortfolioDataService.loadAllData();
      const instanceData: FormInstance[] = [];
      
      dataMap.forEach((value, key) => {
        if (key.startsWith('form_instance_')) {
          instanceData.push(value);
        }
      });
      
      setInstances(instanceData);
    } catch (error) {
      console.error('Failed to load instances:', error);
    }
  };

  const createFormInstance = async (template: FormTemplate) => {
    if (!isOwner) return;

    try {
      const instance: FormInstance = {
        id: `instance_${Date.now()}`,
        templateId: template.id,
        name: `${template.name} - ${new Date().toLocaleDateString()}`,
        isActive: true,
        createdAt: new Date().toISOString()
      };

      await EnhancedPortfolioDataService.saveElement(
        'form_instance',
        instance.id,
        instance
      );

      // Initialize form data with template fields
      const formData = {
        fields: template.fields.map(field => ({ ...field, value: '' })),
        templateId: template.id,
        instanceId: instance.id,
        lastSaved: new Date().toISOString()
      };

      await EnhancedPortfolioDataService.saveElement(
        'form',
        instance.id,
        formData
      );

      setInstances(prev => [...prev, instance]);
      setSelectedInstance(instance);
      setActiveTab('instances');
      
      toast.success('Form instance created successfully!');
    } catch (error) {
      console.error('Failed to create form instance:', error);
      toast.error('Failed to create form instance');
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!isOwner) return;

    if (window.confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      try {
        await EnhancedPortfolioDataService.deleteElement('form_template', templateId);
        setTemplates(prev => prev.filter(t => t.id !== templateId));
        toast.success('Template deleted successfully');
      } catch (error) {
        console.error('Failed to delete template:', error);
        toast.error('Failed to delete template');
      }
    }
  };

  const deleteInstance = async (instanceId: string) => {
    if (!isOwner) return;

    if (window.confirm('Are you sure you want to delete this form instance? All data will be lost.')) {
      try {
        await EnhancedPortfolioDataService.deleteElement('form_instance', instanceId);
        await EnhancedPortfolioDataService.deleteElement('form', instanceId);
        setInstances(prev => prev.filter(i => i.id !== instanceId));
        if (selectedInstance?.id === instanceId) {
          setSelectedInstance(null);
        }
        toast.success('Form instance deleted successfully');
      } catch (error) {
        console.error('Failed to delete instance:', error);
        toast.error('Failed to delete form instance');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading forms...</p>
        </div>
      </div>
    );
  }

  // If viewing a specific form instance
  if (selectedInstance) {
    const template = templates.find(t => t.id === selectedInstance.templateId);
    if (!template) {
      return (
        <div className="text-center py-12">
          <p className="text-red-600">Template not found for this form instance</p>
          <Button onClick={() => setSelectedInstance(null)} className="mt-4">
            Back to Forms
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{selectedInstance.name}</h2>
            <p className="text-gray-600">Based on: {template.name}</p>
          </div>
          <Button onClick={() => setSelectedInstance(null)} variant="outline">
            Back to Forms
          </Button>
        </div>

        <RealTimeEditableForm
          formId={selectedInstance.id}
          title={selectedInstance.name}
          description={template.description}
          fields={template.fields}
          shareId={selectedInstance.shareId}
          isShared={!!selectedInstance.shareId}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Form Management</h2>
          <p className="text-gray-600">Create and manage real-time editable forms</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText size={16} />
            Templates
          </TabsTrigger>
          <TabsTrigger value="instances" className="flex items-center gap-2">
            <Users size={16} />
            Form Instances
          </TabsTrigger>
          <TabsTrigger value="builder" className="flex items-center gap-2">
            <Plus size={16} />
            Create Template
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    </div>
                    {isOwner && (
                      <Button
                        onClick={() => deleteTemplate(template.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Fields:</span>
                      <Badge variant="secondary">{template.fields.length}</Badge>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {template.fields.slice(0, 3).map((field, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {field.label}
                        </Badge>
                      ))}
                      {template.fields.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{template.fields.length - 3} more
                        </Badge>
                      )}
                    </div>
                    
                    {isOwner && (
                      <Button
                        onClick={() => createFormInstance(template)}
                        className="w-full mt-4"
                        size="sm"
                      >
                        Create Form Instance
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {templates.length === 0 && (
              <div className="col-span-full text-center py-12">
                <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">No form templates created yet</p>
                {isOwner && (
                  <Button onClick={() => setActiveTab('builder')}>
                    Create Your First Template
                  </Button>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="instances" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {instances.map((instance) => {
              const template = templates.find(t => t.id === instance.templateId);
              return (
                <Card key={instance.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{instance.name}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          Template: {template?.name || 'Unknown'}
                        </p>
                      </div>
                      {isOwner && (
                        <Button
                          onClick={() => deleteInstance(instance.id)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Status:</span>
                        <Badge variant={instance.isActive ? "default" : "secondary"}>
                          {instance.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Created:</span>
                        <span className="text-gray-800">
                          {new Date(instance.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {instance.shareId && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Shared:</span>
                          <Badge variant="outline" className="text-green-600">
                            <Users size={12} className="mr-1" />
                            Public
                          </Badge>
                        </div>
                      )}
                      
                      <Button
                        onClick={() => setSelectedInstance(instance)}
                        className="w-full mt-4"
                        size="sm"
                      >
                        Open Form
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {instances.length === 0 && (
              <div className="col-span-full text-center py-12">
                <Users size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">No form instances created yet</p>
                {isOwner && templates.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-4">
                      Create an instance from one of your templates
                    </p>
                    <Button onClick={() => setActiveTab('templates')}>
                      View Templates
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="builder">
          <FormBuilder onFormCreated={(template) => {
            setTemplates(prev => [...prev, template]);
            setActiveTab('templates');
          }} />
        </TabsContent>
      </Tabs>
    </div>
  );
};