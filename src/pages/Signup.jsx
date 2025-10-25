import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Listbox } from '@headlessui/react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DarkModeToggle from '../components/DarkModeToggle';
import { FaUserShield, FaUserTie, FaUser, FaEye, FaEyeSlash } from 'react-icons/fa';

export default function Signup() {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Employee',
  });
  const [avatar, setAvatar] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('username', form.username);
      formData.append('email', form.email);
      formData.append('password', form.password);
      formData.append('confirm_password', form.confirmPassword); // ✅ required by backend
      formData.append('role', form.role);
      if (avatar) formData.append('avatar', avatar);

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/register/`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Signup successful!');
        localStorage.setItem('token', data.token || '');
        localStorage.setItem('role', data.role || form.role);
        setTimeout(() => {
          navigate(`/${(data.role || form.role).toLowerCase()}/dashboard`);
        }, 1500);
      } else {
        toast.error(data.detail || data.message || 'Signup failed');
      }
    } catch (err) {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { label: 'Admin', value: 'Admin', icon: <FaUserShield /> },
    { label: 'Employee', value: 'Employee', icon: <FaUserTie /> },
    { label: 'Client', value: 'Client', icon: <FaUser /> },
  ];

  const getStrength = (password) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const strengthLabels = ['Too Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];

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
      <DarkModeToggle />
      <ToastContainer position="top-center" theme="dark" />

      <form
        onSubmit={handleSubmit}
        className="bg-white/20 dark:bg-white/10 backdrop-blur-lg p-8 rounded-xl shadow-xl w-full max-w-md text-white"
      >
        <h2 className="text-2xl font-bold mb-6 text-center dark:text-white">
          Create Account
        </h2>

        {/* Avatar Upload */}
        <div className="mb-6 text-center">
          {avatar ? (
            <img
              src={URL.createObjectURL(avatar)}
              alt="Preview"
              className="mx-auto w-20 h-20 rounded-full object-cover border-2 border-white shadow-md"
            />
          ) : (
            <div className="mx-auto w-20 h-20 rounded-full bg-white/10 border-2 border-white shadow-md flex items-center justify-center text-white/70">
              Upload
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setAvatar(e.target.files[0])}
            className="mt-2 text-sm text-white/80"
          />
        </div>

        <input
          name="username"
          placeholder="Username"
          onChange={handleChange}
          required
          className="w-full mb-4 px-4 py-2 rounded bg-white/10 border border-white/30 placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-300 dark:border-white/20 dark:bg-white/5 dark:placeholder-white/60"
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          onChange={handleChange}
          required
          className="w-full mb-4 px-4 py-2 rounded bg-white/10 border border-white/30 placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-300 dark:border-white/20 dark:bg-white/5 dark:placeholder-white/60"
        />

        {/* Password Field */}
        <div className="relative mb-2">
          <input
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            onChange={handleChange}
            required
            className="w-full px-4 py-2 rounded bg-white/10 border border-white/30 placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-300 dark:border-white/20 dark:bg-white/5 dark:placeholder-white/60"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-2 text-white/70"
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>

        {/* Password Strength Meter */}
        <div className="mb-4">
          <div className={`h-2 rounded ${strengthColors[getStrength(form.password)]}`}></div>
          <p className="text-sm mt-1 text-white/70">
            Strength: {strengthLabels[getStrength(form.password)]}
          </p>
        </div>

        {/* Confirm Password Field */}
        <div className="relative mb-6">
          <input
            name="confirmPassword"
            type={showConfirm ? 'text' : 'password'}
            placeholder="Repeat Password"
            onChange={handleChange}
            required
            className={`w-full px-4 py-2 rounded bg-white/10 border ${
              form.confirmPassword && form.password !== form.confirmPassword
                ? 'border-red-500'
                : 'border-white/30'
            } placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-purple-300 dark:border-white/20 dark:bg-white/5 dark:placeholder-white/60`}
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-2 text-white/70"
          >
            {showConfirm ? <FaEyeSlash /> : <FaEye />}
          </button>
          {form.confirmPassword && form.password !== form.confirmPassword && (
            <p className="text-sm text-red-300 mt-1">Passwords do not match</p>
          )}
        </div>

                {/* Role Dropdown */}
        <div className="mb-6">
          <label className="block mb-2 text-sm font-medium text-white dark:text-white">
            Select Role
          </label>
          <Listbox value={form.role} onChange={(val) => setForm({ ...form, role: val })}>
            {({ open }) => (
              <>
                <Listbox.Button className="w-full px-4 py-2 rounded bg-white text-gray-800 dark:bg-gray-700 dark:text-white border border-white/30 dark:border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-300 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    {roleOptions.find((r) => r.value === form.role)?.icon}
                    {form.role}
                  </span>
                </Listbox.Button>
                {open && (
                  <Listbox.Options className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 rounded shadow-lg">
                    {roleOptions.map((role) => (
                      <Listbox.Option
                        key={role.value}
                        value={role.value}
                        className="px-4 py-2 cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-700 flex items-center gap-2 text-gray-800 dark:text-white"
                      >
                        {role.icon}
                        {role.label}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                )}
              </>
            )}
          </Listbox>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 rounded-full font-semibold transition-all ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg hover:scale-105'
          }`}
        >
          {loading ? 'Signing up...' : 'Sign Up'}
        </button>

        <div className="mt-6 text-center text-sm text-white/80 dark:text-white/70">
          Already have an account?{' '}
          <Link to="/login" className="text-white hover:underline">
            Log in
          </Link>
        </div>
      </form>
    </div>
  );
}