import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import DashboardCard from '../components/DashboardCard';
import LeavePieChart from '../components/LeavePieChart';

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
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

  const userName = localStorage.getItem('username') || 'Ella Jones';
  const avatarUrl = localStorage.getItem('avatarUrl') || '';

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white transition-colors duration-300">
      <Sidebar collapsed={!sidebarOpen} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          userName={userName}
          avatarUrl={avatarUrl}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="p-6 overflow-y-auto flex-1">
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
            <DashboardCard
              title="Total Employees"
              value={stats.totalEmployees}
              icon="users"
              gradient="from-blue-500 to-indigo-600"
            />
            <DashboardCard
              title="Pending Leaves"
              value={stats.pendingLeaves}
              icon="calendar"
              gradient="from-pink-500 to-purple-600"
            />
            <DashboardCard
              title="Active Clients"
              value={stats.activeClients}
              icon="briefcase"
              gradient="from-green-500 to-teal-600"
            />
            <DashboardCard
              title="Revenue"
              value={stats.revenue}
              icon="chart-line"
              gradient="from-yellow-500 to-orange-600"
            />
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
                  <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
                    No recent requests
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}