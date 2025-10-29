import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import DashboardCard from '../components/DashboardCard';

export default function ClientDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Sidebar widths must match Sidebar.jsx classes:
  // w-20 = 5rem, w-64 = 16rem
  const collapsedOffset = '5rem';
  const expandedOffset = '16rem';
  const offset = sidebarOpen ? expandedOffset : collapsedOffset;

  const userName = localStorage.getItem('username') || 'Ella Jones';
  const avatarUrl = localStorage.getItem('avatarUrl') || '';

  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'sidebarOpen') {
        setSidebarOpen(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white transition-colors duration-300">
      <Sidebar collapsed={!sidebarOpen} />

      <style>{`
        header.sticky {
          margin-left: ${offset} !important;
          width: calc(100% - ${offset}) !important;
          transition: margin-left 200ms ease, width 200ms ease;
        }
        .app-main-wrapper {
          margin-left: ${offset};
          transition: margin-left 200ms ease;
        }
      `}</style>

      <div className="app-main-wrapper flex flex-col min-h-screen">
        <Topbar
          userName={userName}
          avatarUrl={avatarUrl}
          pageTitle="Client Dashboard"
          onToggleSidebar={() => setSidebarOpen((s) => !s)}
        />

        <main className="p-6 overflow-y-auto flex-1">
          <h1 className="text-2xl font-bold mb-6">Welcome, {userName}</h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">
            <DashboardCard
              title="Active Projects"
              value="12"
              icon="briefcase"
              gradient="from-blue-500 to-indigo-600"
            />
            <DashboardCard
              title="Open Tickets"
              value="5"
              icon="calendar"
              gradient="from-pink-500 to-purple-600"
            />
            <DashboardCard
              title="Outstanding Balance"
              value="$3,200"
              icon="chart-line"
              gradient="from-yellow-500 to-orange-600"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md h-64 flex items-center justify-center text-gray-400 dark:text-gray-500">
              Project Timeline (Coming Soon)
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md h-64 flex items-center justify-center text-gray-400 dark:text-gray-500">
              Ticket Analytics (Coming Soon)
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}