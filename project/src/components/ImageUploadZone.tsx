
import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';

interface ImageUploadZoneProps {
  onUpload: (files: File[]) => void;
}

export const ImageUploadZone: React.FC<ImageUploadZoneProps> = ({ onUpload }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    processFiles(Array.from(e.dataTransfer.files));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files));
    }
  };

  const processFiles = async (files: File[]) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      alert('Please select valid image files (JPG, PNG, GIF, WebP)');
      return;
    }

    setIsUploading(true);
    
    // Simulate upload delay
    setTimeout(() => {
      onUpload(imageFiles);
      setIsUploading(false);
    }, 500);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      onClick={openFileDialog}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
        ${isDragOver 
          ? 'border-amber-500 bg-amber-50 scale-105' 
          : 'border-amber-300 hover:border-amber-400 hover:bg-amber-50'
        }
        ${isUploading ? 'opacity-50 pointer-events-none' : ''}
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <div className="space-y-4">
        {isUploading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
            <p className="text-amber-700 font-medium mt-4">Uploading images...</p>
          </div>
        ) : (
          <>
            <div className="flex justify-center">
              <div className="p-4 bg-amber-100 rounded-full">
                <Upload size={32} className="text-amber-600" />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-amber-900 mb-2">
                Upload Images
              </h3>
              <p className="text-amber-700 mb-4">
                Drag and drop your images here, or click to browse
              </p>
              <p className="text-sm text-amber-600">
                Supports: JPG, PNG, GIF, WebP • Multiple files allowed
              </p>
            </div>
            
            <button className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium">
              Choose Files
            </button>
          </>
        )}
      </div>
    </div>
  );
};
