// src/components/Sidebar.jsx
import { Link } from 'react-router-dom';
import { FaUserTie, FaUsers, FaBriefcase } from 'react-icons/fa';

export default function Sidebar() {
  return (
    <div className="w-64 bg-primary text-white flex flex-col p-6">
      <h2 className="text-2xl font-bold mb-6">HR Kuber</h2>
      <nav className="flex flex-col gap-4">
        <Link to="/admin/dashboard" className="flex items-center gap-2 hover:text-accent">
          <FaUserTie /> Admin
        </Link>
        <Link to="/employee/dashboard" className="flex items-center gap-2 hover:text-accent">
          <FaUsers /> Employee
        </Link>
        <Link to="/client/dashboard" className="flex items-center gap-2 hover:text-accent">
          <FaBriefcase /> Client
        </Link>
      </nav>
    </div>
  );
}