// E:\Projects\Python\hr-kuber\src\components\DashboardCard.jsx

import { FaUsers, FaCalendar, FaBriefcase, FaChartLine } from 'react-icons/fa';

const iconMap = {
  users: FaUsers,
  calendar: FaCalendar,
  briefcase: FaBriefcase,
  'chart-line': FaChartLine,
};

export default function DashboardCard({ title, value, icon, gradient }) {
  const Icon = iconMap[icon] || FaUsers;

  return (
    <div className={`p-6 rounded-xl shadow-lg text-white animate-fade-in bg-${gradient}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium tracking-tight">{title}</h3>
        <Icon className="text-xl opacity-80" />
      </div>
      <div className="text-2xl font-bold tracking-wide">{value}</div>
    </div>
  );
}