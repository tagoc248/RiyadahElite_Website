import { useEffect } from 'react';

const Dashboard = () => {
  useEffect(() => {
    document.title = 'Dashboard | Riyadah Elite';
  }, []);

  return (
    <div className="min-h-screen py-32 bg-background">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold mb-6">
          <span className="gradient-text">Dashboard</span>
        </h1>
        <p className="text-neutral-300">
          User dashboard is under development. Check back soon to manage your profile and activities.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;