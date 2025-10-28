import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import DashboardCard from '../components/DashboardCard';

export default function ClientDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [clientStats, setClientStats] = useState({
    activeProjects: 0,
    invoicesDue: '$0',
    supportTickets: 0,
    serviceUptime: 'Loading...',
  });
  const [projectStatus, setProjectStatus] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');

    const fetchClientStats = async () => {
      try {
        const res = await fetch('/api/dashboard/client', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const contentType = res.headers.get('content-type');
        if (res.ok && contentType?.includes('application/json')) {
          const data = await res.json();
          setClientStats({
            activeProjects: data.active_projects,
            invoicesDue: data.invoices_due,
            supportTickets: data.support_tickets,
            serviceUptime: data.service_uptime,
          });
          setProjectStatus(data.project_status || []);
        } else {
          console.error('Invalid client stats response:', await res.text());
        }
      } catch (err) {
        console.error('Failed to fetch client stats:', err);
      }
    };

    fetchClientStats();
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
          pageTitle="Client Dashboard"
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="p-6 overflow-y-auto flex-1">
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
            <DashboardCard
              title="Active Projects"
              value={clientStats.activeProjects}
              icon="folder-open"
              gradient="from-blue-500 to-indigo-600"
            />
            <DashboardCard
              title="Invoices Due"
              value={clientStats.invoicesDue}
              icon="file-invoice-dollar"
              gradient="from-pink-500 to-purple-600"
            />
            <DashboardCard
              title="Support Tickets"
              value={clientStats.supportTickets}
              icon="life-ring"
              gradient="from-green-500 to-teal-600"
            />
            <DashboardCard
              title="Service Uptime"
              value={clientStats.serviceUptime}
              icon="server"
              gradient="from-yellow-500 to-orange-600"
            />
          </div>

          {/* Project Status Table */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
            <h2 className="text-lg font-semibold mb-4">Project Status</h2>
            <div className="overflow-x-auto text-sm">
              {projectStatus.length > 0 ? (
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-xs uppercase text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                      <th className="px-4 py-2">Project</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">Deadline</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectStatus.map((proj, idx) => (
                      <tr key={idx} className="border-b border-gray-100 dark:border-gray-700">
                        <td className="px-4 py-2">{proj.name}</td>
                        <td className="px-4 py-2">{proj.status}</td>
                        <td className="px-4 py-2">{proj.deadline}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-gray-400 dark:text-gray-500 py-6 text-center">
                  No active projects found
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}