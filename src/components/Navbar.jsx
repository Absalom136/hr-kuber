// src/components/Navbar.jsx
import { FaUserCircle, FaEnvelope, FaCog, FaSignOutAlt } from 'react-icons/fa';

export default function Navbar() {
  return (
    <div className="bg-white shadow px-6 py-4 flex justify-between items-center">
      <h1 className="text-xl font-bold text-gray-700">HR Kuber</h1>
      <div className="relative group">
        <img
          src="/profile.jpg"
          alt="Profile"
          className="w-10 h-10 rounded-full cursor-pointer"
        />
        <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg hidden group-hover:block z-10">
          <a href="#" className="flex items-center px-4 py-2 hover:bg-gray-100">
            <FaUserCircle className="mr-2" /> Account
          </a>
          <a href="#" className="flex items-center px-4 py-2 hover:bg-gray-100">
            <FaEnvelope className="mr-2" /> Inbox
          </a>
          <a href="#" className="flex items-center px-4 py-2 hover:bg-gray-100">
            <FaCog className="mr-2" /> Settings
          </a>
          <a href="#" className="flex items-center px-4 py-2 hover:bg-gray-100">
            <FaSignOutAlt className="mr-2" /> Logout
          </a>
        </div>
      </div>
    </div>
  );
}