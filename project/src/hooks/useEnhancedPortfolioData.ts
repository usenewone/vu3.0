import { useState, useEffect, useCallback } from 'react';
import { EnhancedPortfolioDataService, DataChangeEvent } from '../services/enhancedPortfolioDataService';
import { UserProfileService, ProjectsService } from '../services/portfolioDataService';
import { toast } from 'sonner';

export const useEnhancedPortfolioData = () => {
  const [portfolioData, setPortfolioData] = useState(new Map());
  const [userProfile, setUserProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingChanges, setPendingChanges] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Subscribe to data changes
  useEffect(() => {
    const unsubscribe = EnhancedPortfolioDataService.onDataChange((event: DataChangeEvent) => {
      // Update local state when data changes
      setPortfolioData(prev => {
        const newMap = new Map(prev);
        newMap.set(`${event.elementType}_${event.elementId}`, event.newValue);
        return newMap;
      });
      
      // Update last sync time
      setLastSyncTime(new Date());
    });
    
    return unsubscribe;
  }, []);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      // Load all portfolio data in parallel
      const [dataMap, profile, projectsList] = await Promise.all([
        EnhancedPortfolioDataService.loadAllData(),
        UserProfileService.loadProfile(),
        ProjectsService.loadAllProjects()
      ]);

      setPortfolioData(dataMap);
      setUserProfile(profile);
      setProjects(projectsList);
      setLastSyncTime(new Date());
      
      // Show offline warning if needed
      if (!isOnline) {
        toast.warning('You are offline. Changes will be saved when connection is restored.');
      }
    } catch (error) {
      console.error('Failed to load portfolio data:', error);
      toast.error('Failed to load portfolio data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }, [isOnline]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Enhanced update function with validation
  const updatePortfolioData = useCallback(async (
    elementType: string, 
    elementId: string, 
    value: any,
    options: { autoSave?: boolean; validate?: boolean } = {}
  ) => {
    const { autoSave = true, validate = true } = options;
    
    try {
      if (autoSave) {
        // Use auto-save for real-time updates
        EnhancedPortfolioDataService.autoSave(elementType, elementId, value);
        setPendingChanges(prev => prev + 1);
      } else {
        // Immediate save
        const result = await EnhancedPortfolioDataService.saveElement(
          elementType, 
          elementId, 
          value,
          { validateData: validate }
        );
        
        if (result.success) {
          setPortfolioData(prev => {
            const newMap = new Map(prev);
            newMap.set(`${elementType}_${elementId}`, value);
            return newMap;
          });
          setLastSyncTime(new Date());
        }
        
        return result;
      }
    } catch (error) {
      console.error('Failed to update portfolio data:', error);
      toast.error('Failed to save changes. Please try again.');
      return { success: false, errors: [error.message] };
    }
  }, []);

  const getPortfolioValue = useCallback((
    elementType: string, 
    elementId: string, 
    defaultValue: any = ''
  ) => {
    return portfolioData.get(`${elementType}_${elementId}`) || defaultValue;
  }, [portfolioData]);

  // Bulk save function
  const bulkSave = useCallback(async (updates: Array<{
    elementType: string;
    elementId: string;
    value: any;
  }>) => {
    try {
      const result = await EnhancedPortfolioDataService.bulkSave(updates);
      
      if (result.success) {
        // Update local state
        setPortfolioData(prev => {
          const newMap = new Map(prev);
          updates.forEach(update => {
            newMap.set(`${update.elementType}_${update.elementId}`, update.value);
          });
          return newMap;
        });
        setLastSyncTime(new Date());
      }
      
      return result;
    } catch (error) {
      console.error('Bulk save failed:', error);
      return { success: false, savedCount: 0, errors: [error.message] };
    }
  }, []);

  // Health check function
  const performHealthCheck = useCallback(async () => {
    try {
      const health = await EnhancedPortfolioDataService.healthCheck();
      
      if (!health.isHealthy) {
        toast.error('Data persistence system is experiencing issues.');
      }
      
      return health;
    } catch (error) {
      console.error('Health check failed:', error);
      return { isHealthy: false, details: { error: error.message } };
    }
  }, []);

  // Cleanup function
  const cleanup = useCallback(() => {
    EnhancedPortfolioDataService.clearAllAutoSaveTimeouts();
    setPendingChanges(0);
  }, []);

  // Auto-cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    portfolioData,
    userProfile,
    projects,
    loading,
    isOnline,
    pendingChanges,
    lastSyncTime,
    loadAllData,
    updatePortfolioData,
    getPortfolioValue,
    bulkSave,
    performHealthCheck,
    cleanup,
    setUserProfile,
    setProjects
  };
};