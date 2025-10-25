import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaUserCircle,
  FaInbox,
  FaCog,
  FaSignOutAlt,
} from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import DarkModeToggle from '../components/DarkModeToggle';
import DashboardCard from '../components/DashboardCard';
import LeavePieChart from '../components/LeavePieChart';
import ApexChart from 'react-apexcharts';

export default function AdminDashboard() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
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
  const [leaveRequests, setLeaveRequests] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');

    const fetchStats = async () => {
      try {
        const res = await fetch('/api/dashboard/admin', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const contentType = res.headers.get('content-type');
        if (res.ok && contentType?.includes('application/json')) {
          const data = await res.json();
          setStats({
            totalEmployees: data.total_employees,
            pendingLeaves: data.pending_leaves,
            activeClients: data.active_clients,
            revenue: data.revenue,
          });
        } else {
          console.error('Invalid admin stats response:', await res.text());
        }
      } catch (err) {
        console.error('Failed to fetch admin stats:', err);
      }
    };

    const fetchLeaveStats = async () => {
      try {
        const res = await fetch('/api/dashboard/admin/leaves', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const contentType = res.headers.get('content-type');
        if (res.ok && contentType?.includes('application/json')) {
          const data = await res.json();
          setLeaveStats({
            approved: data.approved,
            pending: data.pending,
            rejected: data.rejected,
          });
          setLeaveRequests(data.recent_requests || []);
        } else {
          console.error('Invalid leave stats response:', await res.text());
        }
      } catch (err) {
        console.error('Failed to fetch leave stats:', err);
      }
    };

    fetchStats();
    fetchLeaveStats();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white transition-colors duration-300">
      <Sidebar />

      <main className="flex-1 p-6">
        {/* Topbar */}
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <div className="flex items-center gap-4 relative">
            <DarkModeToggle />
            <input
              type="text"
              placeholder="Search..."
              className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-800 dark:text-white"
            />
            <div className="relative">
              <img
                src="https://i.pravatar.cc/40?img=3"
                alt="Admin Avatar"
                className="w-10 h-10 rounded-full border-2 border-primary cursor-pointer"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              />
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded shadow-lg z-50">
                  <button className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                    <FaUserCircle className="w-4 h-4" />
                    Account
                  </button>
                  <button className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                    <FaInbox className="w-4 h-4" />
                    Inbox
                  </button>
                  <button className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                    <FaCog className="w-4 h-4" />
                    Settings
                  </button>
                  <Link
                    to="/logout"
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <FaSignOutAlt className="w-4 h-4" />
                    Logout
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <DashboardCard title="Total Employees" value={stats.totalEmployees} icon="users" gradient="from-blue-500 to-indigo-600" />
          <DashboardCard title="Pending Leaves" value={stats.pendingLeaves} icon="calendar" gradient="from-pink-500 to-purple-600" />
          <DashboardCard title="Active Clients" value={stats.activeClients} icon="briefcase" gradient="from-green-500 to-teal-600" />
          <DashboardCard title="Revenue" value={stats.revenue} icon="chart-line" gradient="from-yellow-500 to-orange-600" />
        </div>

        {/* Charts & Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LeavePieChart data={leaveStats} />
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
            <h2 className="text-lg font-semibold mb-4">Recent Leave Requests</h2>
            <div className="h-64 overflow-y-auto text-sm">
              {leaveRequests.length > 0 ? (
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-xs uppercase text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                      <th className="px-2 py-1">Employee</th>
                      <th className="px-2 py-1">Type</th>
                      <th className="px-2 py-1">Status</th>
                      <th className="px-2 py-1">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaveRequests.map((req, idx) => (
                      <tr key={idx} className="border-b border-gray-100 dark:border-gray-700">
                        <td className="px-2 py-1">{req.employee}</td>
                        <td className="px-2 py-1">{req.type}</td>
                        <td className="px-2 py-1">{req.status}</td>
                        <td className="px-2 py-1">{req.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">No recent requests</div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}