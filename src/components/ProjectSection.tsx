import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Eye, Plus, Trash2, Save, Loader2 } from 'lucide-react';
import { ProjectData } from '../pages/Index';
import { ImageGallery } from './ImageGallery';
import { EditableField } from './EditableField';
import { ProjectSectionManager } from './enhanced/ProjectSectionManager';
import { ShareLinkManager } from './enhanced/ShareLinkManager';
import { FieldValidationTester } from './enhanced/FieldValidationTester';
import { ProjectsService } from '../services/portfolioDataService';
import { toast } from 'sonner';

interface ProjectSectionProps {
  project: ProjectData;
  onUpdateProject: (projectId: string, updatedProject: Partial<ProjectData>) => void;
  onRemoveProject?: (projectId: string) => void;
  isExpanded?: boolean;
  isEditMode?: boolean;
}

export const ProjectSection: React.FC<ProjectSectionProps> = ({
  project,
  onUpdateProject,
  onRemoveProject,
  isExpanded = false,
  isEditMode = false
}) => {
  const [expanded, setExpanded] = useState(isExpanded);
  const [activeTab, setActiveTab] = useState<keyof ProjectData['images']>('elevation');
  const [isSaving, setIsSaving] = useState(false);
  const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(false);

  const tabs = [
    { key: 'elevation', label: 'Elevation Designs', icon: '🏠', color: 'from-amber-500 to-orange-500' },
    { key: 'floorPlans', label: 'Floor Plans', icon: '📐', color: 'from-blue-500 to-indigo-500' },
    { key: 'topView', label: 'Top View/Ceiling', icon: '⬆️', color: 'from-green-500 to-teal-500' },
    { key: 'twoD', label: '2D Designs', icon: '📊', color: 'from-purple-500 to-pink-500' },
    { key: 'threeD', label: '3D Designs', icon: '🎨', color: 'from-red-500 to-rose-500' }
  ] as const;

  const handleFieldUpdate = async (field: keyof ProjectData, value: string) => {
    if (!isEditMode) return;
    
    try {
      setIsSaving(true);
      
      // Save to database with validation
      await ProjectsService.updateProjectField(project.id, field, value);
      
      // Update local state
      onUpdateProject(project.id, { [field]: value });
      
      toast.success(`${field} updated successfully!`);
    } catch (error) {
      console.error('Failed to update project field:', error);
      toast.error(`Failed to update ${field}. Please try again.`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProject = async () => {
    if (!isEditMode) return;
    
    setIsSaving(true);
    try {
      await ProjectsService.saveProject(project);
      toast.success('Project saved successfully!');
    } catch (error) {
      console.error('Failed to save project:', error);
      toast.error('Failed to save project. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveProject = async () => {
    if (!onRemoveProject || !isEditMode) return;
    
    if (window.confirm('Are you sure you want to delete this entire project? This action cannot be undone.')) {
      try {
        setIsSaving(true);
        await ProjectsService.deleteProject(project.id);
        onRemoveProject(project.id);
        toast.success('Project deleted successfully!');
      } catch (error) {
        console.error('Failed to delete project:', error);
        toast.error('Failed to delete project. Please try again.');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleImageUpdate = async (category: keyof ProjectData['images'], images: any[]) => {
    if (!isEditMode) return;
    
    try {
      const fieldName = {
        elevation: 'elevation_images',
        floorPlans: 'floor_plan_images',
        topView: 'top_view_images',
        twoD: 'design_2d_images',
        threeD: 'render_3d_images'
      }[category];

      await ProjectsService.updateProjectField(project.id, fieldName, images);
      
      const updatedImages = { ...project.images, [category]: images };
      onUpdateProject(project.id, { images: updatedImages });
      
      toast.success('Images updated successfully!');
    } catch (error) {
      console.error('Failed to update images:', error);
      toast.error('Failed to update images. Please try again.');
    }
  };

  const getTotalImageCount = () => {
    if (!project.images || typeof project.images !== 'object') {
      return 0;
    }
    return Object.values(project.images).reduce((total, images) => {
      return total + (Array.isArray(images) ? images.length : 0);
    }, 0);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Residential': 'bg-amber-100 text-amber-800 border-amber-300',
      'Commercial': 'bg-blue-100 text-blue-800 border-blue-300',
      'Hospitality': 'bg-purple-100 text-purple-800 border-purple-300',
      'Office': 'bg-orange-100 text-orange-800 border-orange-300',
      'Retail': 'bg-pink-100 text-pink-800 border-pink-300'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
      {/* Project Header */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-gray-200">
        <div className="p-6">
          {/* Project Title Row */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex-1">
              <EditableField
                value={project.title}
                onSave={(value) => handleFieldUpdate('title', value)}
                className="text-xl font-semibold text-amber-900"
                isEditMode={isEditMode}
                placeholder="Project - Client Name"
                label=""
                fieldType="title"
                elementId={`project_title_${project.id}`}
                elementType="project_field"
              />
            </div>
            <div className="flex items-center space-x-3 ml-6">
              {isEditMode && (
                <>
                  <Button
                    onClick={handleSaveProject}
                    disabled={isSaving}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 transition-colors font-medium text-sm"
                  >
                    {isSaving ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Save size={16} />
                    )}
                    <span>{isSaving ? 'Saving...' : 'Save All'}</span>
                  </Button>
                  <Button
                    onClick={handleRemoveProject}
                    disabled={isSaving}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 transition-colors font-medium text-sm"
                  >
                    <Trash2 size={16} />
                    <span>Remove</span>
                  </Button>
                  <Button
                    onClick={() => setShowAdvancedFeatures(!showAdvancedFeatures)}
                    variant="outline"
                    className="flex items-center space-x-2 px-4 py-2 text-blue-600 border-blue-300 hover:bg-blue-50 rounded-lg transition-colors font-medium text-sm"
                  >
                    <Plus size={16} />
                    <span>Advanced</span>
                  </Button>
                </>
              )}
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center space-x-2 px-4 py-2 text-amber-800 hover:text-amber-900 hover:bg-amber-100 rounded-lg transition-all duration-300 font-medium"
              >
                <span>{expanded ? 'Collapse' : 'Expand'}</span>
                {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>
          </div>

          {/* Project Details Grid */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column - Description */}
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-amber-800 mb-2">Description</h4>
                <EditableField
                  value={project.description}
                  onSave={(value) => handleFieldUpdate('description', value)}
                  isEditMode={isEditMode}
                  multiline
                  placeholder="Enter project description..."
                  fieldType="description"
                  elementId={`project_description_${project.id}`}
                  elementType="project_field"
                />
              </div>
            </div>

            {/* Right Column - Client and Year */}
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-amber-800 mb-2">Client</h4>
                <EditableField
                  value={project.client}
                  onSave={(value) => handleFieldUpdate('client', value)}
                  isEditMode={isEditMode}
                  placeholder="Client name..."
                  elementId={`project_client_${project.id}`}
                  elementType="project_field"
                />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-amber-800 mb-2">Year</h4>
                <EditableField
                  value={project.date}
                  onSave={(value) => handleFieldUpdate('date', value)}
                  isEditMode={isEditMode}
                  placeholder="Year..."
                  elementId={`project_date_${project.id}`}
                  elementType="project_field"
                />
              </div>
            </div>
          </div>

          {/* Category and Image Count Row */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-amber-100">
            <div className="flex items-center space-x-4">
              <span className={`px-4 py-2 rounded-full text-sm font-semibold border-2 ${getCategoryColor(project.category)} shadow-sm`}>
                {project.category}
              </span>
              <div className="flex items-center space-x-2 text-amber-600">
                <Eye size={16} />
                <span className="text-sm font-medium">
                  {getTotalImageCount()} images total
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Features Panel */}
      {showAdvancedFeatures && isEditMode && (
        <div className="bg-blue-50 border-b border-blue-200 p-6">
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Advanced Project Features</h3>
            
            <div className="grid lg:grid-cols-2 gap-6">
              <ProjectSectionManager 
                projectId={project.id}
                onSectionsUpdate={(sections) => {
                  console.log('Project sections updated:', sections);
                }}
              />
              
              <div className="space-y-6">
                <ShareLinkManager 
                  projectId={project.id}
                  projectTitle={project.title}
                />
                
                <FieldValidationTester projectId={project.id} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expanded Content */}
      {expanded && (
        <div className="p-6 bg-white">
          {/* Image Category Tabs */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-3 border-b-2 border-gray-100 pb-4">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`group relative px-6 py-3 font-semibold text-sm rounded-xl transition-all duration-300 flex items-center space-x-3 ${
                    activeTab === tab.key
                      ? 'bg-amber-600 text-white shadow-lg transform scale-105'
                      : 'text-amber-700 hover:text-amber-900 hover:bg-amber-50 border-2 border-amber-200 hover:border-amber-300'
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.label}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    activeTab === tab.key 
                      ? 'bg-white/20 text-white' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {project.images && project.images[tab.key] ? project.images[tab.key].length : 0}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Image Gallery */}
          <div className="bg-gray-50 rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                <span className="text-xl">{tabs.find(t => t.key === activeTab)?.icon}</span>
                <span>{tabs.find(t => t.key === activeTab)?.label}</span>
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Manage your {tabs.find(t => t.key === activeTab)?.label.toLowerCase()} images
              </p>
            </div>
            
            {isEditMode ? (
              <ImageGallery
                projectId={project.id}
                category={activeTab}
                images={project.images && project.images[activeTab] ? project.images[activeTab] : []}
                onUpdateImages={(images) => handleImageUpdate(activeTab, images)}
              />
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Eye size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">
                  {project.images && project.images[activeTab] ? project.images[activeTab].length : 0} images in {tabs.find(t => t.key === activeTab)?.label}
                </p>
                <p className="text-sm opacity-75">Switch to edit mode to manage images</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};