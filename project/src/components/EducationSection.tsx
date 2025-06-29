import React, { useState, useEffect } from 'react';
import { EditableField } from './EditableField';
import { EducationService, type EducationEntry } from '../services/educationService';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

interface EducationSectionProps {
  isEditMode: boolean;
}

export const EducationSection: React.FC<EducationSectionProps> = ({ isEditMode }) => {
  const [education, setEducation] = useState<EducationEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEducation();
  }, []);

  const loadEducation = async () => {
    try {
      setLoading(true);
      const data = await EducationService.loadAllEducation();
      setEducation(data);
    } catch (error) {
      console.error('Failed to load education:', error);
      toast.error('Failed to load education data');
    } finally {
      setLoading(false);
    }
  };

  const handleEducationUpdate = async (id: string, field: keyof EducationEntry, value: string) => {
    if (!isEditMode) return;
    
    try {
      const updates = { [field]: value };
      await EducationService.updateEducationEntry(id, updates);
      
      setEducation(prev => prev.map(edu => 
        edu.id === id ? { ...edu, [field]: value } : edu
      ));
      
      toast.success('Education entry updated successfully!');
    } catch (error) {
      console.error('Failed to update education:', error);
      toast.error('Failed to save changes. Please try again.');
    }
  };

  const handleAddEducation = async () => {
    if (!isEditMode) return;
    
    try {
      const newEntry = await EducationService.createEducationEntry({
        period: 'New Period',
        degree: 'New Degree',
        institution: 'New Institution',
        description: 'Enter description...',
        order_index: education.length + 1,
        is_active: true
      });
      
      if (newEntry) {
        setEducation(prev => [...prev, newEntry]);
        toast.success('New education entry added!');
      }
    } catch (error) {
      console.error('Failed to add education:', error);
      toast.error('Failed to add education entry');
    }
  };

  const handleDeleteEducation = async (id: string) => {
    if (!isEditMode) return;
    
    if (window.confirm('Are you sure you want to delete this education entry?')) {
      try {
        await EducationService.deleteEducationEntry(id);
        setEducation(prev => prev.filter(edu => edu.id !== id));
        toast.success('Education entry deleted successfully!');
      } catch (error) {
        console.error('Failed to delete education:', error);
        toast.error('Failed to delete education entry');
      }
    }
  };

  if (loading) {
    return (
      <section id="education" className="py-20 px-4 bg-soft-gray/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary-brown border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-primary-brown">Loading education...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="education" className="py-20 px-4 bg-soft-gray/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="text-5xl md:text-6xl font-playfair font-bold text-primary-brown mb-6">
            Education
          </h2>
          <p className="text-xl text-text-light max-w-3xl mx-auto font-inter">
            Building expertise through continuous learning and professional development
          </p>
        </div>

        {isEditMode && (
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className="px-4 py-2 bg-primary-brown/10 text-primary-brown rounded-lg font-poppins">
                Edit Mode Active - Click any text to edit
              </div>
              <button
                onClick={handleAddEducation}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <Plus size={16} />
                <span>Add Education</span>
              </button>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-primary-brown to-secondary-brown rounded-full"></div>

          <div className="space-y-16">
            {education.map((edu, index) => (
              <div
                key={edu.id}
                className={`flex items-center ${
                  index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'
                } animate-fade-in-up`}
                style={{ animationDelay: `${index * 0.3}s` }}
              >
                {/* Content Card */}
                <div className={`w-5/12 ${index % 2 === 0 ? 'pr-8' : 'pl-8'}`}>
                  <div className="bg-card-gradient rounded-2xl p-8 shadow-lg hover-lift relative">
                    {isEditMode && (
                      <button
                        onClick={() => handleDeleteEducation(edu.id)}
                        className="absolute top-4 right-4 p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-full transition-colors"
                        title="Delete education entry"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    
                    {/* Period */}
                    <EditableField
                      value={edu.period}
                      onSave={(value) => handleEducationUpdate(edu.id, 'period', value)}
                      className="text-sm font-poppins font-semibold text-accent-gold mb-2"
                      isEditMode={isEditMode}
                      placeholder="Period"
                      elementId={`education_period_${edu.id}`}
                      elementType="education"
                    />
                    
                    {/* Degree */}
                    <EditableField
                      value={edu.degree}
                      onSave={(value) => handleEducationUpdate(edu.id, 'degree', value)}
                      className="text-xl font-poppins font-bold text-primary-brown mb-2"
                      isEditMode={isEditMode}
                      placeholder="Degree"
                      elementId={`education_degree_${edu.id}`}
                      elementType="education"
                    />
                    
                    {/* Institution */}
                    <EditableField
                      value={edu.institution}
                      onSave={(value) => handleEducationUpdate(edu.id, 'institution', value)}
                      className="text-lg font-poppins text-secondary-brown mb-4"
                      isEditMode={isEditMode}
                      placeholder="Institution"
                      elementId={`education_institution_${edu.id}`}
                      elementType="education"
                    />
                    
                    {/* Description */}
                    <EditableField
                      value={edu.description}
                      onSave={(value) => handleEducationUpdate(edu.id, 'description', value)}
                      className="text-text-dark font-inter leading-relaxed"
                      isEditMode={isEditMode}
                      multiline
                      placeholder="Description"
                      elementId={`education_description_${edu.id}`}
                      elementType="education"
                    />
                  </div>
                </div>

                {/* Timeline Node */}
                <div className="relative z-10 flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-brown to-secondary-brown rounded-full shadow-lg">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 bg-accent-gold rounded-full animate-pulse-soft"></div>
                  </div>
                </div>

                {/* Spacer */}
                <div className="w-5/12"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Floating Decorative Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-accent-gold/10 rounded-full animate-floating-slow"></div>
        <div className="absolute bottom-10 right-10 w-16 h-16 bg-primary-brown/10 rounded-full animate-floating-medium"></div>
      </div>
    </section>
  );
};