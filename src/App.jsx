// E:\Projects\Python\hr-kuber\src\App.jsx

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import ClientDashboard from './pages/ClientDashboard';
import PrivateRoute from './components/PrivateRoute';

export default function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Role-Based Protected Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <PrivateRoute allowedRoles={['Admin']}>
              <AdminDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/employee/dashboard"
          element={
            <PrivateRoute allowedRoles={['Employee']}>
              <EmployeeDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/client/dashboard"
          element={
            <PrivateRoute allowedRoles={['Client']}>
              <ClientDashboard />
            </PrivateRoute>
          }
        />

        {/* Catch-all Redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}