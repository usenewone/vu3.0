import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Save, AlertCircle, Check, Clock, Database } from 'lucide-react';
import { EnhancedPortfolioDataService } from '../../services/enhancedPortfolioDataService';

interface DataPersistenceStatusProps {
  isOnline: boolean;
  pendingChanges: number;
  lastSyncTime: Date | null;
  className?: string;
}

export const DataPersistenceStatus: React.FC<DataPersistenceStatusProps> = ({
  isOnline,
  pendingChanges,
  lastSyncTime,
  className = ''
}) => {
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const checkHealth = async () => {
      const health = await EnhancedPortfolioDataService.healthCheck();
      setHealthStatus(health);
    };
    
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    if (!isOnline) return 'text-red-600 bg-red-50 border-red-200';
    if (pendingChanges > 0) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (healthStatus?.isHealthy) return 'text-green-600 bg-green-50 border-green-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff size={16} />;
    if (pendingChanges > 0) return <Clock size={16} className="animate-pulse" />;
    if (healthStatus?.isHealthy) return <Check size={16} />;
    return <AlertCircle size={16} />;
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (pendingChanges > 0) return `${pendingChanges} pending`;
    if (healthStatus?.isHealthy) return 'All saved';
    return 'Checking...';
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <div
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg border cursor-pointer transition-all duration-200 ${getStatusColor()}`}
        onClick={() => setShowDetails(!showDetails)}
      >
        {getStatusIcon()}
        <span className="text-sm font-medium">{getStatusText()}</span>
        <Database size={14} />
      </div>
      
      {showDetails && (
        <div className="absolute bottom-full right-0 mb-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Database size={16} />
            Data Persistence Status
          </h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Connection:</span>
              <span className={`flex items-center gap-1 ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>Pending Changes:</span>
              <span className={pendingChanges > 0 ? 'text-orange-600' : 'text-green-600'}>
                {pendingChanges}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>Last Sync:</span>
              <span className="text-gray-600">
                {lastSyncTime ? lastSyncTime.toLocaleTimeString() : 'Never'}
              </span>
            </div>
            
            {healthStatus && (
              <>
                <div className="flex justify-between">
                  <span>Database:</span>
                  <span className={healthStatus.details.databaseConnected ? 'text-green-600' : 'text-red-600'}>
                    {healthStatus.details.databaseConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span>Auto-save:</span>
                  <span className="text-gray-600">
                    {healthStatus.details.activeTimeouts} active
                  </span>
                </div>
              </>
            )}
          </div>
          
          {!isOnline && (
            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
              <AlertCircle size={12} className="inline mr-1" />
              Changes will be saved when connection is restored.
            </div>
          )}
          
          {pendingChanges > 0 && (
            <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
              <Clock size={12} className="inline mr-1" />
              Auto-save in progress. Changes will be saved automatically.
            </div>
          )}
        </div>
      )}
    </div>
  );
};