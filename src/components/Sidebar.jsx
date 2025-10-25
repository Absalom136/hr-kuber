// src/components/Sidebar.jsx

import { Link, useLocation } from 'react-router-dom';
import {
  FaUserTie,
  FaUsers,
  FaBriefcase,
  FaSignOutAlt,
} from 'react-icons/fa';

export default function Sidebar() {
  const location = useLocation();

  const navItems = [
    { label: 'Admin', path: '/admin/dashboard', icon: FaUserTie },
    { label: 'Employee', path: '/employee/dashboard', icon: FaUsers },
    { label: 'Client', path: '/client/dashboard', icon: FaBriefcase },
    { label: 'Logout', path: '/logout', icon: FaSignOutAlt },
  ];

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div className="w-64 bg-primary text-white flex flex-col p-6">
      <h2 className="text-2xl font-bold mb-6">HR Kuber</h2>

      <nav className="flex flex-col gap-4">
        {navItems.map(({ label, path, icon: Icon }) => (
          <Link
            key={label}
            to={path}
            className={`flex items-center gap-2 px-2 py-1 rounded ${
              isActive(path) ? 'bg-white/10 font-semibold' : ''
            } hover:text-accent`}
          >
            <Icon /> {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}