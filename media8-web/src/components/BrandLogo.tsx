import React from 'react';
import logoCream from '../assets/logo-media8-cream.webp';
import logoWine from '../assets/logo-media8-wine.webp';

interface BrandLogoProps {
  variant?: 'cream' | 'wine';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'cream',
  size = 'md',
  showSubtitle = true,
  className = '',
}) => {
  const logoImg = variant === 'cream' ? logoCream : logoWine;

  const sizeDimensions = {
    sm: 'h-7',
    md: 'h-9',
    lg: 'h-12',
    xl: 'h-16',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <img
        src={logoImg}
        alt="Media 8 Logo"
        className={`${sizeDimensions[size]} w-auto object-contain drop-shadow-md transition-transform duration-200 hover:scale-105`}
        onError={(e) => {
          // Fallback if image fails to render
          e.currentTarget.style.display = 'none';
        }}
      />
      <div>
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-lg tracking-wider uppercase text-cream-soft">
            Media <span className="text-wine-vibrant">8</span>
          </span>
          <span className="text-[10px] bg-wine-deep/80 border border-wine-vibrant/60 text-cream-soft px-2 py-0.5 rounded-full font-mono uppercase tracking-widest shadow-sm">
            Workstation
          </span>
        </div>
        {showSubtitle && (
          <p className="text-[11px] text-cream-soft/60 tracking-tight font-medium">
            Production Asset Management
          </p>
        )}
      </div>
    </div>
  );
};
