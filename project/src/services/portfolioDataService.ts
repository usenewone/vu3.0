import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import type { ImageData, ProjectData } from "@/pages/Index";

// Helper function to safely parse image arrays from database
function safeParseImageArray(jsonData: any): ImageData[] {
  if (!jsonData || !Array.isArray(jsonData)) {
    return [];
  }
  
  return jsonData.filter(item => 
    item && 
    typeof item === 'object' && 
    typeof item.id === 'string' &&
    typeof item.url === 'string'
  ).map(item => ({
    id: item.id,
    url: item.url,
    name: item.name || '',
    description: item.description || '',
    category: item.category || ''
  }));
}

// Complete data persistence service for all editable content
export class PortfolioDataService {
  // Save any editable element to database
  static async saveElement(elementType: string, elementId: string, value: string | object) {
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User must be authenticated to save data');
      }

      const { data, error } = await supabase
        .from('portfolio_data')
        .upsert({
          element_type: elementType,
          element_id: elementId,
          element_value: typeof value === 'string' ? value : null,
          json_data: typeof value === 'object' ? value as Json : null,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'element_type,element_id'
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to save element:', error);
      throw error;
    }
  }

  // Delete an element from database
  static async deleteElement(elementType: string, elementId: string) {
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User must be authenticated to delete data');
      }

      const { error } = await supabase
        .from('portfolio_data')
        .delete()
        .eq('element_type', elementType)
        .eq('element_id', elementId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to delete element:', error);
      throw error;
    }
  }

  // Load all portfolio data
  static async loadAllData() {
    try {
      const { data, error } = await supabase
        .from('portfolio_data')
        .select('*');

      if (error) throw error;
      
      const dataMap = new Map();
      data?.forEach(item => {
        const value = item.json_data || item.element_value;
        dataMap.set(`${item.element_type}_${item.element_id}`, value);
      });

      return dataMap;
    } catch (error) {
      console.error('Failed to load portfolio data:', error);
      return new Map();
    }
  }

  // Upload image to storage and save URL
  static async uploadImage(file: File, elementId: string) {
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User must be authenticated to upload images');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${elementId}/${Date.now()}-${Math.random()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('portfolio-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('portfolio-images')
        .getPublicUrl(uploadData.path);

      // Save URL to database
      await this.saveElement('image', elementId, publicUrl);
      
      return publicUrl;
    } catch (error) {
      console.error('Failed to upload image:', error);
      throw error;
    }
  }
}

// User profile service
export class UserProfileService {
  static async loadProfile() {
    try {
      const { data, error } = await supabase
        .from('user_profile')
        .select('*')
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to load user profile:', error);
      return null;
    }
  }

  static async updateProfile(updates: any) {
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User must be authenticated to update profile');
      }

      // First check if profile exists
      const { data: existingProfile } = await supabase
        .from('user_profile')
        .select('id')
        .maybeSingle();

      if (existingProfile) {
        // Update existing profile
        const { data, error } = await supabase
          .from('user_profile')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', existingProfile.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new profile
        const { data, error } = await supabase
          .from('user_profile')
          .insert({ ...updates, updated_at: new Date().toISOString() })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  }

  static async saveProfileField(fieldName: string, value: string) {
    try {
      const updates = { [fieldName]: value };
      return await this.updateProfile(updates);
    } catch (error) {
      console.error('Failed to save profile field:', error);
      throw error;
    }
  }
}

// Projects service with complete persistence
export class ProjectsService {
  static async loadAllProjects() {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      
      // Transform database data to match ProjectData interface
      return (data || []).map(project => ({
        id: project.id,
        title: project.title || 'Untitled Project',
        description: project.description || '',
        client: project.client || '',
        date: project.date || '2024',
        category: project.category || 'Residential',
        images: {
          elevation: safeParseImageArray(project.elevation_images),
          floorPlans: safeParseImageArray(project.floor_plan_images),
          topView: safeParseImageArray(project.top_view_images),
          twoD: safeParseImageArray(project.design_2d_images),
          threeD: safeParseImageArray(project.render_3d_images)
        }
      }));
    } catch (error) {
      console.error('Failed to load projects:', error);
      return [];
    }
  }

  static async saveProject(project: ProjectData) {
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User must be authenticated to save projects');
      }

      const projectData = {
        id: project.id,
        title: project.title,
        description: project.description,
        client: project.client,
        date: project.date,
        category: project.category,
        elevation_images: project.images.elevation,
        floor_plan_images: project.images.floorPlans,
        top_view_images: project.images.topView,
        design_2d_images: project.images.twoD,
        render_3d_images: project.images.threeD,
        user_id: session.user.id,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('projects')
        .upsert(projectData, {
          onConflict: 'id'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to save project:', error);
      throw error;
    }
  }

  static async updateProjectField(projectId: string, fieldName: string, value: any) {
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User must be authenticated to update projects');
      }

      const updates = { 
        [fieldName]: value,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId)
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to update project field:', error);
      throw error;
    }
  }

  static async deleteProject(projectId: string) {
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User must be authenticated to delete projects');
      }

      const { error } = await supabase
        .from('projects')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to delete project:', error);
      throw error;
    }
  }

  static async createProject(project: Partial<ProjectData>) {
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User must be authenticated to create projects');
      }

      const newProject = {
        title: project.title || 'New Project',
        description: project.description || '',
        client: project.client || '',
        date: project.date || new Date().getFullYear().toString(),
        category: project.category || 'Residential',
        elevation_images: [],
        floor_plan_images: [],
        top_view_images: [],
        design_2d_images: [],
        render_3d_images: [],
        order_index: 0,
        is_active: true,
        user_id: session.user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('projects')
        .insert(newProject)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to create project:', error);
      throw error;
    }
  }
}

// Contact inquiries service
export class ContactService {
  static async submitInquiry(inquiry: {
    name: string;
    email: string;
    phone?: string;
    subject?: string;
    message: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('contact_inquiries')
        .insert({
          ...inquiry,
          status: 'new',
          priority: 'normal',
          source: 'website',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to submit inquiry:', error);
      throw error;
    }
  }

  static async getInquiries() {
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User must be authenticated to view inquiries');
      }

      const { data, error } = await supabase
        .from('contact_inquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to load inquiries:', error);
      return [];
    }
  }

  static async updateInquiryStatus(inquiryId: string, status: string) {
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User must be authenticated to update inquiries');
      }

      const { data, error } = await supabase
        .from('contact_inquiries')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', inquiryId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to update inquiry status:', error);
      throw error;
    }
  }
}