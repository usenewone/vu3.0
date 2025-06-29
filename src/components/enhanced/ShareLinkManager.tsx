import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Share2, Copy, Eye, Users, Clock, Trash2, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { EnhancedPortfolioDataService } from '../../services/enhancedPortfolioDataService';
import { toast } from 'sonner';

interface ShareLink {
  id: string;
  shareId: string;
  projectId: string;
  createdBy: string;
  permissions: string[];
  expiresAt: string;
  isActive: boolean;
  accessCount: number;
  lastAccessedAt?: string;
  createdAt: string;
  url: string;
}

interface ShareLinkManagerProps {
  projectId: string;
  projectTitle: string;
}

export const ShareLinkManager: React.FC<ShareLinkManagerProps> = ({
  projectId,
  projectTitle
}) => {
  const { isOwner } = useAuth();
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newLinkConfig, setNewLinkConfig] = useState({
    expiresIn: 30, // days
    permissions: ['read']
  });

  useEffect(() => {
    if (isOwner) {
      loadShareLinks();
    }
  }, [projectId, isOwner]);

  const loadShareLinks = async () => {
    try {
      setLoading(true);
      const dataMap = await EnhancedPortfolioDataService.loadAllData();
      const links: ShareLink[] = [];
      
      dataMap.forEach((value, key) => {
        if (key.startsWith('share_') && value.projectId === projectId) {
          const url = `${window.location.origin}${window.location.pathname}?share=${value.shareId}`;
          links.push({ ...value, url });
        }
      });
      
      // Sort by creation date (newest first)
      links.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setShareLinks(links);
    } catch (error) {
      console.error('Failed to load share links:', error);
      toast.error('Failed to load share links');
    } finally {
      setLoading(false);
    }
  };

  const createShareLink = async () => {
    if (!isOwner) return;
    
    try {
      setCreating(true);
      
      const shareId = `share_${projectId}_${Date.now()}`;
      const expiresAt = new Date(Date.now() + newLinkConfig.expiresIn * 24 * 60 * 60 * 1000);
      
      const shareData = {
        id: shareId,
        shareId,
        projectId,
        createdBy: 'current_user', // This would be the actual user ID
        permissions: newLinkConfig.permissions,
        expiresAt: expiresAt.toISOString(),
        isActive: true,
        accessCount: 0,
        createdAt: new Date().toISOString()
      };
      
      await EnhancedPortfolioDataService.saveElement('share', shareId, shareData);
      
      const url = `${window.location.origin}${window.location.pathname}?share=${shareId}`;
      const newLink: ShareLink = { ...shareData, url };
      
      setShareLinks(prev => [newLink, ...prev]);
      setShowCreateForm(false);
      
      // Copy to clipboard
      await navigator.clipboard.writeText(url);
      toast.success('Share link created and copied to clipboard!');
    } catch (error) {
      console.error('Failed to create share link:', error);
      toast.error('Failed to create share link');
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const revokeShareLink = async (shareId: string) => {
    if (!isOwner) return;
    
    if (!window.confirm('Are you sure you want to revoke this share link? It will no longer be accessible.')) {
      return;
    }
    
    try {
      await EnhancedPortfolioDataService.deleteElement('share', shareId);
      setShareLinks(prev => prev.filter(link => link.shareId !== shareId));
      toast.success('Share link revoked successfully');
    } catch (error) {
      console.error('Failed to revoke share link:', error);
      toast.error('Failed to revoke share link');
    }
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  if (!isOwner) {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-4">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
            <span className="text-gray-600">Loading share links...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Share2 size={20} />
            Share Links
          </CardTitle>
          <Button
            onClick={() => setShowCreateForm(true)}
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            Create Link
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Create New Link Form */}
        {showCreateForm && (
          <Card className="mb-6 border-2 border-dashed border-green-300 bg-green-50">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Expires In (Days)</label>
                  <Input
                    type="number"
                    value={newLinkConfig.expiresIn}
                    onChange={(e) => setNewLinkConfig(prev => ({ 
                      ...prev, 
                      expiresIn: parseInt(e.target.value) || 30 
                    }))}
                    min={1}
                    max={365}
                    className="mt-1"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Link will expire on {new Date(Date.now() + newLinkConfig.expiresIn * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    onClick={createShareLink}
                    disabled={creating}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Share2 size={16} />
                    {creating ? 'Creating...' : 'Create Share Link'}
                  </Button>
                  <Button
                    onClick={() => setShowCreateForm(false)}
                    variant="outline"
                    size="sm"
                    disabled={creating}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Share Links List */}
        {shareLinks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Share2 size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium mb-2">No share links created</p>
            <p className="text-sm">Create a share link to allow others to view this project</p>
          </div>
        ) : (
          <div className="space-y-4">
            {shareLinks.map((link) => (
              <div
                key={link.shareId}
                className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">
                      Share Link for "{projectTitle}"
                    </h3>
                    <Badge 
                      variant={link.isActive && !isExpired(link.expiresAt) ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {!link.isActive ? 'Revoked' : isExpired(link.expiresAt) ? 'Expired' : 'Active'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => copyToClipboard(link.url)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Copy size={14} />
                      Copy
                    </Button>
                    <Button
                      onClick={() => revokeShareLink(link.shareId)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded p-3 mb-3">
                  <code className="text-sm text-gray-700 break-all">{link.url}</code>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-gray-400" />
                    <span className="text-gray-600">
                      {link.accessCount} {link.accessCount === 1 ? 'view' : 'views'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-gray-400" />
                    <span className="text-gray-600">
                      Expires: {new Date(link.expiresAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Eye size={14} className="text-gray-400" />
                    <span className="text-gray-600">
                      Created: {new Date(link.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {link.lastAccessedAt && (
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-gray-400" />
                      <span className="text-gray-600">
                        Last viewed: {new Date(link.lastAccessedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};