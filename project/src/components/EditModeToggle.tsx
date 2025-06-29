
import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Eye, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface EditModeToggleProps {
  isEditMode: boolean;
  onToggleEdit: () => void;
}

export const EditModeToggle: React.FC<EditModeToggleProps> = ({ 
  isEditMode, 
  onToggleEdit 
}) => {
  const { isOwner, isGuest, signOut } = useAuth();

  if (!isOwner && !isGuest) return null;

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2">
      {isOwner && (
        <Button
          onClick={onToggleEdit}
          className={`px-4 py-2 rounded-lg transition-colors font-poppins flex items-center gap-2 ${
            isEditMode 
              ? 'bg-green-600 hover:bg-green-700 text-white' 
              : 'bg-primary-brown hover:bg-secondary-brown text-white'
          }`}
        >
          {isEditMode ? <Eye size={16} /> : <Edit size={16} />}
          {isEditMode ? 'View Mode' : 'Edit Mode'}
        </Button>
      )}
      
      {(isOwner || isGuest) && (
        <Button
          onClick={signOut}
          variant="outline"
          className="px-4 py-2 rounded-lg border-2 border-primary-brown text-primary-brown hover:bg-primary-brown hover:text-white transition-colors font-poppins flex items-center gap-2"
        >
          <LogOut size={16} />
          {isGuest ? 'Exit' : 'Logout'}
        </Button>
      )}
    </div>
  );
};
