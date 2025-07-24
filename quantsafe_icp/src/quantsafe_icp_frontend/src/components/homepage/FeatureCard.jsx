import React from 'react';

const FeatureCard = ({ iconSrc, title, description, color }) => {
  return (
    <div className="feature-card rounded-xl">
      <div className="feature-card-content">
        {/* Front side - Icon and Title */}
        <div className="feature-card-front">
          <div className="mb-6 flex justify-center items-center">
            <img 
              src={iconSrc} 
              alt={title} 
              className="w-16 h-16 object-contain"
            />
          </div>
          <h3 className={`text-2xl font-body  ${color}`}>
            {title}
          </h3>
        </div>

        {/* Back side - Description */}
        <div className="feature-card-back">
          <div className="mb-4 opacity-50 flex justify-center items-center">
            <img 
              src={iconSrc} 
              alt={title} 
              className="w-12 h-12 object-contain"
            />
          </div>
          <h3 className={`text-xl font-body  ${color} mb-4`}>
            {title}
          </h3>
          <p className="text-gray-300 leading-relaxed text-sm font-body">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FeatureCard;