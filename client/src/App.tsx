import React from 'react';

function App() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center p-8 bg-surface rounded-xl shadow-lg border border-border max-w-md">
        <h1 className="text-3xl font-extrabold text-primary mb-2">TalentPulse.ai</h1>
        <p className="text-secondary font-medium">AI-Powered Placement Intelligence Platform</p>
        <div className="mt-6 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    </div>
  );
}

export default App;
