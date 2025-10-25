// E:\Projects\Python\hr-kuber\src\pages\AdminDashboard.jsx

import { useEffect, useState } from 'react';
import DarkModeToggle from '../components/DarkModeToggle';
import DashboardCard from '../components/DashboardCard';
import LeavePieChart from '../components/LeavePieChart';

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    pendingLeaves: 0,
    activeClients: 0,
    revenue: 'Loading...',
  });
  const [leaveStats, setLeaveStats] = useState({
    approved: 0,
    pending: 0,
    rejected: 0,
  });

  useEffect(() => {
    const token = localStorage.getItem('token');

    fetch('/api/dashboard/admin', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setStats({
          totalEmployees: data.total_employees,
          pendingLeaves: data.pending_leaves,
          activeClients: data.active_clients,
          revenue: data.revenue,
        });
      })
      .catch(err => console.error('Failed to fetch admin stats:', err));

    fetch('/api/dashboard/admin/leaves', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setLeaveStats({
          approved: data.approved,
          pending: data.pending,
          rejected: data.rejected,
        });
      })
      .catch(err => console.error('Failed to fetch leave stats:', err));
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      <DarkModeToggle />

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 shadow-lg z-40 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-6 text-xl font-bold text-primary dark:text-white">HR Kuber</div>
        <nav className="mt-6 space-y-2 px-4 text-gray-700 dark:text-white">
          {['Dashboard', 'Manage Employees', 'Manage Clients', 'Leave Requests', 'Reports', 'Settings'].map((item) => (
            <a key={item} href="#" className="block px-4 py-2 rounded hover:bg-primary hover:text-white transition">
              {item}
            </a>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="md:ml-64 p-6">
        {/* Topbar */}
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Search..."
              className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-800 dark:text-white"
            />
            <img
              src="https://i.pravatar.cc/40?img=3"
              alt="Admin Avatar"
              className="w-10 h-10 rounded-full border-2 border-primary"
            />
          </div>
        </header>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <DashboardCard title="Total Employees" value={stats.totalEmployees} icon="users" gradient="admin-gradient" />
          <DashboardCard title="Pending Leaves" value={stats.pendingLeaves} icon="calendar" gradient="admin-gradient" />
          <DashboardCard title="Active Clients" value={stats.activeClients} icon="briefcase" gradient="admin-gradient" />
          <DashboardCard title="Revenue" value={stats.revenue} icon="chart-line" gradient="admin-gradient" />
        </div>

        {/* Charts & Tables */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LeavePieChart data={leaveStats} />
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Recent Leave Requests</h2>
            <div className="h-64 flex items-center justify-center text-gray-400 dark:text-gray-500">[Table Placeholder]</div>
          </div>
        </div>
      </div>
    </div>
  );
}