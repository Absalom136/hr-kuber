import { Link, useLocation } from 'react-router-dom';
import {
  FaUserTie,
  FaUsers,
  FaBriefcase,
  FaSignOutAlt,
} from 'react-icons/fa';

export default function Sidebar({ collapsed = false }) {
  const location = useLocation();

  const navItems = [
    { label: 'Admin', path: '/admin/dashboard', icon: FaUserTie },
    { label: 'Employee', path: '/employee/dashboard', icon: FaUsers },
    { label: 'Client', path: '/client/dashboard', icon: FaBriefcase },
    { label: 'Logout', path: '/logout', icon: FaSignOutAlt },
  ];

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <aside
      className={`${
        collapsed ? 'w-20' : 'w-64'
      } bg-primary text-white flex flex-col items-center p-4 shadow-md transition-all duration-300`}
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
      <nav className="flex flex-col gap-4 w-full">
        {navItems.map(({ label, path, icon: Icon }) => (
          <div key={label} className="relative group">
            <Link
              to={path}
              className={`flex items-center ${
                collapsed ? 'justify-center' : 'gap-3 px-3'
              } py-2 rounded-md transition-colors ${
                isActive(path)
                  ? 'bg-white/10 font-semibold'
                  : 'hover:bg-white/10'
              }`}
            >
              <Icon className="text-lg" />
              {!collapsed && <span className="text-sm">{label}</span>}
            </Link>

            {/* Custom Tooltip */}
            {collapsed && (
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 text-xs whitespace-nowrap bg-black text-white rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                {label}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}