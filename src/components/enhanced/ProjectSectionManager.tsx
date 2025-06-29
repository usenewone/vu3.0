import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, GripVertical, Save, Edit3, Check, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { EnhancedPortfolioDataService } from '../../services/enhancedPortfolioDataService';
import { toast } from 'sonner';

interface ProjectSection {
  id: string;
  name: string;
  description: string;
  orderIndex: number;
  isActive: boolean;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

interface ProjectSectionManagerProps {
  projectId: string;
  onSectionsUpdate?: (sections: ProjectSection[]) => void;
}

export const ProjectSectionManager: React.FC<ProjectSectionManagerProps> = ({
  projectId,
  onSectionsUpdate
}) => {
  const { isOwner } = useAuth();
  const [sections, setSections] = useState<ProjectSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [newSection, setNewSection] = useState({
    name: '',
    description: ''
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProjectSections();
  }, [projectId]);

  const loadProjectSections = async () => {
    try {
      setLoading(true);
      const dataMap = await EnhancedPortfolioDataService.loadAllData();
      const projectSections: ProjectSection[] = [];
      
      dataMap.forEach((value, key) => {
        if (key.startsWith(`project_section_${projectId}_`)) {
          projectSections.push(value);
        }
      });
      
      // Sort by order index
      projectSections.sort((a, b) => a.orderIndex - b.orderIndex);
      setSections(projectSections);
      onSectionsUpdate?.(projectSections);
    } catch (error) {
      console.error('Failed to load project sections:', error);
      toast.error('Failed to load project sections');
    } finally {
      setLoading(false);
    }
  };

  const validateSection = (name: string, description: string): string[] => {
    const errors: string[] = [];
    
    if (!name.trim()) {
      errors.push('Section name is required');
    }
    
    if (name.trim().length > 100) {
      errors.push('Section name must be 100 characters or less');
    }
    
    if (description.trim().length > 500) {
      errors.push('Description must be 500 characters or less');
    }
    
    // Check for duplicate names
    const existingNames = sections
      .filter(s => s.id !== editingSection)
      .map(s => s.name.toLowerCase().trim());
    
    if (existingNames.includes(name.toLowerCase().trim())) {
      errors.push('A section with this name already exists');
    }
    
    return errors;
  };

  const addSection = async () => {
    if (!isOwner) return;
    
    const errors = validateSection(newSection.name, newSection.description);
    if (errors.length > 0) {
      toast.error(errors.join(', '));
      return;
    }
    
    try {
      setSaving(true);
      
      const section: ProjectSection = {
        id: `section_${Date.now()}`,
        name: newSection.name.trim(),
        description: newSection.description.trim(),
        orderIndex: sections.length,
        isActive: true,
        projectId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await EnhancedPortfolioDataService.saveElement(
        'project_section',
        `${projectId}_${section.id}`,
        section
      );
      
      setSections(prev => [...prev, section]);
      setNewSection({ name: '', description: '' });
      setShowAddForm(false);
      onSectionsUpdate?.([...sections, section]);
      
      toast.success('Section added successfully!');
    } catch (error) {
      console.error('Failed to add section:', error);
      toast.error('Failed to add section');
    } finally {
      setSaving(false);
    }
  };

  const updateSection = async (sectionId: string, updates: Partial<ProjectSection>) => {
    if (!isOwner) return;
    
    try {
      setSaving(true);
      
      const updatedSection = {
        ...sections.find(s => s.id === sectionId)!,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      // Validate if name is being updated
      if (updates.name !== undefined) {
        const errors = validateSection(updates.name, updatedSection.description);
        if (errors.length > 0) {
          toast.error(errors.join(', '));
          return;
        }
      }
      
      await EnhancedPortfolioDataService.saveElement(
        'project_section',
        `${projectId}_${sectionId}`,
        updatedSection
      );
      
      setSections(prev => prev.map(s => 
        s.id === sectionId ? updatedSection : s
      ));
      
      setEditingSection(null);
      onSectionsUpdate?.(sections.map(s => s.id === sectionId ? updatedSection : s));
      
      toast.success('Section updated successfully!');
    } catch (error) {
      console.error('Failed to update section:', error);
      toast.error('Failed to update section');
    } finally {
      setSaving(false);
    }
  };

  const deleteSection = async (sectionId: string) => {
    if (!isOwner) return;
    
    if (!window.confirm('Are you sure you want to delete this section? This action cannot be undone.')) {
      return;
    }
    
    try {
      setSaving(true);
      
      await EnhancedPortfolioDataService.deleteElement(
        'project_section',
        `${projectId}_${sectionId}`
      );
      
      const updatedSections = sections.filter(s => s.id !== sectionId);
      setSections(updatedSections);
      onSectionsUpdate?.(updatedSections);
      
      toast.success('Section deleted successfully!');
    } catch (error) {
      console.error('Failed to delete section:', error);
      toast.error('Failed to delete section');
    } finally {
      setSaving(false);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || !isOwner) return;

    const draggedSection = sections[draggedIndex];
    const newSections = [...sections];
    newSections.splice(draggedIndex, 1);
    newSections.splice(dropIndex, 0, draggedSection);
    
    // Update order indexes
    const updatedSections = newSections.map((section, index) => ({
      ...section,
      orderIndex: index,
      updatedAt: new Date().toISOString()
    }));
    
    setSections(updatedSections);
    setDraggedIndex(null);
    
    // Save updated order to database
    try {
      const updates = updatedSections.map(section => ({
        elementType: 'project_section',
        elementId: `${projectId}_${section.id}`,
        value: section
      }));
      
      await EnhancedPortfolioDataService.bulkSave(updates);
      onSectionsUpdate?.(updatedSections);
      
      toast.success('Section order updated successfully!');
    } catch (error) {
      console.error('Failed to update section order:', error);
      toast.error('Failed to update section order');
      // Revert on error
      loadProjectSections();
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3"></div>
            <span className="text-gray-600">Loading sections...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Project Sections</CardTitle>
          {isOwner && (
            <Button
              onClick={() => setShowAddForm(true)}
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              Add Section
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Add New Section Form */}
        {showAddForm && isOwner && (
          <Card className="mb-6 border-2 border-dashed border-blue-300 bg-blue-50">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Section Name *</label>
                  <Input
                    value={newSection.name}
                    onChange={(e) => setNewSection(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter section name..."
                    className="mt-1"
                    maxLength={100}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {newSection.name.length}/100 characters
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <Textarea
                    value={newSection.description}
                    onChange={(e) => setNewSection(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter section description..."
                    className="mt-1"
                    rows={3}
                    maxLength={500}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {newSection.description.length}/500 characters
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    onClick={addSection}
                    disabled={saving || !newSection.name.trim()}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Save size={16} />
                    {saving ? 'Adding...' : 'Add Section'}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowAddForm(false);
                      setNewSection({ name: '', description: '' });
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sections List */}
        {sections.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus size={24} className="text-gray-400" />
            </div>
            <p className="text-lg font-medium mb-2">No sections created yet</p>
            <p className="text-sm">Add your first project section to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sections.map((section, index) => (
              <div
                key={section.id}
                draggable={isOwner}
                onDragStart={() => handleDragStart(index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                className={`border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-all ${
                  draggedIndex === index ? 'opacity-50 scale-95' : ''
                } ${isOwner ? 'cursor-move' : ''}`}
              >
                <div className="flex items-start gap-4">
                  {isOwner && (
                    <div className="cursor-move mt-2">
                      <GripVertical size={16} className="text-gray-400" />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    {editingSection === section.id ? (
                      <EditSectionForm
                        section={section}
                        onSave={(updates) => updateSection(section.id, updates)}
                        onCancel={() => setEditingSection(null)}
                        saving={saving}
                      />
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {section.name}
                          </h3>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              Order: {section.orderIndex + 1}
                            </Badge>
                            {isOwner && (
                              <>
                                <Button
                                  onClick={() => setEditingSection(section.id)}
                                  variant="outline"
                                  size="sm"
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  <Edit3 size={14} />
                                </Button>
                                <Button
                                  onClick={() => deleteSection(section.id)}
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                        
                        {section.description && (
                          <p className="text-gray-600 text-sm leading-relaxed">
                            {section.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                          <span>Created: {new Date(section.createdAt).toLocaleDateString()}</span>
                          <span>Updated: {new Date(section.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface EditSectionFormProps {
  section: ProjectSection;
  onSave: (updates: Partial<ProjectSection>) => void;
  onCancel: () => void;
  saving: boolean;
}

const EditSectionForm: React.FC<EditSectionFormProps> = ({
  section,
  onSave,
  onCancel,
  saving
}) => {
  const [name, setName] = useState(section.name);
  const [description, setDescription] = useState(section.description);

  const handleSave = () => {
    onSave({ name: name.trim(), description: description.trim() });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-700">Section Name *</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1"
          maxLength={100}
        />
        <div className="text-xs text-gray-500 mt-1">
          {name.length}/100 characters
        </div>
      </div>
      
      <div>
        <label className="text-sm font-medium text-gray-700">Description</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1"
          rows={3}
          maxLength={500}
        />
        <div className="text-xs text-gray-500 mt-1">
          {description.length}/500 characters
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          size="sm"
          className="flex items-center gap-2"
        >
          <Check size={16} />
          {saving ? 'Saving...' : 'Save'}
        </Button>
        <Button
          onClick={onCancel}
          variant="outline"
          size="sm"
          disabled={saving}
        >
          <X size={16} />
          Cancel
        </Button>
      </div>
    </div>
  );
};