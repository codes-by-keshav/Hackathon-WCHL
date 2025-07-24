import React from 'react';

const Button = ({ 
  children, 
  onClick, 
  variant = 'cyber', 
  size = 'md',
  disabled = false,
  icon = null,
  className = ''
}) => {
  const baseClasses = `
    inline-flex items-center justify-center gap-3
    font-bold transition-all duration-300 
    disabled:opacity-50 disabled:cursor-not-allowed
    ${className}
  `;

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  const variantClasses = {
    cyber: 'cyber-button',
    quantum: 'quantum-button'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]}`}
    >
      {icon && <span className="text-xl">{icon}</span>}
      {children}
    </button>
  );
};

export default Button;