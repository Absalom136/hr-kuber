import DarkModeToggle from './DarkModeToggle';
import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  FaTasks,
  FaMoneyCheckAlt,
  FaTicketAlt,
  FaProjectDiagram,
} from 'react-icons/fa';

export default function Topbar({
  userName = 'Ella Jones',
  avatarUrl,
  pageTitle = 'Dashboard',
  onToggleSidebar,
  sidebarOpen = true,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const dropdownRef = useRef(null);
  const notifRef = useRef(null);
  const role = localStorage.getItem('role') || 'Employee';

  // Sidebar widths must match Sidebar.jsx classes:
  // w-20 = 5rem, w-64 = 16rem
  const collapsedOffset = '5rem';
  const expandedOffset = '16rem';
  const offset = sidebarOpen ? expandedOffset : collapsedOffset;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  let notifications = [];
  if (role === 'Admin') {
    notifications = [
      { icon: FaUsers, text: 'New employee(s) added' },
      { icon: FaCalendarAlt, text: 'Pending leave approvals' },
      { icon: FaChartLine, text: 'Monthly HR report ready' },
      { icon: FaBriefcase, text: 'Payroll processed' },
      { icon: FaEnvelope, text: 'Admin inbox (2 new)' },
    ];
  } else if (role === 'Employee') {
    notifications = [
      { icon: FaCalendarAlt, text: 'Leave request status updated' },
      { icon: FaTasks, text: 'New task assigned' },
      { icon: FaMoneyCheckAlt, text: 'Payslip available' },
      { icon: FaEnvelope, text: 'Check your email (1 new)' },
    ];
  } else if (role === 'Client') {
    notifications = [
      { icon: FaProjectDiagram, text: 'Project milestone reached' },
      { icon: FaTicketAlt, text: 'New support ticket reply' },
      { icon: FaEnvelope, text: 'Billing statement sent' },
    ];
  }

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

  // Anchor header by left/right instead of margin-left to avoid gaps.
  const headerStyle = {
    left: offset,
    right: '0',
    position: 'sticky',
    top: 0,
    zIndex: 40,
    transition: 'left 200ms ease, right 200ms ease',
    background: undefined, // keep tailwind background classes in DOM
  };

  return (
    <header
      // keep tailwind classes for visuals; style anchors left/right
      className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm"
      style={headerStyle}
    >
      <div className="flex justify-between items-center px-6 py-3">
        {/* Left Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="text-xl text-gray-700 dark:text-white hover:text-accent"
            title="Toggle Sidebar"
            aria-label="Toggle sidebar"
          >
            <FaBars />
          </button>

          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <FaHome className="text-base" />
            <span className="font-medium">Home &gt; {pageTitle}</span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-4 relative">
          <DarkModeToggle />

          <button
            onClick={toggleFullscreen}
            title="Toggle Fullscreen"
            className="text-xl text-gray-700 dark:text-white hover:text-accent"
            aria-label="Toggle fullscreen"
          >
            {fullscreen ? <FaCompress /> : <FaExpand />}
          </button>

          <div ref={notifRef} className="relative">
            <button
              onClick={() => {
                setNotifOpen((prev) => !prev);
                setDropdownOpen(false);
              }}
              className="relative text-xl text-gray-700 dark:text-white hover:text-accent"
              title="Notifications"
              aria-haspopup="true"
              aria-expanded={notifOpen}
            >
              <FaBell />
              <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full px-1">
                {notifications.length}
              </span>
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-12 w-64 bg-white dark:bg-gray-800 rounded shadow-lg z-50" role="menu">
                <div className="p-3 border-b border-gray-200 dark:border-gray-700 font-semibold text-sm">Reminders</div>
                <ul className="text-sm text-gray-700 dark:text-white divide-y divide-gray-200 dark:divide-gray-700">
                  {notifications.map(({ icon: Icon, text }, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                      role="menuitem"
                      tabIndex={0}
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
                setNotifOpen(false);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setDropdownOpen((prev) => !prev);
                  setNotifOpen(false);
                }
              }}
              aria-haspopup="true"
              aria-expanded={dropdownOpen}
            >
              <span className="text-sm font-medium text-gray-800 dark:text-white">{userName}</span>
              <img
                src={avatarUrl}
                onError={(e) => {
                  e.target.src = '/default-avatar.png';
                }}
                alt="User Avatar"
                className="w-10 h-10 rounded-full border-2 border-primary object-cover"
              />
            </div>

            {dropdownOpen && (
              <div className="absolute right-0 top-12 w-56 bg-white dark:bg-gray-800 rounded shadow-lg z-50" role="menu">
                <button
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                  role="menuitem"
                >
                  <FaUserCircle className="w-4 h-4" />
                  Account
                </button>
                <button
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                  role="menuitem"
                >
                  <FaInbox className="w-4 h-4" />
                  Inbox
                </button>
                <button
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                  role="menuitem"
                >
                  <FaCog className="w-4 h-4" />
                  Settings
                </button>
                <Link
                  to="/logout"
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                  role="menuitem"
                >
                  <FaSignOutAlt className="w-4 h-4" />
                  Logout
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}