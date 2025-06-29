import { supabase } from "@/integrations/supabase/client";

export interface EducationEntry {
  id: string;
  period: string;
  degree: string;
  institution: string;
  description: string;
  order_index: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export class EducationService {
  static async loadAllEducation(): Promise<EducationEntry[]> {
    try {
      const { data, error } = await supabase
        .from('education_entries')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to load education entries:', error);
      return [];
    }
  }

  static async updateEducationEntry(id: string, updates: Partial<EducationEntry>): Promise<EducationEntry | null> {
    try {
      const { data, error } = await supabase
        .from('education_entries')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to update education entry:', error);
      throw error;
    }
  }

  static async createEducationEntry(entry: Omit<EducationEntry, 'id' | 'created_at' | 'updated_at'>): Promise<EducationEntry | null> {
    try {
      const { data, error } = await supabase
        .from('education_entries')
        .insert({
          ...entry,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to create education entry:', error);
      throw error;
    }
  }

  static async deleteEducationEntry(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('education_entries')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to delete education entry:', error);
      throw error;
    }
  }
}