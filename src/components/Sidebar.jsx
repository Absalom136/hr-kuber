import { Link, useLocation } from 'react-router-dom';
import {
  FaUserTie,
  FaUsers,
  FaBriefcase,
  FaSignOutAlt,
  FaMoneyCheckAlt,
  FaCalendarCheck,
  FaClipboardList,
  FaTasks,
  FaEnvelope,
  FaProjectDiagram,
  FaTicketAlt,
  FaFileAlt,
} from 'react-icons/fa';

function getSidebarItems(role) {
  switch (role) {
    case 'Admin':
      return [
        { label: 'Dashboard', path: '/admin/dashboard', icon: FaUserTie },
        { label: 'Payroll', path: '/admin/payroll', icon: FaMoneyCheckAlt },
        { label: 'Leave', path: '/admin/leaves', icon: FaCalendarCheck },
        { label: 'Attendance', path: '/admin/attendance', icon: FaClipboardList },
        { label: 'Clients', path: '/admin/clients', icon: FaUsers },
        { label: 'Projects', path: '/admin/projects', icon: FaProjectDiagram },
        { label: 'Reports', path: '/admin/reports', icon: FaFileAlt },
        { label: 'Logout', path: '/logout', icon: FaSignOutAlt },
      ];
    case 'Employee':
      return [
        { label: 'Dashboard', path: '/employee/dashboard', icon: FaUsers },
        { label: 'Payslip', path: '/employee/payslip', icon: FaMoneyCheckAlt },
        { label: 'My Leaves', path: '/employee/leaves', icon: FaCalendarCheck },
        { label: 'Attendance', path: '/employee/attendance', icon: FaClipboardList },
        { label: 'My Tasks', path: '/employee/tasks', icon: FaTasks },
        { label: 'Email', path: '/employee/email', icon: FaEnvelope },
        { label: 'Logout', path: '/logout', icon: FaSignOutAlt },
      ];
    case 'Client':
      return [
        { label: 'Dashboard', path: '/client/dashboard', icon: FaBriefcase },
        { label: 'Projects', path: '/client/projects', icon: FaProjectDiagram },
        { label: 'Tickets', path: '/client/supports/tickets', icon: FaTicketAlt },
        { label: 'Billing', path: '/client/billing', icon: FaMoneyCheckAlt },
        { label: 'Logout', path: '/logout', icon: FaSignOutAlt },
      ];
    default:
      return [];
  }
}

export default function Sidebar({ collapsed = false }) {
  const location = useLocation();
  const role = localStorage.getItem('role') || 'Employee';
  const navItems = getSidebarItems(role);

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <aside
      className={`${
        collapsed ? 'w-20' : 'w-64'
      } bg-primary text-white fixed top-0 left-0 h-screen flex flex-col items-center p-4 shadow-md transition-all duration-300 z-40`}
    >
      {/* Logo or Title */}
      <div className="mb-8 w-full text-center">
        {collapsed ? (
          <span className="text-xl font-bold tracking-tight">HK</span>
        ) : (
          <h2 className="text-2xl font-bold tracking-tight">HR Kuber</h2>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-4 w-full overflow-y-auto">
        {navItems.map(({ label, path, icon: Icon }) => (
          <div
            key={label}
            className="relative group"
            tabIndex={0}
            aria-label={label}
            title={label}
          >
            <Link
              to={path}
              className={`flex items-center ${
                collapsed ? 'justify-center' : 'gap-3 px-3'
              } py-2 rounded-md transition-colors ${
                isActive(path) ? 'bg-white/10 font-semibold' : 'hover:bg-white/10'
              }`}
            >
              <Icon className="text-lg" />
              {!collapsed && <span className="text-sm">{label}</span>}
            </Link>

            {/* Tooltip on collapse */}
            {collapsed && (
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 text-xs whitespace-nowrap bg-black text-white rounded shadow-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 z-50">
                {label}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}