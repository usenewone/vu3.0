
import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { ImageData } from '../pages/Index';
import { ImageUploadZone } from './ImageUploadZone';
import { ImageModal } from './ImageModal';
import { ImageCard } from './ImageCard';

interface ImageGalleryProps {
  projectId: string;
  category: string;
  images: ImageData[];
  onUpdateImages: (images: ImageData[]) => void;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  projectId,
  category,
  images,
  onUpdateImages
}) => {
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleImageUpload = (files: File[]) => {
    const newImages = files.map((file) => ({
      id: `${projectId}-${category}-${Date.now()}-${Math.random()}`,
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      description: '',
      category
    }));

    onUpdateImages([...images, ...newImages]);
  };

  const handleImageUpdate = (imageId: string, updates: Partial<ImageData>) => {
    const updatedImages = images.map(img =>
      img.id === imageId ? { ...img, ...updates } : img
    );
    onUpdateImages(updatedImages);
  };

  const handleImageDelete = (imageId: string) => {
    const updatedImages = images.filter(img => img.id !== imageId);
    onUpdateImages(updatedImages);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    const draggedImage = images[draggedIndex];
    const newImages = [...images];
    newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, draggedImage);
    
    onUpdateImages(newImages);
    setDraggedIndex(null);
  };

  const getCategoryDisplayName = () => {
    const categoryNames = {
      elevation: 'Elevation Designs',
      floorPlans: 'Floor Plans',
      topView: 'Top View/Ceiling Designs',
      twoD: '2D Designs',
      threeD: '3D Designs'
    };
    return categoryNames[category as keyof typeof categoryNames] || category;
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <ImageUploadZone onUpload={handleImageUpload} />

      {/* Images Grid */}
      {images.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-amber-900">
            {getCategoryDisplayName()} ({images.length} images)
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <ImageCard
                key={image.id}
                image={image}
                index={index}
                onEdit={(updates) => handleImageUpdate(image.id, updates)}
                onDelete={() => handleImageDelete(image.id)}
                onView={() => setSelectedImage(image)}
                onDragStart={() => handleDragStart(index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                isDragged={draggedIndex === index}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-amber-600">
          <ImageIcon size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No images in {getCategoryDisplayName()}</p>
          <p className="text-sm opacity-75">Upload images using the area above to get started</p>
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal
          image={selectedImage}
          images={images}
          onClose={() => setSelectedImage(null)}
          onNext={() => {
            const currentIndex = images.findIndex(img => img.id === selectedImage.id);
            const nextIndex = (currentIndex + 1) % images.length;
            setSelectedImage(images[nextIndex]);
          }}
          onPrevious={() => {
            const currentIndex = images.findIndex(img => img.id === selectedImage.id);
            const prevIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
            setSelectedImage(images[prevIndex]);
          }}
          onUpdate={(updates) => handleImageUpdate(selectedImage.id, updates)}
        />
      )}
    </div>
  );
};
