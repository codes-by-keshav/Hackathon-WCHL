import React from 'react';
import AnimatedBackground from '../components/common/AnimatedBackground';
import MatrixCursor from '../components/common/MatrixCursor';
import Hero from '../components/homepage/Hero';
import UserDashboard from '../components/homepage/UserDashboard';

const Homepage = ({ authState }) => {
  console.log('🏠 Homepage render - Auth state:', authState);
  
  return (
    <div className="relative min-h-screen overflow-hidden">
      <AnimatedBackground />
      <MatrixCursor />
      <main className="relative z-10">
        {authState?.isAuthenticated ? (
          <UserDashboard user={authState.user} />
        ) : (
          <Hero />
        )}
      </main>
    </div>
  );
};

export default Homepage;