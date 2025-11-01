// src/routes.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/AdminDashboard';
import ClientDashboard from './pages/ClientDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminEmployees from './pages/AdminEmployees';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';

export default function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <Layout>
                <AdminDashboard />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <PrivateRoute>
              <Layout>
                <AdminUsers />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/employees"
          element={
            <PrivateRoute>
              <Layout>
                <AdminEmployees />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/client"
          element={
            <PrivateRoute>
              <Layout>
                <ClientDashboard />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/employee"
          element={
            <PrivateRoute>
              <Layout>
                <EmployeeDashboard />
              </Layout>
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}