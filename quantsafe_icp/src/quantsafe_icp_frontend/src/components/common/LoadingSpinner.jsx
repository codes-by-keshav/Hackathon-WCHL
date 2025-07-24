import React from 'react';

const LoadingSpinner = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };

  return (
    <div className="flex justify-center items-center">
      <div className={`cyber-spinner ${sizeClasses[size]}`}></div>
    </div>
  );
};

export default LoadingSpinner;