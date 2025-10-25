📘 HR Kuber – Human Resource Management System

HR Kuber is a modular, enterprise-grade HRMS platform built with React and Python. It provides role-based dashboards for Admins, Employees, and Clients, offering real-time insights into HR operations, leave management, attendance, and project tracking.

---

🚀 Features

- **Role-Based Dashboards**
  - Admin: HR metrics, leave stats, employee/client summaries
  - Employee: Attendance, task tracking, leave requests
  - Client: Project status, invoices, delivery timelines

- **Modular Layout**
  - Shared sidebar with collapsible navigation
  - Topbar with avatar dropdown for Account, Inbox, Settings, Logout
  - Dark mode toggle with persistent theme support

- **Charts & Visuals**
  - Integrated with ApexCharts and Chart.js
  - Pie charts, line graphs, and bar charts for HR analytics

- **Live Data Integration**
  - Fetches real-time stats from `/api/dashboard/...` endpoints
  - Dynamic tables for leave requests, tasks, and projects

- **Responsive Design**
  - Fully mobile-friendly with Tailwind CSS
  - Adaptive layout for all screen sizes

📁 Project Structure
hr-kuber/
├── src/
│   ├── components/
│   │   ├── Sidebar.jsx
│   │   ├── DarkModeToggle.jsx
│   │   ├── DashboardCard.jsx
│   │   ├── LeavePieChart.jsx
│   ├── pages/
│   │   ├── AdminDashboard.jsx
│   │   ├── EmployeeDashboard.jsx
│   │   ├── ClientDashboard.jsx
│   ├── assets/
│   └── App.jsx
├── public/
├── README.md
└── package.json




---

🛠️ Tech Stack

- Frontend: React, Tailwind CSS, ApexCharts, Chart.js  
- Backend: Python (Flask or Django recommended)  
- Routing: React Router  
- Icons: React Icons (FontAwesome)

---

📦 Installation

```bash
# Clone the repo
git clone https://github.com/your-username/hr-kuber.git
cd hr-kuber

# Install dependencies
npm install

# Start the development server
npm run dev

🔐 Authentication & API
- Token-based authentication via localStorage
- API endpoints:
- /api/dashboard/admin
- /api/dashboard/admin/leaves
- /api/dashboard/employee
- /api/dashboard/client


📌 Notes
- Sidebar navigation is role-specific and excludes user actions like Account/Inbox/Settings
- Avatar dropdown handles all user-specific actions
- Logout is available both in sidebar and dropdown for convenience
- All dashboards share consistent layout and styling

📄 License
This project is licensed under the MIT License.
