import React from 'react';
import AnimatedBackground from '../components/common/AnimatedBackground';

const Dashboard = () => {
  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      <div className="relative z-10 container mx-auto px-4 py-8">
        <h1 className="text-4xl font-heading text-center mb-8 neon-text">
          Welcome to QuantumSafe
        </h1>
        <div className="text-center text-gray-400">
          <p>Dashboard coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;