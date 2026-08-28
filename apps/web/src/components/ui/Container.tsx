import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  children: React.ReactNode;
}

export const Container: React.FC<ContainerProps> = ({
  size = 'lg',
  className,
  children,
  ...props
}) => {
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'max-w-4xl';
      case 'md':
        return 'max-w-5xl';
      case 'xl':
        return 'max-w-7xl';
      case 'full':
        return 'max-w-full';
      case 'lg':
      default:
        return 'max-w-6xl';
    }
  };

  return (
    <div
      className={twMerge(
        clsx(
          'w-full mx-auto px-4 sm:px-6 lg:px-8',
          getSizeStyles(),
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};
