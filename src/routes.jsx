import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';

export default function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        {/* other routes */}
      </Routes>
    </Router>
  );
}