import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import DashboardCard from '../components/DashboardCard';
import LeavePieChart from '../components/LeavePieChart';

export default function EmployeeDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState({
    totalLeaves: 0,
    approvedLeaves: 0,
    pendingLeaves: 0,
    rejectedLeaves: 0,
  });
  const [leaveRequests, setLeaveRequests] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');

    const fetchStats = async () => {
      try {
        const res = await fetch('/api/dashboard/employee', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const contentType = res.headers.get('content-type');
        if (res.ok && contentType?.includes('application/json')) {
          const data = await res.json();
          setStats({
            totalLeaves: data.total_leaves,
            approvedLeaves: data.approved,
            pendingLeaves: data.pending,
            rejectedLeaves: data.rejected,
          });
          setLeaveRequests(data.recent_requests || []);
        } else {
          console.error('Invalid employee stats response:', await res.text());
        }
      } catch (err) {
        console.error('Failed to fetch employee stats:', err);
      }
    };

    fetchStats();
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
          pageTitle="Employee Dashboard"
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="p-6 overflow-y-auto flex-1">
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
            <DashboardCard
              title="Total Leaves"
              value={stats.totalLeaves}
              icon="calendar"
              gradient="from-indigo-500 to-purple-600"
            />
            <DashboardCard
              title="Approved"
              value={stats.approvedLeaves}
              icon="check-circle"
              gradient="from-green-500 to-teal-600"
            />
            <DashboardCard
              title="Pending"
              value={stats.pendingLeaves}
              icon="clock"
              gradient="from-yellow-500 to-orange-600"
            />
            <DashboardCard
              title="Rejected"
              value={stats.rejectedLeaves}
              icon="times-circle"
              gradient="from-red-500 to-pink-600"
            />
          </div>

          {/* Charts & Recent Requests */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LeavePieChart data={stats} />
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
              <h2 className="text-lg font-semibold mb-4">Your Recent Leave Requests</h2>
              <div className="h-64 overflow-y-auto text-sm">
                {leaveRequests.length > 0 ? (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-xs uppercase text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                        <th className="px-2 py-1">Type</th>
                        <th className="px-2 py-1">Status</th>
                        <th className="px-2 py-1">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaveRequests.map((req, idx) => (
                        <tr key={idx} className="border-b border-gray-100 dark:border-gray-700">
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