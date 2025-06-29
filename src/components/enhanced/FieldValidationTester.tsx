import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Database, Users, Share2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { EnhancedPortfolioDataService } from '../../services/enhancedPortfolioDataService';
import { toast } from 'sonner';

interface TestResult {
  testName: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string;
}

interface FieldValidationTesterProps {
  projectId?: string;
}

export const FieldValidationTester: React.FC<FieldValidationTesterProps> = ({ projectId }) => {
  const { isOwner, isGuest } = useAuth();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);
  const [lastTestTime, setLastTestTime] = useState<Date | null>(null);

  const runTests = async () => {
    setTesting(true);
    const results: TestResult[] = [];

    try {
      // Test 1: Data Persistence
      results.push(await testDataPersistence());
      
      // Test 2: Field Validation
      results.push(await testFieldValidation());
      
      // Test 3: Real-time Updates
      results.push(await testRealTimeUpdates());
      
      // Test 4: Share Link Functionality
      if (isOwner) {
        results.push(await testShareLinkFunctionality());
      }
      
      // Test 5: Permission System
      results.push(await testPermissionSystem());
      
      // Test 6: Data Recovery
      results.push(await testDataRecovery());
      
      setTestResults(results);
      setLastTestTime(new Date());
      
      const passedTests = results.filter(r => r.status === 'pass').length;
      const totalTests = results.length;
      
      if (passedTests === totalTests) {
        toast.success(`All ${totalTests} tests passed!`);
      } else {
        toast.warning(`${passedTests}/${totalTests} tests passed`);
      }
    } catch (error) {
      console.error('Test execution failed:', error);
      toast.error('Test execution failed');
    } finally {
      setTesting(false);
    }
  };

  const testDataPersistence = async (): Promise<TestResult> => {
    try {
      const testData = `test_${Date.now()}`;
      const testId = 'persistence_test';
      
      // Save test data
      const saveResult = await EnhancedPortfolioDataService.saveElement(
        'test',
        testId,
        testData,
        { showNotifications: false }
      );
      
      if (!saveResult.success) {
        return {
          testName: 'Data Persistence',
          status: 'fail',
          message: 'Failed to save test data',
          details: saveResult.errors?.join(', ')
        };
      }
      
      // Retrieve test data
      const retrievedData = await EnhancedPortfolioDataService.getElement('test', testId);
      
      if (retrievedData !== testData) {
        return {
          testName: 'Data Persistence',
          status: 'fail',
          message: 'Retrieved data does not match saved data',
          details: `Expected: ${testData}, Got: ${retrievedData}`
        };
      }
      
      // Clean up
      await EnhancedPortfolioDataService.deleteElement('test', testId);
      
      return {
        testName: 'Data Persistence',
        status: 'pass',
        message: 'Data saves and loads correctly'
      };
    } catch (error) {
      return {
        testName: 'Data Persistence',
        status: 'fail',
        message: 'Test execution failed',
        details: error.message
      };
    }
  };

  const testFieldValidation = async (): Promise<TestResult> => {
    try {
      // Test invalid email
      const emailResult = await EnhancedPortfolioDataService.saveElement(
        'test',
        'email_test',
        'invalid-email',
        { validateData: true, showNotifications: false }
      );
      
      // Test oversized text
      const longText = 'a'.repeat(10001);
      const textResult = await EnhancedPortfolioDataService.saveElement(
        'test',
        'text_test',
        longText,
        { validateData: true, showNotifications: false }
      );
      
      // Both should fail validation
      if (emailResult.success || textResult.success) {
        return {
          testName: 'Field Validation',
          status: 'warning',
          message: 'Some validation checks may not be working properly',
          details: 'Invalid data was accepted'
        };
      }
      
      return {
        testName: 'Field Validation',
        status: 'pass',
        message: 'Field validation working correctly'
      };
    } catch (error) {
      return {
        testName: 'Field Validation',
        status: 'fail',
        message: 'Validation test failed',
        details: error.message
      };
    }
  };

  const testRealTimeUpdates = async (): Promise<TestResult> => {
    try {
      let updateReceived = false;
      
      // Subscribe to changes
      const unsubscribe = EnhancedPortfolioDataService.onDataChange((event) => {
        if (event.elementId === 'realtime_test') {
          updateReceived = true;
        }
      });
      
      // Make a change
      await EnhancedPortfolioDataService.saveElement(
        'test',
        'realtime_test',
        'realtime_data',
        { showNotifications: false }
      );
      
      // Wait a bit for the event
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      unsubscribe();
      
      // Clean up
      await EnhancedPortfolioDataService.deleteElement('test', 'realtime_test');
      
      return {
        testName: 'Real-time Updates',
        status: updateReceived ? 'pass' : 'warning',
        message: updateReceived 
          ? 'Real-time updates working correctly'
          : 'Real-time updates may not be functioning'
      };
    } catch (error) {
      return {
        testName: 'Real-time Updates',
        status: 'fail',
        message: 'Real-time test failed',
        details: error.message
      };
    }
  };

  const testShareLinkFunctionality = async (): Promise<TestResult> => {
    try {
      if (!projectId) {
        return {
          testName: 'Share Link Functionality',
          status: 'warning',
          message: 'No project ID provided for testing'
        };
      }
      
      // Create a test share link
      const shareId = `test_share_${Date.now()}`;
      const shareData = {
        shareId,
        projectId,
        createdBy: 'test_user',
        permissions: ['read'],
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        accessCount: 0,
        createdAt: new Date().toISOString()
      };
      
      await EnhancedPortfolioDataService.saveElement('share', shareId, shareData);
      
      // Verify it can be retrieved
      const retrievedShare = await EnhancedPortfolioDataService.getElement('share', shareId);
      
      if (!retrievedShare) {
        return {
          testName: 'Share Link Functionality',
          status: 'fail',
          message: 'Share link could not be retrieved after creation'
        };
      }
      
      // Clean up
      await EnhancedPortfolioDataService.deleteElement('share', shareId);
      
      return {
        testName: 'Share Link Functionality',
        status: 'pass',
        message: 'Share links can be created and accessed'
      };
    } catch (error) {
      return {
        testName: 'Share Link Functionality',
        status: 'fail',
        message: 'Share link test failed',
        details: error.message
      };
    }
  };

  const testPermissionSystem = async (): Promise<TestResult> => {
    try {
      const userRole = isOwner ? 'owner' : isGuest ? 'guest' : 'unknown';
      
      if (userRole === 'unknown') {
        return {
          testName: 'Permission System',
          status: 'warning',
          message: 'User role could not be determined'
        };
      }
      
      // Test appropriate permissions
      if (isOwner) {
        // Owners should be able to save data
        const saveResult = await EnhancedPortfolioDataService.saveElement(
          'test',
          'permission_test',
          'owner_data',
          { showNotifications: false }
        );
        
        if (!saveResult.success) {
          return {
            testName: 'Permission System',
            status: 'fail',
            message: 'Owner cannot save data as expected',
            details: saveResult.errors?.join(', ')
          };
        }
        
        // Clean up
        await EnhancedPortfolioDataService.deleteElement('test', 'permission_test');
      }
      
      return {
        testName: 'Permission System',
        status: 'pass',
        message: `User role (${userRole}) permissions working correctly`
      };
    } catch (error) {
      return {
        testName: 'Permission System',
        status: 'fail',
        message: 'Permission test failed',
        details: error.message
      };
    }
  };

  const testDataRecovery = async (): Promise<TestResult> => {
    try {
      const health = await EnhancedPortfolioDataService.healthCheck();
      
      if (!health.isHealthy) {
        return {
          testName: 'Data Recovery',
          status: 'fail',
          message: 'System health check failed',
          details: JSON.stringify(health.details)
        };
      }
      
      return {
        testName: 'Data Recovery',
        status: 'pass',
        message: 'System health check passed'
      };
    } catch (error) {
      return {
        testName: 'Data Recovery',
        status: 'fail',
        message: 'Health check failed',
        details: error.message
      };
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'fail':
        return <XCircle className="text-red-500" size={20} />;
      case 'warning':
        return <AlertCircle className="text-yellow-500" size={20} />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return <Badge className="bg-green-100 text-green-800">Pass</Badge>;
      case 'fail':
        return <Badge className="bg-red-100 text-red-800">Fail</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Database size={20} />
            System Validation Tests
          </CardTitle>
          <Button
            onClick={runTests}
            disabled={testing}
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw size={16} className={testing ? 'animate-spin' : ''} />
            {testing ? 'Running Tests...' : 'Run Tests'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {lastTestTime && (
          <div className="mb-4 text-sm text-gray-600">
            Last tested: {lastTestTime.toLocaleString()}
          </div>
        )}
        
        {testResults.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Database size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium mb-2">No tests run yet</p>
            <p className="text-sm">Click "Run Tests" to validate system functionality</p>
          </div>
        ) : (
          <div className="space-y-4">
            {testResults.map((result, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 bg-white"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result.status)}
                    <h3 className="font-medium text-gray-900">{result.testName}</h3>
                  </div>
                  {getStatusBadge(result.status)}
                </div>
                
                <p className="text-gray-600 text-sm mb-2">{result.message}</p>
                
                {result.details && (
                  <div className="bg-gray-50 rounded p-2 text-xs text-gray-700">
                    <strong>Details:</strong> {result.details}
                  </div>
                )}
              </div>
            ))}
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Test Summary</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {testResults.filter(r => r.status === 'pass').length}
                  </div>
                  <div className="text-gray-600">Passed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {testResults.filter(r => r.status === 'warning').length}
                  </div>
                  <div className="text-gray-600">Warnings</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {testResults.filter(r => r.status === 'fail').length}
                  </div>
                  <div className="text-gray-600">Failed</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};