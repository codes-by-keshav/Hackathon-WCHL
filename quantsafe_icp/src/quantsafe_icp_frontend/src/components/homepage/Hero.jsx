import React from 'react';
import LoginButton from './LoginButton';
import RegisterButton from './RegisterButton';
import FeatureCard from './FeatureCard';

const Hero = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative z-10 section-padding quantum-circuit">
      
      {/* Main Hero Content */}
      <div className="text-center max-w-6xl mx-auto element-spacing">
        
        {/* Logo/Brand */}
        <div>
          <h1 className="hero-title font-heading neon-text">
            QuantaVerse
          </h1>
          <p className="hero-subtitle text-gray-400 font-light tracking-wider">
            AI-Powered Post-Quantum Secure Social Media
          </p>
        </div>

        {/* Description */}
        <div className="space-y-6">
          <p className="hero-description text-gray-300 leading-relaxed max-w-3xl mx-auto">
            Experience the future of secure social networking secured by 
            <span className="text-cyan-400 font-semibold"> Kyber & Dilithium </span>
            quantum-resistant cryptography.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="button-group">
          <LoginButton />
          <div className="text-gray-600 text-lg font-mono">||</div>
          <RegisterButton />
        </div>

        {/* Interactive Features Preview */}
        <div className="feature-grid">
          <FeatureCard
            iconSrc="/img/cryptography.png"
            title="Quantum Secure"
            description="Protected against quantum attacks using PQC algorithms like Kyber and Dilithium"
            color="text-white"
          />
          
          <FeatureCard
            iconSrc="/img/artificial-intelligence.png"
            title="AI Moderation"
            description="Advanced bot detection, hate-speech filtering, and content moderation powered by ML algorithms"
            color="text-white"
          />
          
          <FeatureCard
            iconSrc="/img/services.png"
            title="Mental Wellness"
            description="Smart feed and emotion detection for positive mental health"
            color="text-white"
          />
        </div>
      </div>
    </div>
  );
};

export default Hero;