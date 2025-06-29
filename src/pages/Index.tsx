import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePortfolioData } from '../hooks/usePortfolioData';
import { LoginPage } from '@/components/LoginPage';
import { EditModeToggle } from '@/components/EditModeToggle';
import { Header } from '../components/Header';
import { ProjectSection } from '../components/ProjectSection';
import { ScrollToTop } from '../components/ScrollToTop';
import { AboutSection } from '../components/AboutSection';
import { EducationSection } from '../components/EducationSection';
import { ContactSection } from '../components/ContactSection';
import { EditableField } from '../components/EditableField';
import { SmoothScrollButton } from '../components/SmoothScrollButton';
import { ProjectsService, PortfolioDataService } from '../services/portfolioDataService';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

export interface ImageData {
  id: string;
  file?: File; // Made optional for database-loaded images
  url: string;
  name: string;
  description: string;
  category: string;
}

export interface ProjectData {
  id: string;
  title: string;
  description: string;
  client: string;
  date: string;
  category: 'Residential' | 'Commercial' | 'Hospitality' | 'Office' | 'Retail';
  images: {
    elevation: ImageData[];
    floorPlans: ImageData[];
    topView: ImageData[];
    twoD: ImageData[];
    threeD: ImageData[];
  };
}

const Index = () => {
  const { isOwner, isGuest, user, loading: authLoading } = useAuth();
  const { userProfile, projects, loading: dataLoading, getPortfolioValue, updatePortfolioData, setProjects } = usePortfolioData();
  const [isEditMode, setIsEditMode] = useState(false);
  const [heroData, setHeroData] = useState({
    ownerName: '',
    professionalTitle: '',
    heroDescription: ''
  });

  const loading = authLoading || dataLoading;

  // Load hero data from portfolio data
  useEffect(() => {
    if (!loading) {
      setHeroData({
        ownerName: getPortfolioValue('text', 'owner_name', userProfile?.name || 'Vaishnavi Upadhyay'),
        professionalTitle: getPortfolioValue('text', 'professional_title', userProfile?.title || 'Interior Designer'),
        heroDescription: getPortfolioValue('text', 'hero_description', 'Creating beautiful, functional spaces that reflect your unique style and personality. Transforming visions into stunning realities through thoughtful design and meticulous attention to detail.')
      });
    }
  }, [loading, userProfile, getPortfolioValue]);

  const updateProject = (projectId: string, updatedProject: Partial<ProjectData>) => {
    setProjects(prevProjects => 
      prevProjects.map(project => 
        project.id === projectId 
          ? { ...project, ...updatedProject }
          : project
      )
    );
  };

  const addNewProject = async () => {
    if (!isOwner || !user) return;
    
    try {
      const newProjectData = await ProjectsService.createProject({
        title: 'New Project',
        description: 'Enter project description...',
        client: 'Client Name',
        date: new Date().getFullYear().toString(),
        category: 'Residential'
      }, user.id);
      
      const newProject: ProjectData = {
        id: newProjectData.id,
        title: newProjectData.title,
        description: newProjectData.description || '',
        client: newProjectData.client || '',
        date: newProjectData.date || '',
        category: newProjectData.category || 'Residential',
        images: {
          elevation: [],
          floorPlans: [],
          topView: [],
          twoD: [],
          threeD: []
        }
      };
      
      setProjects(prevProjects => [newProject, ...prevProjects]);
      toast.success('New project created successfully!');
    } catch (error) {
      console.error('Failed to create project:', error);
      toast.error('Failed to create new project. Please try again.');
    }
  };

  const removeProject = (projectId: string) => {
    setProjects(prevProjects => 
      prevProjects.filter(project => project.id !== projectId)
    );
  };

  const handleHeroDataUpdate = async (field: keyof typeof heroData, value: string) => {
    try {
      await PortfolioDataService.saveElement('text', field, value);
      setHeroData(prev => ({ ...prev, [field]: value }));
      updatePortfolioData('text', field, value);
      toast.success('Hero section updated successfully!');
    } catch (error) {
      console.error('Failed to update hero data:', error);
      toast.error('Failed to update hero section. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-warm-beige via-cream-white to-soft-gray flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-brown border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-primary-brown font-poppins">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  // Show login page if user is not authenticated and not accessing as guest
  if (!isOwner && !isGuest) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-beige via-cream-white to-soft-gray relative">
      {/* Beautiful background pattern */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none z-0">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 20%, #8B4513 1px, transparent 1px),
              radial-gradient(circle at 80% 80%, #DAA520 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      <Header />
      <EditModeToggle 
        isEditMode={isEditMode} 
        onToggleEdit={() => setIsEditMode(!isEditMode)} 
      />
      
      {/* Hero Section with Enhanced Design */}
      <section id="home" className="relative py-32 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-warm-beige/50 via-cream-white/30 to-transparent"></div>
        <div className="relative max-w-6xl mx-auto">
          <div className="animate-fade-in">
            <h1 className="text-7xl md:text-8xl font-playfair font-bold text-primary-brown mb-6 animate-slide-up">
              <EditableField
                value={heroData.ownerName}
                onSave={(value) => handleHeroDataUpdate('ownerName', value)}
                className="inline-block"
                isEditMode={isEditMode && isOwner}
                placeholder="Your Name"
                elementId="owner_name"
                elementType="text"
              />
            </h1>
            <p className="text-2xl md:text-3xl text-secondary-brown mb-4 font-poppins animate-fade-in-delay-1">
              <EditableField
                value={heroData.professionalTitle}
                onSave={(value) => handleHeroDataUpdate('professionalTitle', value)}
                className="inline-block"
                isEditMode={isEditMode && isOwner}
                placeholder="Professional Title"
                elementId="professional_title"
                elementType="text"
              />
            </p>
            <p className="text-xl text-text-dark mb-12 max-w-3xl mx-auto leading-relaxed font-inter animate-fade-in-delay-2">
              <EditableField
                value={heroData.heroDescription}
                onSave={(value) => handleHeroDataUpdate('heroDescription', value)}
                className="block"
                isEditMode={isEditMode && isOwner}
                multiline
                placeholder="Hero Description"
                elementId="hero_description"
                elementType="text"
              />
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6 animate-fade-in-delay-3">
              <SmoothScrollButton
                targetId="projects"
                className="px-8 py-4 bg-gradient-to-r from-primary-brown to-secondary-brown text-white rounded-full font-poppins font-semibold text-lg hover:shadow-xl transition-all duration-300"
              >
                View Portfolio
              </SmoothScrollButton>
              <SmoothScrollButton
                targetId="contact"
                className="px-8 py-4 border-2 border-primary-brown text-primary-brown rounded-full font-poppins font-semibold hover:bg-primary-brown hover:text-white transition-all duration-300 text-lg"
              >
                Get In Touch
              </SmoothScrollButton>
            </div>
          </div>
        </div>
        
        {/* Floating elements with improved animations */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-accent-gold/20 rounded-full animate-floating-slow"></div>
        <div className="absolute bottom-20 right-10 w-16 h-16 bg-secondary-brown/20 rounded-full animate-floating-fast"></div>
        <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-primary-brown/10 rounded-full animate-floating-medium"></div>
      </section>

      {/* Enhanced About Section */}
      <AboutSection isEditMode={isEditMode && isOwner} />

      {/* Enhanced Education Section */}
      <EducationSection isEditMode={isEditMode && isOwner} />

      {/* Enhanced Projects Section with Interior Design Background */}
      <section id="projects" className="py-20 px-4 relative">
        {/* Interior Design Background */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div 
            className="w-full h-full bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23DAA520' fill-opacity='0.1'%3E%3Cpath d='M30 0c16.569 0 30 13.431 30 30s-13.431 30-30 30S0 46.569 0 30 13.431 0 30 0z'/%3E%3Cpath d='M30 15c8.284 0 15 6.716 15 15s-6.716 15-15 15-15-6.716-15-15 6.716-15 15-15z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}
          />
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-5xl md:text-6xl font-playfair font-bold text-primary-brown mb-6">
              Portfolio
            </h2>
            <p className="text-xl text-text-light max-w-3xl mx-auto font-inter mb-8">
              <EditableField
                value={getPortfolioValue('text', 'projects_description', 'Explore our comprehensive portfolio of residential, commercial, and hospitality projects. Each project represents our commitment to innovative design and exceptional craftsmanship.')}
                onSave={(value) => updatePortfolioData('text', 'projects_description', value)}
                className="inline-block"
                isEditMode={isEditMode && isOwner}
                placeholder="Projects Description"
                elementId="projects_description"
                elementType="text"
              />
            </p>
            
            {/* Project Category Filter */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {['ALL', 'RESIDENTIAL', 'COMMERCIAL', 'BOUTIQUE', 'HOSPITALITY'].map((category) => (
                <button
                  key={category}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    category === 'ALL' 
                      ? 'bg-primary-brown text-white shadow-lg' 
                      : 'bg-white text-primary-brown border border-primary-brown hover:bg-primary-brown hover:text-white'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Add New Project Button (Owner Mode Only) */}
            {isEditMode && isOwner && (
              <div className="mb-8">
                <button
                  onClick={addNewProject}
                  className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium mx-auto"
                >
                  <Plus size={20} />
                  <span>Add New Project</span>
                </button>
              </div>
            )}
          </div>
          
          <div className="space-y-8">
            {projects.map((project, index) => (
              <div 
                key={project.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <ProjectSection
                  project={project}
                  onUpdateProject={updateProject}
                  onRemoveProject={removeProject}
                  isExpanded={index === 0}
                  isEditMode={isEditMode && isOwner}
                />
              </div>
            ))}
          </div>
          
          {/* Load More Projects Button */}
          {!isEditMode && (
            <div className="text-center mt-16">
              <button className="px-8 py-3 border-2 border-primary-brown text-primary-brown rounded-full font-poppins font-medium hover:bg-primary-brown hover:text-white transition-all duration-300">
                LOAD MORE PROJECTS
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Enhanced Contact Section */}
      <ContactSection isEditMode={isEditMode && isOwner} />

      <ScrollToTop />
    </div>
  );
};

export default Index;