import { supabase } from "@/integrations/supabase/client";
import { DataValidator, ValidationResult } from "./dataValidation";
import { toast } from "sonner";

export interface SaveOptions {
  autoSave?: boolean;
  validateData?: boolean;
  createBackup?: boolean;
  showNotifications?: boolean;
}

export interface DataChangeEvent {
  elementType: string;
  elementId: string;
  oldValue: any;
  newValue: any;
  timestamp: Date;
  userId: string;
}

export class EnhancedPortfolioDataService {
  private static changeListeners: ((event: DataChangeEvent) => void)[] = [];
  private static autoSaveTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private static pendingChanges: Map<string, any> = new Map();
  
  // Subscribe to data changes
  static onDataChange(callback: (event: DataChangeEvent) => void) {
    this.changeListeners.push(callback);
    return () => {
      const index = this.changeListeners.indexOf(callback);
      if (index > -1) {
        this.changeListeners.splice(index, 1);
      }
    };
  }
  
  // Emit data change event
  private static emitDataChange(event: DataChangeEvent) {
    this.changeListeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in data change listener:', error);
      }
    });
  }
  
  // Enhanced save with validation and auto-save
  static async saveElement(
    elementType: string,
    elementId: string,
    value: string | object,
    options: SaveOptions = {}
  ): Promise<{ success: boolean; data?: any; errors?: string[] }> {
    const {
      autoSave = false,
      validateData = true,
      createBackup = true,
      showNotifications = true
    } = options;
    
    try {
      // Check authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User must be authenticated to save data');
      }
      
      // Validate data if requested
      if (validateData) {
        let validation: ValidationResult;
        
        if (typeof value === 'string') {
          validation = DataValidator.validateText(value);
        } else {
          validation = DataValidator.validateJson(value);
        }
        
        if (!validation.isValid) {
          if (showNotifications) {
            toast.error(`Validation failed: ${validation.errors.join(', ')}`);
          }
          return { success: false, errors: validation.errors };
        }
        
        // Use sanitized value
        value = validation.sanitizedValue || value;
      }
      
      // Get current value for change tracking
      const currentData = await this.getElement(elementType, elementId);
      
      // Prepare data for database
      const elementValue = typeof value === 'string' ? value : null;
      const jsonData = typeof value === 'object' ? value : null;
      
      // Use the enhanced upsert function
      const { data, error } = await supabase.rpc('upsert_portfolio_data', {
        p_element_type: elementType,
        p_element_id: elementId,
        p_element_value: elementValue,
        p_json_data: jsonData,
        p_metadata: {
          auto_save: autoSave,
          last_modified: new Date().toISOString(),
          user_agent: navigator.userAgent
        }
      });
      
      if (error) throw error;
      
      // Emit change event
      this.emitDataChange({
        elementType,
        elementId,
        oldValue: currentData,
        newValue: value,
        timestamp: new Date(),
        userId: session.user.id
      });
      
      // Show success notification
      if (showNotifications && !autoSave) {
        toast.success('Changes saved successfully!', {
          duration: 2000,
        });
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('Failed to save element:', error);
      
      if (showNotifications) {
        toast.error(`Failed to save: ${error.message}`, {
          duration: 4000,
        });
      }
      
      return { success: false, errors: [error.message] };
    }
  }
  
  // Auto-save with debouncing
  static autoSave(
    elementType: string,
    elementId: string,
    value: string | object,
    delay: number = 2000
  ) {
    const key = `${elementType}_${elementId}`;
    
    // Clear existing timeout
    const existingTimeout = this.autoSaveTimeouts.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
    
    // Store pending change
    this.pendingChanges.set(key, value);
    
    // Set new timeout
    const timeout = setTimeout(async () => {
      const pendingValue = this.pendingChanges.get(key);
      if (pendingValue !== undefined) {
        await this.saveElement(elementType, elementId, pendingValue, {
          autoSave: true,
          showNotifications: false
        });
        this.pendingChanges.delete(key);
        this.autoSaveTimeouts.delete(key);
      }
    }, delay);
    
    this.autoSaveTimeouts.set(key, timeout);
  }
  
  // Get element with caching
  static async getElement(elementType: string, elementId: string): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('get_portfolio_data', {
        p_element_type: elementType,
        p_element_id: elementId
      });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const item = data[0];
        return item.json_data || item.element_value;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get element:', error);
      return null;
    }
  }
  
  // Load all data with enhanced caching
  static async loadAllData(): Promise<Map<string, any>> {
    try {
      const { data, error } = await supabase.rpc('get_portfolio_data');
      
      if (error) throw error;
      
      const dataMap = new Map();
      data?.forEach((item: any) => {
        const value = item.json_data || item.element_value;
        dataMap.set(`${item.element_type}_${item.element_id}`, value);
      });
      
      return dataMap;
    } catch (error) {
      console.error('Failed to load portfolio data:', error);
      return new Map();
    }
  }
  
  // Bulk save operations
  static async bulkSave(updates: Array<{
    elementType: string;
    elementId: string;
    value: any;
  }>): Promise<{ success: boolean; savedCount: number; errors: string[] }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User must be authenticated');
      }
      
      // Prepare bulk update data
      const bulkData = updates.map(update => ({
        element_type: update.elementType,
        element_id: update.elementId,
        element_value: typeof update.value === 'string' ? update.value : null,
        json_data: typeof update.value === 'object' ? update.value : null,
        metadata: {
          bulk_operation: true,
          timestamp: new Date().toISOString()
        }
      }));
      
      const { data, error } = await supabase.rpc('bulk_update_portfolio_data', {
        p_updates: bulkData
      });
      
      if (error) throw error;
      
      toast.success(`Successfully saved ${data} items!`);
      
      return { success: true, savedCount: data, errors: [] };
    } catch (error) {
      console.error('Bulk save failed:', error);
      toast.error(`Bulk save failed: ${error.message}`);
      return { success: false, savedCount: 0, errors: [error.message] };
    }
  }
  
  // Delete element with backup
  static async deleteElement(elementType: string, elementId: string): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User must be authenticated');
      }
      
      // Create backup before deletion
      const currentValue = await this.getElement(elementType, elementId);
      if (currentValue) {
        await supabase.from('portfolio_data_backup').insert({
          user_id: session.user.id,
          element_type: elementType,
          element_id: elementId,
          element_value: typeof currentValue === 'string' ? currentValue : null,
          json_data: typeof currentValue === 'object' ? currentValue : null,
          backup_reason: 'pre_deletion_backup'
        });
      }
      
      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from('portfolio_data_v2')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('user_id', session.user.id)
        .eq('element_type', elementType)
        .eq('element_id', elementId);
      
      if (error) throw error;
      
      toast.success('Item deleted successfully!');
      return true;
    } catch (error) {
      console.error('Failed to delete element:', error);
      toast.error(`Failed to delete: ${error.message}`);
      return false;
    }
  }
  
  // Get audit log for debugging and tracking
  static async getAuditLog(limit: number = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('portfolio_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get audit log:', error);
      return [];
    }
  }
  
  // Restore from backup
  static async restoreFromBackup(backupId: string): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User must be authenticated');
      }
      
      // Get backup data
      const { data: backup, error: backupError } = await supabase
        .from('portfolio_data_backup')
        .select('*')
        .eq('id', backupId)
        .eq('user_id', session.user.id)
        .single();
      
      if (backupError) throw backupError;
      
      // Restore data
      const result = await this.saveElement(
        backup.element_type,
        backup.element_id,
        backup.json_data || backup.element_value,
        { showNotifications: false }
      );
      
      if (result.success) {
        toast.success('Data restored from backup successfully!');
        return true;
      } else {
        throw new Error(result.errors?.join(', ') || 'Restore failed');
      }
    } catch (error) {
      console.error('Failed to restore from backup:', error);
      toast.error(`Restore failed: ${error.message}`);
      return false;
    }
  }
  
  // Clear all auto-save timeouts (useful for cleanup)
  static clearAllAutoSaveTimeouts() {
    this.autoSaveTimeouts.forEach(timeout => clearTimeout(timeout));
    this.autoSaveTimeouts.clear();
    this.pendingChanges.clear();
  }
  
  // Health check for the persistence system
  static async healthCheck(): Promise<{
    isHealthy: boolean;
    details: Record<string, any>;
  }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const details: Record<string, any> = {
        authenticated: !!session,
        pendingChanges: this.pendingChanges.size,
        activeTimeouts: this.autoSaveTimeouts.size,
        listeners: this.changeListeners.length
      };
      
      if (session) {
        // Test database connectivity
        const { data, error } = await supabase.rpc('get_portfolio_data', {
          p_element_type: 'health_check',
          p_element_id: 'test'
        });
        
        details.databaseConnected = !error;
        details.databaseError = error?.message;
      }
      
      const isHealthy = details.authenticated && details.databaseConnected;
      
      return { isHealthy, details };
    } catch (error) {
      return {
        isHealthy: false,
        details: { error: error.message }
      };
    }
  }
}