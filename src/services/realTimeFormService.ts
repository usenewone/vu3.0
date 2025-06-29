import { supabase } from "@/integrations/supabase/client";
import { EnhancedPortfolioDataService } from "./enhancedPortfolioDataService";

export interface FormSubmission {
  id: string;
  formId: string;
  submittedData: Record<string, any>;
  submittedAt: string;
  submittedBy?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface FormAnalytics {
  formId: string;
  totalSubmissions: number;
  averageCompletionTime: number;
  fieldCompletionRates: Record<string, number>;
  submissionsByDate: Record<string, number>;
}

export class RealTimeFormService {
  private static changeListeners: Map<string, ((data: any) => void)[]> = new Map();

  // Subscribe to real-time form changes
  static subscribeToForm(formId: string, callback: (data: any) => void) {
    if (!this.changeListeners.has(formId)) {
      this.changeListeners.set(formId, []);
    }
    
    this.changeListeners.get(formId)!.push(callback);

    // Set up Supabase real-time subscription
    const subscription = supabase
      .channel(`form_${formId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'portfolio_data_v2',
          filter: `element_id=like.${formId}%`
        },
        (payload) => {
          this.notifyListeners(formId, payload);
        }
      )
      .subscribe();

    // Return unsubscribe function
    return () => {
      const listeners = this.changeListeners.get(formId);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
        
        if (listeners.length === 0) {
          this.changeListeners.delete(formId);
          subscription.unsubscribe();
        }
      }
    };
  }

  private static notifyListeners(formId: string, data: any) {
    const listeners = this.changeListeners.get(formId);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in form change listener:', error);
        }
      });
    }
  }

  // Submit form data
  static async submitForm(formId: string, data: Record<string, any>): Promise<FormSubmission> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const submission: FormSubmission = {
        id: `submission_${Date.now()}`,
        formId,
        submittedData: data,
        submittedAt: new Date().toISOString(),
        submittedBy: session?.user?.id,
        ipAddress: await this.getClientIP(),
        userAgent: navigator.userAgent
      };

      await EnhancedPortfolioDataService.saveElement(
        'form_submission',
        submission.id,
        submission
      );

      return submission;
    } catch (error) {
      console.error('Failed to submit form:', error);
      throw error;
    }
  }

  // Get form submissions
  static async getFormSubmissions(formId: string): Promise<FormSubmission[]> {
    try {
      const dataMap = await EnhancedPortfolioDataService.loadAllData();
      const submissions: FormSubmission[] = [];
      
      dataMap.forEach((value, key) => {
        if (key.startsWith('form_submission_') && value.formId === formId) {
          submissions.push(value);
        }
      });
      
      return submissions.sort((a, b) => 
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );
    } catch (error) {
      console.error('Failed to get form submissions:', error);
      return [];
    }
  }

  // Generate form analytics
  static async getFormAnalytics(formId: string): Promise<FormAnalytics> {
    try {
      const submissions = await this.getFormSubmissions(formId);
      
      const analytics: FormAnalytics = {
        formId,
        totalSubmissions: submissions.length,
        averageCompletionTime: 0,
        fieldCompletionRates: {},
        submissionsByDate: {}
      };

      if (submissions.length === 0) {
        return analytics;
      }

      // Calculate field completion rates
      const fieldCounts: Record<string, number> = {};
      const totalFields = new Set<string>();

      submissions.forEach(submission => {
        Object.keys(submission.submittedData).forEach(field => {
          totalFields.add(field);
          if (submission.submittedData[field] && 
              submission.submittedData[field].toString().trim() !== '') {
            fieldCounts[field] = (fieldCounts[field] || 0) + 1;
          }
        });
      });

      totalFields.forEach(field => {
        analytics.fieldCompletionRates[field] = 
          ((fieldCounts[field] || 0) / submissions.length) * 100;
      });

      // Calculate submissions by date
      submissions.forEach(submission => {
        const date = new Date(submission.submittedAt).toISOString().split('T')[0];
        analytics.submissionsByDate[date] = 
          (analytics.submissionsByDate[date] || 0) + 1;
      });

      return analytics;
    } catch (error) {
      console.error('Failed to generate form analytics:', error);
      throw error;
    }
  }

  // Create shareable form link
  static async createShareLink(
    formId: string, 
    options: {
      expiresIn?: number; // days
      permissions?: string[];
      password?: string;
    } = {}
  ): Promise<string> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User must be authenticated');
      }

      const shareId = `share_${formId}_${Date.now()}`;
      const expiresAt = options.expiresIn 
        ? new Date(Date.now() + options.expiresIn * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days default

      const shareData = {
        formId,
        shareId,
        createdBy: session.user.id,
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
        permissions: options.permissions || ['read'],
        password: options.password,
        isActive: true
      };

      await EnhancedPortfolioDataService.saveElement('share', shareId, shareData);
      
      return `${window.location.origin}/forms?share=${shareId}`;
    } catch (error) {
      console.error('Failed to create share link:', error);
      throw error;
    }
  }

  // Validate share link
  static async validateShareLink(shareId: string): Promise<any> {
    try {
      const shareData = await EnhancedPortfolioDataService.getElement('share', shareId);
      
      if (!shareData) {
        throw new Error('Share link not found');
      }

      if (!shareData.isActive) {
        throw new Error('Share link is inactive');
      }

      if (new Date(shareData.expiresAt) < new Date()) {
        throw new Error('Share link has expired');
      }

      return shareData;
    } catch (error) {
      console.error('Failed to validate share link:', error);
      throw error;
    }
  }

  // Get client IP address
  private static async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return 'unknown';
    }
  }

  // Export form data
  static async exportFormData(formId: string, format: 'json' | 'csv' = 'json'): Promise<string> {
    try {
      const submissions = await this.getFormSubmissions(formId);
      
      if (format === 'csv') {
        return this.convertToCSV(submissions);
      }
      
      return JSON.stringify(submissions, null, 2);
    } catch (error) {
      console.error('Failed to export form data:', error);
      throw error;
    }
  }

  private static convertToCSV(submissions: FormSubmission[]): string {
    if (submissions.length === 0) return '';

    // Get all unique field names
    const allFields = new Set<string>();
    submissions.forEach(submission => {
      Object.keys(submission.submittedData).forEach(field => allFields.add(field));
    });

    const headers = ['Submission ID', 'Submitted At', 'Submitted By', ...Array.from(allFields)];
    const rows = submissions.map(submission => [
      submission.id,
      submission.submittedAt,
      submission.submittedBy || 'Anonymous',
      ...Array.from(allFields).map(field => 
        submission.submittedData[field] || ''
      )
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }
}