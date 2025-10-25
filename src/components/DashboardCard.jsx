import { FaUsers, FaCalendarAlt, FaBriefcase, FaChartLine } from 'react-icons/fa';

const iconMap = {
  users: FaUsers,
  calendar: FaCalendarAlt,
  briefcase: FaBriefcase,
  'chart-line': FaChartLine,
};

export default function DashboardCard({ title, value, icon, gradient }) {
  const Icon = iconMap[icon] || FaUsers;

  return (
    <div
      className={`p-6 rounded-xl shadow-lg text-white dark:text-white animate-fade-in bg-gradient-to-r ${gradient}`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium tracking-tight opacity-90">{title}</h3>
        <Icon className="text-2xl text-white/90 dark:text-white" />
      </div>
      <div className="text-2xl font-bold tracking-wide">{value}</div>
    </div>
  );
}