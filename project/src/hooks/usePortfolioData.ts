
import { useState, useEffect } from 'react';
import { PortfolioDataService, UserProfileService, ProjectsService } from '../services/portfolioDataService';

export const usePortfolioData = () => {
  const [portfolioData, setPortfolioData] = useState(new Map());
  const [userProfile, setUserProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // Load all portfolio data in parallel
      const [dataMap, profile, projectsList] = await Promise.all([
        PortfolioDataService.loadAllData(),
        UserProfileService.loadProfile(),
        ProjectsService.loadAllProjects()
      ]);

      setPortfolioData(dataMap);
      setUserProfile(profile);
      setProjects(projectsList);
    } catch (error) {
      console.error('Failed to load portfolio data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const updatePortfolioData = (elementType: string, elementId: string, value: any) => {
    setPortfolioData(prev => {
      const newMap = new Map(prev);
      newMap.set(`${elementType}_${elementId}`, value);
      return newMap;
    });
  };

  const getPortfolioValue = (elementType: string, elementId: string, defaultValue: any = '') => {
    return portfolioData.get(`${elementType}_${elementId}`) || defaultValue;
  };

  return {
    portfolioData,
    userProfile,
    projects,
    loading,
    loadAllData,
    updatePortfolioData,
    getPortfolioValue,
    setUserProfile,
    setProjects
  };
};
