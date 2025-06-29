
import React, { useState } from 'react';
import { ImageData } from '../pages/Index';

interface ImageCardProps {
  image: ImageData;
  index: number;
  onEdit: (updates: Partial<ImageData>) => void;
  onDelete: () => void;
  onView: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  isDragged: boolean;
}

export const ImageCard: React.FC<ImageCardProps> = ({
  image,
  index,
  onEdit,
  onDelete,
  onView,
  onDragStart,
  onDragOver,
  onDrop,
  isDragged
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(image.name);

  const handleNameSave = () => {
    onEdit({ name: editName });
    setIsEditingName(false);
  };

  const handleNameCancel = () => {
    setEditName(image.name);
    setIsEditingName(false);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this image?')) {
      onDelete();
    }
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        bg-white rounded-lg shadow-md overflow-hidden border-2 border-transparent
        hover:border-amber-200 hover:shadow-lg transition-all duration-200 cursor-pointer
        ${isDragged ? 'opacity-50 scale-95' : ''}
      `}
    >
      {/* Image */}
      <div className="relative aspect-square bg-gray-100" onClick={onView}>
        <img
          src={image.url}
          alt={image.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        
        {/* Hover Overlay */}
        {isHovered && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <button className="px-4 py-2 bg-white text-gray-800 rounded-lg font-medium hover:bg-gray-100 transition-colors">
              View Full Size
            </button>
          </div>
        )}

        {/* Delete Button */}
        <button
          onClick={handleDeleteClick}
          className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 hover:opacity-100 transition-opacity hover:bg-red-700"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Image Info */}
      <div className="p-3">
        {isEditingName ? (
          <div className="space-y-2">
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNameSave();
                if (e.key === 'Escape') handleNameCancel();
              }}
              className="w-full px-2 py-1 text-sm border border-amber-300 rounded focus:outline-none focus:border-amber-500"
              autoFocus
            />
            <div className="flex space-x-2">
              <button
                onClick={handleNameSave}
                className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
              >
                Save
              </button>
              <button
                onClick={handleNameCancel}
                className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <h4
            onClick={() => setIsEditingName(true)}
            className="font-medium text-amber-900 text-sm truncate cursor-pointer hover:bg-amber-50 rounded px-1 py-1 transition-colors"
            title="Click to edit"
          >
            {image.name}
          </h4>
        )}
        
        <p className="text-xs text-amber-600 mt-1">
          {(image.file.size / 1024 / 1024).toFixed(2)} MB
        </p>
      </div>
    </div>
  );
};
