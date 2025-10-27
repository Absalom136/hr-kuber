import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PasswordInput from '../components/PasswordInput';
import SocialLogin from '../components/SocialLogin';
import DarkModeToggle from '../components/DarkModeToggle';

export default function Login() {
  const [role, setRole] = useState('Admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError('');
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password, role }),
      });

      const data = await res.json();
      console.log('Login response:', data);
      console.log('res.ok:', res.ok);

      if (res.ok) {
        const resolvedRole = (data.role || role || '').toLowerCase();
        console.log('Redirecting to:', `/${resolvedRole}/dashboard`);

        localStorage.setItem('token', data.access || data.token || '');
        localStorage.setItem('role', data.role || role);
        localStorage.setItem('username', data.username || email);
        localStorage.setItem(
        'avatarUrl',
        data.avatar?.startsWith('http')
          ? data.avatar
          : `${import.meta.env.VITE_API_BASE_URL}${data.avatar || ''}`
      );

        navigate(`/${resolvedRole}/dashboard`);
      } else {
        setError(data.detail || data.message || 'Invalid credentials.');
      }
    } catch (err) {
      setError('Unable to connect. Please check your network.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-500"
      style={{
        backgroundImage:
          "linear-gradient(to bottom right, rgba(79, 70, 229, 0.85), rgba(168, 85, 247, 0.85)), url('https://colorlib.com/etc/regform/colorlib-regform-1/images/bg-01.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundBlendMode: 'overlay',
      }}
    >
      <DarkModeToggle fixed />

      <div className="bg-white/20 dark:bg-white/10 p-8 rounded-2xl shadow-2xl w-full max-w-md backdrop-blur-lg animate-fade-in transform transition-all duration-500 hover:shadow-3xl hover:scale-[1.01]">
        {/* Role Tabs */}
        <div className="flex justify-center mb-6 space-x-4">
          {['Admin', 'Employee', 'Client'].map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                role === r
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gradient-to-r hover:from-indigo-100 hover:to-purple-100 dark:bg-gray-700 dark:text-white dark:hover:from-indigo-600 dark:hover:to-purple-600'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <h2 className="text-2xl font-bold mb-6 text-center text-white drop-shadow dark:text-white">
          Welcome to{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 to-purple-300 dark:from-indigo-300 dark:to-purple-400">
            HR Kuber
          </span>
        </h2>

        {error && (
          <div className="mb-4 text-red-300 text-sm text-center">{error}</div>
        )}

        {/* Email / Username */}
        <input
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 mb-4 border border-white/30 bg-white/10 text-white placeholder-white/70 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-300 dark:border-white/20 dark:bg-white/5 dark:placeholder-white/60"
          placeholder="Username or Email"
          autoComplete="username"
        />

        {/* Password */}
        <PasswordInput
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* Remember Me + Forgot Password */}
        <div className="flex justify-between items-center mt-4 text-sm text-white/80 dark:text-white/70">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="form-checkbox text-purple-500" />
            Remember me
          </label>
          <a href="#" className="hover:text-white hover:underline">
            Forgot password?
          </a>
        </div>

        {/* Login Button */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className={`w-full py-2 mt-6 rounded-full font-semibold transition-all duration-300 transform ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg hover:from-indigo-600 hover:to-purple-700 hover:scale-105 hover:shadow-xl'
          }`}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

        {/* Social Login */}
        <div className="mt-6">
          <SocialLogin />
        </div>

        {/* Sign Up Prompt */}
        <div className="mt-6 text-center text-sm text-white/80 dark:text-white/70">
          Don’t have an account?{' '}
          <Link to="/signup" className="text-white hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}