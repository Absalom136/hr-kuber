import { useEffect, useRef, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

function buildUrl(path) {
  if (!API_BASE) return path;
  return `${API_BASE.replace(/\/$/, '')}${path}`;
}

function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : '';
}

function toDateInputValue(value) {
  if (!value) return '';
  try {
    return new Date(value).toISOString().slice(0, 10);
  } catch (err) {
    return String(value).slice(0, 10);
  }
}

const initialForm = {
  first_name: '',
  last_name: '',
  email: '',
  id_number: '',
  date_of_birth: '',
  gender: '',
  phone: '',
  physical_address: '',
  payroll_number: '',
  department: '',
  position: '',
  hire_date: '',
};

const defaultDepartmentsMap = {
  HR: 1,
  Finance: 2,
  IT: 3,
  Environment: 4,
  Sales: 5,
  Operations: 6,
};

export default function EmployeeBio() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const collapsedOffset = '5rem';
  const expandedOffset = '16rem';
  const offset = sidebarOpen ? expandedOffset : collapsedOffset;

  const [form, setForm] = useState(initialForm);
  const [departments, setDepartments] = useState([]);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const avatarObjectUrlRef = useRef(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const storageHandler = (e) => {
      if (e.key === 'sidebarOpen') {
        setSidebarOpen(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', storageHandler);
    return () => window.removeEventListener('storage', storageHandler);
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchDepartments();
  }, []);

  useEffect(() => () => {
    if (avatarObjectUrlRef.current) {
      URL.revokeObjectURL(avatarObjectUrlRef.current);
      avatarObjectUrlRef.current = null;
    }
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(buildUrl('/api/employee/profile/'), {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed to load profile (${res.status})`);
      }

      const data = await res.json();
      setForm({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || '',
        id_number: data.id_number ?? data.profile?.id_number ?? '',
        date_of_birth: toDateInputValue(data.date_of_birth ?? data.profile?.date_of_birth ?? ''),
        gender: data.gender ?? data.profile?.gender ?? '',
        phone: data.phone ?? data.profile?.phone ?? '',
        physical_address: data.physical_address ?? data.profile?.physical_address ?? '',
        payroll_number: data.payroll_number ?? data.profile?.payroll_number ?? '',
        department: data.department ?? data.profile?.department ?? '',
        position: data.position ?? data.profile?.position ?? '',
        hire_date: toDateInputValue(data.hire_date ?? data.profile?.hire_date ?? ''),
      });
      if (avatarObjectUrlRef.current) {
        URL.revokeObjectURL(avatarObjectUrlRef.current);
        avatarObjectUrlRef.current = null;
      }
      setAvatarFile(null);
      setRemoveAvatar(false);
      setAvatarPreview(data.avatar_url || '');

      const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim();
      if (fullName) {
        localStorage.setItem('username', fullName);
      }
      if (data.role) {
        localStorage.setItem('userRoleLabel', data.role);
      }
      if (data.avatar_url) {
        localStorage.setItem('avatarUrl', data.avatar_url);
      }
    } catch (err) {
      console.error('Failed to load employee profile', err);
      setError(err.message || 'Unable to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch(buildUrl('/api/departments/'), {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      });
      if (!res.ok) return;
      const data = await res.json();
      const list = Array.isArray(data) ? data : data?.results || [];
      setDepartments(list);
    } catch (err) {
      console.warn('Failed to load departments', err);
    }
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (avatarObjectUrlRef.current) {
      URL.revokeObjectURL(avatarObjectUrlRef.current);
      avatarObjectUrlRef.current = null;
    }
    const previewUrl = URL.createObjectURL(file);
    avatarObjectUrlRef.current = previewUrl;
    setAvatarFile(file);
    setAvatarPreview(previewUrl);
    setRemoveAvatar(false);
  };

  const handleRemoveAvatar = () => {
    if (avatarObjectUrlRef.current) {
      URL.revokeObjectURL(avatarObjectUrlRef.current);
      avatarObjectUrlRef.current = null;
    }
    setAvatarFile(null);
    setAvatarPreview('');
    setRemoveAvatar(true);
  };

  const resetMessages = () => {
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    resetMessages();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('first_name', form.first_name);
      formData.append('last_name', form.last_name);
      formData.append('email', form.email);
      formData.append('id_number', form.id_number ?? '');
      formData.append('gender', form.gender ?? '');
      formData.append('phone', form.phone ?? '');
      formData.append('physical_address', form.physical_address ?? '');
      formData.append('payroll_number', form.payroll_number ?? '');
      formData.append('position', form.position ?? '');

      if (form.date_of_birth) {
        formData.append('date_of_birth', form.date_of_birth);
      } else {
        formData.append('date_of_birth', '');
      }
      if (form.hire_date) {
        formData.append('hire_date', form.hire_date);
      } else {
        formData.append('hire_date', '');
      }

      if (form.department) {
        formData.append('department', String(form.department));
      } else {
        formData.append('remove_department', 'true');
      }

      if (avatarFile) {
        formData.append('avatar', avatarFile);
      } else if (removeAvatar) {
        formData.append('remove_avatar', 'true');
      }

      const res = await fetch(buildUrl('/api/employee/profile/'), {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'X-CSRFToken': getCookie('csrftoken') || getCookie('csrfToken'),
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed to update profile (${res.status})`);
      }

      const data = await res.json();
      setSuccess('Profile updated successfully.');
      setRemoveAvatar(false);
      setAvatarFile(null);
      if (avatarObjectUrlRef.current) {
        URL.revokeObjectURL(avatarObjectUrlRef.current);
        avatarObjectUrlRef.current = null;
      }
      setAvatarPreview(data.avatar_url || '');

      const updatedForm = {
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || '',
        id_number: data.id_number ?? data.profile?.id_number ?? '',
        date_of_birth: toDateInputValue(data.date_of_birth ?? data.profile?.date_of_birth ?? ''),
        gender: data.gender ?? data.profile?.gender ?? '',
        phone: data.phone ?? data.profile?.phone ?? '',
        physical_address: data.physical_address ?? data.profile?.physical_address ?? '',
        payroll_number: data.payroll_number ?? data.profile?.payroll_number ?? '',
        department: data.department ?? data.profile?.department ?? '',
        position: data.position ?? data.profile?.position ?? '',
        hire_date: toDateInputValue(data.hire_date ?? data.profile?.hire_date ?? ''),
      };
      setForm(updatedForm);

      const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim();
      if (fullName) {
        localStorage.setItem('username', fullName);
      }
      if (data.role) {
        localStorage.setItem('userRoleLabel', data.role);
      }
      if (data.avatar_url) {
        localStorage.setItem('avatarUrl', data.avatar_url);
      } else if (removeAvatar) {
        localStorage.removeItem('avatarUrl');
      }
    } catch (err) {
      console.error('Failed to update profile', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const displayName = (() => {
    const fullName = `${form.first_name || ''} ${form.last_name || ''}`.trim();
    if (fullName) return fullName;
    return localStorage.getItem('username') || 'Employee';
  })();

  const topbarAvatar = avatarPreview || localStorage.getItem('avatarUrl') || '/default-avatar.png';

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white transition-colors duration-300">
      <Sidebar collapsed={!sidebarOpen} />

      <style>{`
        header.sticky {
          margin-left: ${offset} !important;
          width: calc(100% - ${offset}) !important;
          transition: margin-left 200ms ease, width 200ms ease;
        }
        .app-main-wrapper {
          margin-left: ${offset};
          transition: margin-left 200ms ease;
        }
      `}</style>

      <div className="app-main-wrapper flex flex-col min-h-screen">
        <Topbar
          userName={displayName}
          avatarUrl={topbarAvatar}
          pageTitle="My Bio"
          onToggleSidebar={() => setSidebarOpen((s) => !s)}
        />

        <main className="p-6 overflow-y-auto flex-1">
          <div className="max-w-4xl mx-auto space-y-6">
            {error && (
              <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-md" role="alert">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-100 border border-green-200 text-green-700 px-4 py-3 rounded-md" role="status">
                {success}
              </div>
            )}

            <section className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
              <header className="mb-6">
                <h1 className="text-2xl font-semibold">Personal Information</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Update your contact details and employment information.</p>
              </header>

              {loading ? (
                <div className="text-gray-500 dark:text-gray-400">Loading profile...</div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-32 h-32 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                        {avatarPreview ? (
                          <img src={avatarPreview} alt="Current avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl font-semibold bg-primary/10 text-primary">
                            {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
                          </div>
                        )}
                      </div>
                      <div className="mt-4 flex flex-col sm:flex-row gap-3">
                        <label className="inline-flex items-center justify-center px-4 py-2 bg-primary text-white text-sm rounded cursor-pointer hover:bg-primary/90">
                          Change Avatar
                          <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                        </label>
                        {(avatarPreview || removeAvatar) && (
                          <button
                            type="button"
                            onClick={handleRemoveAvatar}
                            className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Upload a square image (PNG or JPG) under 2MB.</p>
                    </div>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="text-sm">
                        First Name
                        <input
                          type="text"
                          value={form.first_name}
                          onChange={(e) => handleChange('first_name', e.target.value)}
                          className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                          required
                        />
                      </label>
                      <label className="text-sm">
                        Last Name
                        <input
                          type="text"
                          value={form.last_name}
                          onChange={(e) => handleChange('last_name', e.target.value)}
                          className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                          required
                        />
                      </label>
                      <label className="text-sm md:col-span-2">
                        Email
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => handleChange('email', e.target.value)}
                          className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                          required
                        />
                      </label>
                      <label className="text-sm">
                        Phone Number
                        <input
                          type="tel"
                          value={form.phone}
                          onChange={(e) => handleChange('phone', e.target.value)}
                          className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                        />
                      </label>
                      <label className="text-sm">
                        Gender
                        <select
                          value={form.gender}
                          onChange={(e) => handleChange('gender', e.target.value)}
                          className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                        >
                          <option value="">Select gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </label>
                      <label className="text-sm">
                        Date of Birth
                        <input
                          type="date"
                          value={form.date_of_birth}
                          onChange={(e) => handleChange('date_of_birth', e.target.value)}
                          className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                        />
                      </label>
                      <label className="text-sm">
                        ID Number
                        <input
                          type="text"
                          value={form.id_number}
                          onChange={(e) => handleChange('id_number', e.target.value)}
                          className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="text-sm">
                      Department
                      <select
                        value={form.department ?? ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          handleChange('department', value === '' ? '' : Number(value));
                        }}
                        className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                      >
                        <option value="">Select department</option>
                        {departments.length > 0
                          ? departments.map((dept) => (
                              <option key={dept.id} value={dept.id}>
                                {dept.name}
                              </option>
                            ))
                          : Object.keys(defaultDepartmentsMap).map((name) => (
                              <option key={name} value={defaultDepartmentsMap[name]}>
                                {name}
                              </option>
                            ))}
                      </select>
                    </label>
                    <label className="text-sm">
                      Position / Title
                      <input
                        type="text"
                        value={form.position}
                        onChange={(e) => handleChange('position', e.target.value)}
                        className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                      />
                    </label>
                    <label className="text-sm">
                      Hire Date
                      <input
                        type="date"
                        value={form.hire_date}
                        onChange={(e) => handleChange('hire_date', e.target.value)}
                        className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                      />
                    </label>
                    <label className="text-sm">
                      Payroll Number
                      <input
                        type="text"
                        value={form.payroll_number}
                        onChange={(e) => handleChange('payroll_number', e.target.value)}
                        className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                      />
                    </label>
                  </div>

                  <label className="text-sm block">
                    Physical Address
                    <textarea
                      rows={3}
                      value={form.physical_address}
                      onChange={(e) => handleChange('physical_address', e.target.value)}
                      className="mt-1 w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                    />
                  </label>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setForm(initialForm);
                        fetchProfile();
                      }}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                      disabled={saving}
                    >
                      Reset
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-60"
                      disabled={saving}
                    >
                      {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

