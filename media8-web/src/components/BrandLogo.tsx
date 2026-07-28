import React from 'react';
import logoCream from '../assets/logo-media8-cream.webp';
import logoWine from '../assets/logo-media8-wine.webp';

interface BrandLogoProps {
  variant?: 'cream' | 'wine';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizes = {
  sm: 'h-8',
  md: 'h-10',
  lg: 'h-14',
  xl: 'h-16',
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'cream',
  size = 'md',
  className = '',
}) => {
  const logoImg = variant === 'cream' ? logoCream : logoWine;

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <img
        src={logoImg}
        alt="Media 8"
        className={`${sizes[size]} w-auto object-contain`}
      />
    </div>
  );
};
