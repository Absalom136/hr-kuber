import DarkModeToggle from './DarkModeToggle';
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  FaBars,
  FaBell,
  FaEnvelope,
  FaUserCircle,
  FaInbox,
  FaCog,
  FaSignOutAlt,
  FaHome,
  FaExpand,
  FaCompress,
  FaUsers,
  FaCalendarAlt,
  FaChartLine,
  FaBriefcase,
} from 'react-icons/fa';

export default function Topbar({ userName = 'Ella Jones', avatarUrl, pageTitle = 'Dashboard', onToggleSidebar }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  const notifications = [
    { icon: FaEnvelope, text: 'Please check your mail (3 new)' },
    { icon: FaUsers, text: 'New employee(s) added' },
    { icon: FaCalendarAlt, text: 'Pending Leave' },
    { icon: FaChartLine, text: 'Employee Report' },
    { icon: FaBriefcase, text: 'Salary credited' },
  ];

  // ✅ Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        notifRef.current &&
        !notifRef.current.contains(e.target)
      ) {
        setDropdownOpen(false);
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex justify-between items-center shadow-sm">
      {/* Left Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="text-xl text-gray-700 dark:text-white hover:text-accent"
          title="Toggle Sidebar"
        >
          <FaBars />
        </button>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <FaHome className="text-base" />
          <span className="font-medium">
            Home &gt; {pageTitle}
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4 relative">
        <DarkModeToggle />

        <button
          onClick={toggleFullscreen}
          title="Toggle Fullscreen"
          className="text-xl text-gray-700 dark:text-white hover:text-accent"
        >
          {fullscreen ? <FaCompress /> : <FaExpand />}
        </button>

        <div ref={notifRef} className="relative">
          <button
            onClick={() => {
            setNotifOpen((prev) => !prev);
            setDropdownOpen(false); // ✅ close profile dropdown
            }}
            className="relative text-xl text-gray-700 dark:text-white hover:text-accent"
            title="Notifications"
          >
            <FaBell />
            <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full px-1">
              3
            </span>
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-12 w-64 bg-white dark:bg-gray-800 rounded shadow-lg z-50">
              <div className="p-3 border-b border-gray-200 dark:border-gray-700 font-semibold text-sm">
                Reminders
              </div>
              <ul className="text-sm text-gray-700 dark:text-white divide-y divide-gray-200 dark:divide-gray-700">
                {notifications.map(({ icon: Icon, text }, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Icon className="text-base" />
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div ref={dropdownRef} className="relative">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => {
            setDropdownOpen((prev) => !prev);
            setNotifOpen(false); // ✅ close notification dropdown
            }}
          >
            <img
              src={avatarUrl}
              onError={(e) => { e.target.src = '/default-avatar.png'; }}
              alt="User Avatar"
              className="w-10 h-10 rounded-full border-2 border-primary object-cover"
            />
            <span className="text-sm font-medium text-gray-800 dark:text-white">
              {userName}
            </span>
          </div>

          {dropdownOpen && (
            <div className="absolute right-0 top-12 w-56 bg-white dark:bg-gray-800 rounded shadow-lg z-50">
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
  );
}