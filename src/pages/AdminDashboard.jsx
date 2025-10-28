import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import DashboardCard from '../components/DashboardCard';

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Sidebar widths must match your Sidebar w-20 and w-64 classes:
  // w-20 = 5rem (80px), w-64 = 16rem (256px)
  const collapsedOffset = '5rem';
  const expandedOffset = '16rem';
  const offset = sidebarOpen ? expandedOffset : collapsedOffset;

  const userName = localStorage.getItem('username') || 'Abaslam';
  const avatarUrl = localStorage.getItem('avatarUrl') || '';

  // optional: reflow when window resizes or role changes
  useEffect(() => {
    // ensure layout stays consistent if something else toggles sidebar externally
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
      {/* Sidebar (fixed) */}
      <Sidebar collapsed={!sidebarOpen} />

      {/* Inject CSS to override Topbar left offset so it always matches the sidebar state.
          This avoids editing Topbar itself and guarantees Topbar + main content do not get overlapped. */}
      <style>{`
        /* Override Topbar left margin and width to match sidebar width */
        header.sticky {
          margin-left: ${offset} !important;
          width: calc(100% - ${offset}) !important;
          transition: margin-left 200ms ease, width 200ms ease;
        }

        /* Main wrapper padding-left to keep content clear of sidebar */
        .app-main-wrapper {
          margin-left: ${offset};
          transition: margin-left 200ms ease;
        }
      `}</style>

      {/* Main area: Topbar + Content. We apply a left margin equal to the sidebar width. */}
      <div className="app-main-wrapper flex flex-col min-h-screen">
        <Topbar
          userName={userName}
          avatarUrl={avatarUrl}
          pageTitle="Admin Dashboard"
          onToggleSidebar={() => setSidebarOpen((s) => !s)}
        />

        <main className="p-6 overflow-y-auto flex-1">
          <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

          {/* Top metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            <DashboardCard
              title="Pending Leaves"
              value="0"
              icon="calendar"
              gradient="from-indigo-500 to-purple-600"
            />
            <DashboardCard
              title="Active Clients"
              value="0"
              icon="briefcase"
              gradient="from-green-500 to-teal-600"
            />
            <DashboardCard
              title="Revenue"
              value="Loading..."
              icon="chart-line"
              gradient="from-yellow-500 to-orange-600"
            />
            <DashboardCard
              title="Open Tickets"
              value="0"
              icon="users"
              gradient="from-red-500 to-pink-600"
            />
          </div>

          {/* Recent requests / tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
              <h2 className="text-lg font-semibold mb-3">Recent Leave Requests</h2>
              <div className="text-sm text-gray-600 dark:text-gray-400 h-40 flex items-center justify-center">
                No recent requests
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
              <h2 className="text-lg font-semibold mb-3">Summary</h2>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                No leave data available
              </div>
            </div>
          </div>

          {/* Bottom placeholder */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md h-40 flex items-center justify-center text-gray-400 dark:text-gray-500">
              Analytics (Coming Soon)
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md h-40 flex items-center justify-center text-gray-400 dark:text-gray-500">
              Activity Feed (Coming Soon)
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md h-40 flex items-center justify-center text-gray-400 dark:text-gray-500">
              Quick Actions (Coming Soon)
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}