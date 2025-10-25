import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaUserCircle,
  FaInbox,
  FaCog,
  FaSignOutAlt,
} from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import DarkModeToggle from '../components/DarkModeToggle';

export default function EmployeeDashboard() {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white transition-colors duration-300">
      <Sidebar />

      <main className="flex-1 p-6">
        {/* Topbar */}
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Employee Dashboard</h1>
          <div className="flex items-center gap-4 relative">
            <DarkModeToggle />
            <input
              type="text"
              placeholder="Search..."
              className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-800 dark:text-white"
            />
            <div className="relative">
              <img
                src="https://i.pravatar.cc/40?img=7"
                alt="Employee Avatar"
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

        {/* Dashboard Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">Attendance: 92%</div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">Tasks Completed: 34</div>
        </div>

        <div className="col-span-2">
          <h3 className="text-lg font-bold mb-2">My Tasks</h3>
          <table className="table-auto w-full bg-white dark:bg-gray-800 shadow rounded text-sm">
            <thead>
              <tr className="text-left text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-2">Task</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Due</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                <td className="px-4 py-2">Update Profile</td>
                <td className="px-4 py-2">Done</td>
                <td className="px-4 py-2">Oct 20</td>
              </tr>
              <tr>
                <td className="px-4 py-2">Submit Leave</td>
                <td className="px-4 py-2">Pending</td>
                <td className="px-4 py-2">Oct 25</td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}