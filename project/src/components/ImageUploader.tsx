
import React, { useState } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { PortfolioDataService } from '../services/portfolioDataService';
import { useAuth } from '@/contexts/AuthContext';

interface ImageUploaderProps {
  elementId: string;
  currentImageUrl?: string;
  onImageUploaded: (url: string) => void;
  className?: string;
  showUploadArea?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  elementId,
  currentImageUrl,
  onImageUploaded,
  className = '',
  showUploadArea = true
}) => {
  const { isOwner } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = async (file: File) => {
    if (!isOwner || !file.type.startsWith('image/')) return;

    setIsUploading(true);
    try {
      const imageUrl = await PortfolioDataService.uploadImage(file, elementId);
      onImageUploaded(imageUrl);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Don't show upload controls for guests
  if (!isOwner) {
    return currentImageUrl ? (
      <img src={currentImageUrl} alt="" className={className} />
    ) : null;
  }

  if (currentImageUrl && !showUploadArea) {
    return (
      <div className="relative group">
        <img src={currentImageUrl} alt="" className={className} />
        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <label className="cursor-pointer bg-white text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors">
            Change Image
            <input
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
              disabled={isUploading}
            />
          </label>
        </div>
        {isUploading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      className={`
        border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200
        ${dragOver 
          ? 'border-amber-500 bg-amber-50 scale-105' 
          : 'border-amber-300 hover:border-amber-400 hover:bg-amber-50'
        }
        ${isUploading ? 'opacity-50 pointer-events-none' : ''}
        ${className}
      `}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
        id={`upload-${elementId}`}
        disabled={isUploading}
      />
      
      {isUploading ? (
        <div className="space-y-4">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-amber-700 font-medium">Uploading image...</p>
        </div>
      ) : (
        <label htmlFor={`upload-${elementId}`} className="cursor-pointer">
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-amber-100 rounded-full">
                <Upload size={32} className="text-amber-600" />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-amber-900 mb-2">
                Upload Image
              </h3>
              <p className="text-amber-700 mb-4">
                Drag and drop your image here, or click to browse
              </p>
              <p className="text-sm text-amber-600">
                Supports: JPG, PNG, GIF, WebP
              </p>
            </div>
          </div>
        </label>
      )}
    </div>
  );
};
