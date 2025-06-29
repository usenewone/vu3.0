
import React from 'react';

interface SmoothScrollButtonProps {
  targetId: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const SmoothScrollButton: React.FC<SmoothScrollButtonProps> = ({
  targetId,
  children,
  className = '',
  onClick
}) => {
  const handleClick = () => {
    onClick?.();
    
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      // Add bounce effect to button
      const button = document.activeElement as HTMLElement;
      if (button) {
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
          button.style.transform = 'scale(1)';
        }, 150);
      }

      // Smooth scroll to target
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });

      // Highlight target section briefly
      setTimeout(() => {
        targetElement.style.boxShadow = '0 0 30px rgba(218, 165, 32, 0.3)';
        targetElement.style.transform = 'scale(1.02)';
        
        setTimeout(() => {
          targetElement.style.boxShadow = '';
          targetElement.style.transform = '';
        }, 1000);
      }, 800);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`transition-all duration-300 hover:scale-105 hover:shadow-xl ${className}`}
      style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
    >
      {children}
    </button>
  );
};
