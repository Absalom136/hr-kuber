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
import AdminEmployees from './pages/AdminEmployees';
import AdminUsers from './pages/AdminUsers';
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
          path="/admin/employees"
          element={
            <PrivateRoute allowedRoles={['Admin']}>
              <AdminEmployees />
            </PrivateRoute>
          }
        />

        {/* Admin Users list / detail / edit */}
        <Route
          path="/admin/users"
          element={
            <PrivateRoute allowedRoles={['Admin']}>
              <AdminUsers />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/users/edit/:id"
          element={
            <PrivateRoute allowedRoles={['Admin']}>
              {/* reuse AdminUsers edit page later or create a separate EditUser page */}
              <AdminUsers />
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