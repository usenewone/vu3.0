import React, { useState } from 'react';
import { EditableField } from './EditableField';
import { UserProfileService } from '../services/portfolioDataService';
import { toast } from 'sonner';

interface AboutSectionProps {
  isEditMode: boolean;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ isEditMode }) => {
  const [profileImage, setProfileImage] = useState('/placeholder.svg');
  const [aboutData, setAboutData] = useState({
    name: 'Vaishnavi Upadhyay',
    title: 'Interior Designer & Space Planner',
    bio: 'With over 8 years of experience in transforming spaces, I specialize in creating harmonious environments that blend functionality with aesthetic appeal. My passion lies in understanding each client\'s unique vision and bringing it to life through thoughtful design and meticulous attention to detail.',
    experience: '3+ Years',
    projects: '15+ Projects',
    specialization: 'Residential & Commercial Design',
    philosophy: 'Every space tells a story. My role is to help you write yours beautifully.'
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isEditMode) return;
    
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateAboutData = async (field: keyof typeof aboutData, value: string) => {
    if (!isEditMode) return;
    
    try {
      // Save to database
      await UserProfileService.saveProfileField(field, value);
      
      // Update local state
      setAboutData(prev => ({
        ...prev,
        [field]: value
      }));
      
      toast.success(`${field} updated successfully!`);
    } catch (error) {
      console.error('Failed to update profile field:', error);
      toast.error(`Failed to update ${field}. Please try again.`);
    }
  };

  return (
    <section id="about" className="py-20 px-4 bg-gradient-to-br from-cream-white to-warm-beige/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="text-5xl md:text-6xl font-playfair font-bold text-primary-brown mb-6">
            About Me
          </h2>
          <p className="text-xl text-text-light max-w-3xl mx-auto font-inter">
            Passionate about creating spaces that inspire and transform lives
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Profile Photo */}
          <div className="relative animate-fade-in-left">
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary-brown to-accent-gold rounded-full blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
              <div className="relative">
                <img 
                  src={profileImage}
                  alt="Vaishnavi Upadhyay"
                  className="w-80 h-80 mx-auto rounded-full object-cover shadow-2xl border-8 border-white"
                />
                {isEditMode && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                    <label htmlFor="profile-upload" className="text-white font-poppins cursor-pointer">
                      Click to change photo
                      <input
                        id="profile-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-8 animate-fade-in-right">
            <div>
              <EditableField
                value={aboutData.name}
                onSave={(value) => updateAboutData('name', value)}
                className="text-4xl font-playfair font-bold text-primary-brown mb-2"
                isEditMode={isEditMode}
                placeholder="Name"
                elementId="profile_name"
                elementType="profile"
              />
              <EditableField
                value={aboutData.title}
                onSave={(value) => updateAboutData('title', value)}
                className="text-xl text-secondary-brown font-poppins mb-6"
                isEditMode={isEditMode}
                placeholder="Professional Title"
                elementId="profile_title"
                elementType="profile"
              />
            </div>

            <EditableField
              value={aboutData.bio}
              onSave={(value) => updateAboutData('bio', value)}
              className="text-lg text-text-dark leading-relaxed font-inter"
              isEditMode={isEditMode}
              multiline
              placeholder="Professional Bio"
              elementId="profile_bio"
              elementType="profile"
            />

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8">
              <div className="text-center bg-white/60 rounded-2xl p-6 hover-lift">
                <EditableField
                  value={aboutData.experience}
                  onSave={(value) => updateAboutData('experience', value)}
                  className="text-3xl font-bold text-primary-brown font-poppins"
                  isEditMode={isEditMode}
                  placeholder="Experience"
                  elementId="profile_experience"
                  elementType="profile"
                />
                <p className="text-text-light font-inter mt-2">Experience</p>
              </div>
              <div className="text-center bg-white/60 rounded-2xl p-6 hover-lift">
                <EditableField
                  value={aboutData.projects}
                  onSave={(value) => updateAboutData('projects', value)}
                  className="text-3xl font-bold text-primary-brown font-poppins"
                  isEditMode={isEditMode}
                  placeholder="Projects Count"
                  elementId="profile_projects"
                  elementType="profile"
                />
                <p className="text-text-light font-inter mt-2">Completed</p>
              </div>
              <div className="text-center bg-white/60 rounded-2xl p-6 hover-lift">
                <EditableField
                  value={aboutData.specialization}
                  onSave={(value) => updateAboutData('specialization', value)}
                  className="text-lg font-bold text-primary-brown font-poppins text-center"
                  isEditMode={isEditMode}
                  placeholder="Specialization"
                  elementId="profile_specialization"
                  elementType="profile"
                />
                <p className="text-text-light font-inter mt-2">Specialization</p>
              </div>
            </div>

            {/* Philosophy */}
            <div className="bg-gradient-to-r from-accent-gold/20 to-primary-brown/20 rounded-2xl p-8 hover-lift">
              <h3 className="text-2xl font-playfair font-bold text-primary-brown mb-4">
                Design Philosophy
              </h3>
              <EditableField
                value={aboutData.philosophy}
                onSave={(value) => updateAboutData('philosophy', value)}
                className="text-lg text-text-dark font-inter italic"
                isEditMode={isEditMode}
                multiline
                placeholder="Design Philosophy"
                elementId="profile_philosophy"
                elementType="profile"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};