import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { FormManager } from '@/components/enhanced/FormManager';
import { RealTimeEditableForm } from '@/components/enhanced/RealTimeEditableForm';
import { LoginPage } from '@/components/LoginPage';
import { EnhancedPortfolioDataService } from '../services/enhancedPortfolioDataService';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

const FormPage: React.FC = () => {
  const { isOwner, isGuest, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const [sharedForm, setSharedForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const shareId = searchParams.get('share');

  useEffect(() => {
    if (shareId) {
      loadSharedForm();
    } else {
      setLoading(false);
    }
  }, [shareId]);

  const loadSharedForm = async () => {
    try {
      setLoading(true);
      
      // Load share data
      const shareData = await EnhancedPortfolioDataService.getElement('share', shareId!);
      
      if (!shareData) {
        setError('Share link not found or expired');
        return;
      }

      // Check if share link is expired
      if (shareData.expiresAt && new Date(shareData.expiresAt) < new Date()) {
        setError('Share link has expired');
        return;
      }

      // Load form data
      const formData = await EnhancedPortfolioDataService.getElement('form', shareData.formId);
      
      if (!formData) {
        setError('Form not found');
        return;
      }

      // Load form instance data
      const instanceData = await EnhancedPortfolioDataService.getElement('form_instance', shareData.formId);
      
      setSharedForm({
        ...formData,
        instance: instanceData,
        shareData
      });
    } catch (error) {
      console.error('Failed to load shared form:', error);
      setError('Failed to load shared form');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-blue-700">Loading...</p>
        </div>
      </div>
    );
  }

  // Handle shared form view
  if (shareId) {
    if (error) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-red-900 mb-2">Access Error</h2>
              <p className="text-red-700 mb-4">{error}</p>
              <a 
                href="/" 
                className="inline-block px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Go to Homepage
              </a>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (sharedForm) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
          <div className="max-w-4xl mx-auto">
            <RealTimeEditableForm
              formId={sharedForm.instanceId}
              title={sharedForm.instance?.name || 'Shared Form'}
              description="This is a shared form view. You can view the content but cannot make edits."
              fields={sharedForm.fields || []}
              isShared={true}
              shareId={shareId}
            />
          </div>
        </div>
      );
    }

    return null;
  }

  // Regular form management page
  if (!isOwner && !isGuest) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <FormManager />
      </div>
    </div>
  );
};

export default FormPage;