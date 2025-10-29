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

  const userName = localStorage.getItem('username') || 'Cara Stevens';
  const avatarUrl = localStorage.getItem('avatarUrl') || '/default-avatar.png';
  const userRoleLabel = localStorage.getItem('userRoleLabel') || role;

  return (
    <aside
      className={`${
        collapsed ? 'w-20' : 'w-64'
      } bg-primary text-white fixed top-0 left-0 h-screen flex flex-col items-center p-4 shadow-md transition-all duration-300 z-40`}
      aria-label="Sidebar"
    >
      {/* Logo / Title */}
      <div className="mb-4 w-full flex items-center justify-center">
        {collapsed ? (
          <span className="text-xl font-bold tracking-tight">HK</span>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white font-bold">K</div>
            <h2 className="text-2xl font-bold tracking-tight">HR Kuber</h2>
          </div>
        )}
      </div>

      {/* User area */}
      <div className="w-full mb-6 flex items-center justify-center">
        {collapsed ? (
          <div className="relative group">
            {/* small circular avatar for collapsed state */}
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center border-2 border-white shadow-sm">
              <img
                src={avatarUrl}
                alt={`${userName} avatar`}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/default-avatar.png';
                }}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Tooltip with username and role when collapsed */}
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-2 text-xs whitespace-nowrap bg-black text-white rounded shadow-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 scale-95 group-hover:scale-100 transform transition-all duration-150 z-50">
              <div className="font-semibold leading-tight">{userName}</div>
              <div className="text-xs text-white/80 leading-tight">{userRoleLabel}</div>
            </div>
          </div>
        ) : (
          <Link
            to="/profile"
            className="flex flex-col items-center gap-2 px-2 py-2 rounded-md hover:bg-white/10 transition-colors w-full"
            aria-label="View profile"
          >
            {/* Reduced width, increased height rounded-rectangle avatar */}
            <div className="w-32 h-28 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center border-2 border-white shadow">
              <img
                src={avatarUrl}
                alt={`${userName} avatar`}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/default-avatar.png';
                }}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Username below image */}
            <div className="flex flex-col items-center text-center w-full">
              <span className="text-sm font-semibold leading-tight truncate">{userName}</span>
              <span className="text-xs text-white/80 leading-tight truncate">{userRoleLabel}</span>
            </div>
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-4 w-full overflow-y-auto">
        {navItems.map(({ label, path, icon: Icon }) => (
          <div key={label} className="relative group" tabIndex={0} aria-label={label} title={label}>
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

      {/* Spacer then optional footer / quick actions */}
      <div className="mt-auto w-full">
        <div className="pt-4">{/* Footer area (kept minimal) */}</div>
      </div>
    </aside>
  );
}