
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ImageData } from '../pages/Index';

interface ImageModalProps {
  image: ImageData;
  images: ImageData[];
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onUpdate: (updates: Partial<ImageData>) => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({
  image,
  images,
  onClose,
  onNext,
  onPrevious,
  onUpdate
}) => {
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editDescription, setEditDescription] = useState(image.description);

  useEffect(() => {
    setEditDescription(image.description);
  }, [image.description]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrevious();
      if (e.key === 'ArrowRight') onNext();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNext, onPrevious]);

  const handleDescriptionSave = () => {
    onUpdate({ description: editDescription });
    setIsEditingDescription(false);
  };

  const handleDescriptionCancel = () => {
    setEditDescription(image.description);
    setIsEditingDescription(false);
  };

  const currentIndex = images.findIndex(img => img.id === image.id);
  const isFirstImage = currentIndex === 0;
  const isLastImage = currentIndex === images.length - 1;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Navigation Buttons */}
      {images.length > 1 && (
        <>
          <button
            onClick={onPrevious}
            disabled={isFirstImage}
            className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-white p-2 rounded-full transition-colors ${
              isFirstImage ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white hover:bg-opacity-20'
            }`}
          >
            <ChevronLeft size={32} />
          </button>
          
          <button
            onClick={onNext}
            disabled={isLastImage}
            className={`absolute right-4 top-1/2 transform -translate-y-1/2 text-white p-2 rounded-full transition-colors ${
              isLastImage ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white hover:bg-opacity-20'
            }`}
          >
            <ChevronRight size={32} />
          </button>
        </>
      )}

      {/* Main Content */}
      <div className="max-w-5xl max-h-full mx-4 flex flex-col lg:flex-row items-center gap-8">
        {/* Image */}
        <div className="flex-1 flex items-center justify-center max-h-screen">
          <img
            src={image.url}
            alt={image.name}
            className="max-w-full max-h-full object-contain"
          />
        </div>

        {/* Image Info Panel */}
        <div className="lg:w-80 bg-white rounded-lg p-6 max-h-screen overflow-y-auto">
          <h2 className="text-xl font-bold text-amber-900 mb-4">{image.name}</h2>
          
          <div className="space-y-4">
            {/* Image Details */}
            <div>
              <h3 className="font-semibold text-amber-800 mb-2">Image Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-amber-600">Size:</span>
                  <span className="text-amber-800">{(image.file.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-600">Type:</span>
                  <span className="text-amber-800">{image.file.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-600">Category:</span>
                  <span className="text-amber-800 capitalize">{image.category}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="font-semibold text-amber-800 mb-2">Description</h3>
              {isEditingDescription ? (
                <div className="space-y-2">
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Add a description for this image..."
                    className="w-full p-2 border border-amber-300 rounded focus:outline-none focus:border-amber-500 resize-vertical"
                    rows={4}
                    autoFocus
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={handleDescriptionSave}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleDescriptionCancel}
                      className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setIsEditingDescription(true)}
                  className="p-2 min-h-20 border border-dashed border-amber-300 rounded cursor-pointer hover:bg-amber-50 transition-colors"
                >
                  {image.description || (
                    <span className="text-amber-400 italic">Click to add description...</span>
                  )}
                </div>
              )}
            </div>

            {/* Navigation Info */}
            {images.length > 1 && (
              <div className="text-center text-sm text-amber-600 border-t border-amber-100 pt-4">
                Image {currentIndex + 1} of {images.length}
                <div className="mt-2 text-xs text-amber-500">
                  Use arrow keys or buttons to navigate
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
