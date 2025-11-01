// E:\Projects\Python\hr-kuber\src\pages\AdminEmployees.jsx
import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const emptyForm = {
  firstName: '',
  secondName: '',
  surname: '',
  idNumber: '',
  dateOfBirth: '',
  gender: 'Male',
  phone: '',
  email: '',
  physicalAddress: '',
  payrollNumber: '',
  dateOfHire: '', // default to today
  avatarUrl: '', // data URL stored for preview; actual File stored separately in state
  department: '',
  updatedOn: '', // auto
};

const DEPARTMENTS = ['HR', 'Finance', 'IT', 'Environment', 'Sales', 'Operations'];

// Use the environment variable name you placed in .env
const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export default function AdminEmployees() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const collapsed = !sidebarOpen;

  const [form, setForm] = useState(emptyForm);
  const [avatarFile, setAvatarFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  const avatarFromStorage = useMemo(() => localStorage.getItem('avatarUrl') || '', []);

  useEffect(() => {
    const today = new Date();
    const isoDate = today.toISOString().slice(0, 10);
    setForm((f) => ({
      ...f,
      dateOfHire: f.dateOfHire || isoDate,
      updatedOn: new Date().toISOString(),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // update updatedOn whenever relevant fields change
  useEffect(() => {
    setForm((f) => ({ ...f, updatedOn: new Date().toISOString() }));
  }, [
    form.firstName,
    form.secondName,
    form.surname,
    form.idNumber,
    form.dateOfBirth,
    form.gender,
    form.phone,
    form.email,
    form.physicalAddress,
    form.payrollNumber,
    form.dateOfHire,
    form.avatarUrl,
    form.department,
  ]);

  const userName = localStorage.getItem('username') || 'Absalom';

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'First Name is required';
    if (!form.surname.trim()) e.surname = 'Surname is required';
    if (!form.idNumber.trim()) e.idNumber = 'ID Number is required';
    if (!form.dateOfBirth) e.dateOfBirth = 'Date of Birth is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Email is invalid';
    if (!form.phone.trim()) e.phone = 'Phone is required';
    if (!form.department.trim()) e.department = 'Department is required';
    return e;
  };

  const handleChange = (field) => (e) => {
    const value = e?.target?.value ?? e;
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((errs) => ({ ...errs, [field]: undefined }));
  };

  // handle file input: store File and set data URL for preview
  const handleAvatarFile = (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setForm((f) => ({ ...f, avatarUrl: dataUrl }));
      setAvatarFile(file);
    };
    reader.readAsDataURL(file);
  };

  const buildUrl = (path) => {
    if (!API_BASE) return path; // relative path (use proxy or same origin)
    return `${API_BASE.replace(/\/$/, '')}${path}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSavedMessage('');
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSubmitting(true);

    const meta = {
      firstName: form.firstName,
      secondName: form.secondName,
      surname: form.surname,
      idNumber: form.idNumber,
      dateOfBirth: form.dateOfBirth,
      gender: form.gender,
      phone: form.phone,
      email: form.email,
      physicalAddress: form.physicalAddress,
      payrollNumber: form.payrollNumber,
      dateOfHire: form.dateOfHire,
      department: form.department,
      updatedOn: new Date().toISOString(),
    };

    try {
      const url = buildUrl('/api/admin/employees');
      console.log('Submitting to:', url, 'with avatarFile:', !!avatarFile);

      let res;

      if (avatarFile) {
        const fd = new FormData();
        Object.entries(meta).forEach(([k, v]) => fd.append(k, v ?? ''));
        fd.append('avatar', avatarFile, avatarFile.name || `avatar-${Date.now()}.png`);

        res = await fetch(url, {
          method: 'POST',
          body: fd,
        });
      } else {
        const payload = { ...meta, avatarUrl: form.avatarUrl || '' };
        res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const text = await res.text();
      let result;
      try {
        result = text ? JSON.parse(text) : null;
      } catch {
        result = text;
      }

      console.log('Response status:', res.status, 'body:', result);

      if (res.ok) {
        setSavedMessage('Employee added successfully');
        setForm(emptyForm);
        setAvatarFile(null);
        const isoDate = new Date().toISOString().slice(0, 10);
        setForm((f) => ({ ...f, dateOfHire: isoDate, updatedOn: new Date().toISOString() }));
      } else if (res.status === 404) {
        setSavedMessage('Failed to save employee (server error 404). Confirm backend route /api/admin/employees exists and VITE_API_BASE_URL is correct.');
      } else {
        setSavedMessage(`Failed to save employee (server error ${res.status})`);
      }
    } catch (err) {
      console.error('Network/client error while saving:', err);
      const payload = { ...meta, avatarUrl: form.avatarUrl || '' };
      const saved = JSON.parse(localStorage.getItem('local_employees') || '[]');
      saved.push(payload);
      localStorage.setItem('local_employees', JSON.stringify(saved));
      setSavedMessage('Network error: saved locally for demo');
    } finally {
      setSubmitting(false);
      setForm((f) => ({ ...f, updatedOn: new Date().toISOString() }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white">
      <Sidebar collapsed={collapsed} />
      <style>{`
        header.sticky {
          left: ${collapsed ? '5rem' : '16rem'} !important;
          right: 0 !important;
          width: calc(100% - ${collapsed ? '5rem' : '16rem'}) !important;
        }
        .app-main-wrapper { left: ${collapsed ? '5rem' : '16rem'}; transition: left 200ms ease; }
      `}</style>

      <div className="app-main-wrapper relative min-h-screen">
        <Topbar
          userName={userName}
          avatarUrl={avatarFromStorage}
          pageTitle="Employees"
          onToggleSidebar={() => setSidebarOpen((s) => !s)}
          sidebarOpen={!collapsed}
        />

        <main className="p-6 overflow-y-auto">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Add New Employee</h1>

            <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
              {/* Name row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">First Name</label>
                  <input value={form.firstName} onChange={handleChange('firstName')} className="w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-gray-900" />
                  {errors.firstName && <div className="text-xs text-red-400 mt-1">{errors.firstName}</div>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Second Name</label>
                  <input value={form.secondName} onChange={handleChange('secondName')} className="w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-gray-900" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Surname</label>
                  <input value={form.surname} onChange={handleChange('surname')} className="w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-gray-900" />
                  {errors.surname && <div className="text-xs text-red-400 mt-1">{errors.surname}</div>}
                </div>
              </div>

              {/* ID, DOB, Gender (radio only) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium mb-1">ID Number</label>
                  <input value={form.idNumber} onChange={handleChange('idNumber')} className="w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-gray-900" />
                  {errors.idNumber && <div className="text-xs text-red-400 mt-1">{errors.idNumber}</div>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Date of Birth</label>
                  <input type="date" value={form.dateOfBirth} onChange={handleChange('dateOfBirth')} className="w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-gray-900" />
                  {errors.dateOfBirth && <div className="text-xs text-red-400 mt-1">{errors.dateOfBirth}</div>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Gender</label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="radio" name="gender" value="Male" checked={form.gender === 'Male'} onChange={handleChange('gender')} />
                      Male
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="radio" name="gender" value="Female" checked={form.gender === 'Female'} onChange={handleChange('gender')} />
                      Female
                    </label>
                  </div>
                </div>
              </div>

              {/* Contact and Address */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input value={form.phone} onChange={handleChange('phone')} className="w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-gray-900" />
                  {errors.phone && <div className="text-xs text-red-400 mt-1">{errors.phone}</div>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Email Address</label>
                  <input type="email" value={form.email} onChange={handleChange('email')} className="w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-gray-900" />
                  {errors.email && <div className="text-xs text-red-400 mt-1">{errors.email}</div>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Physical Address</label>
                <input value={form.physicalAddress} onChange={handleChange('physicalAddress')} className="w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-gray-900" />
              </div>

              {/* Payroll, Hire Date, Avatar, Department */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium mb-1">Payroll Number</label>
                  <input value={form.payrollNumber} onChange={handleChange('payrollNumber')} className="w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-gray-900" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Date Of Hire</label>
                  <input type="date" value={form.dateOfHire} onChange={handleChange('dateOfHire')} className="w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-gray-900" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Avatar</label>
                  <div className="flex items-start gap-3">
                    <label className="inline-block text-sm px-3 py-2 bg-white/10 rounded cursor-pointer hover:bg-white/20">
                      Add Avatar
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarFile}
                        className="hidden"
                        aria-label="Add avatar from computer"
                      />
                    </label>

                    {form.avatarUrl && (
                      <div className="w-14 h-14 rounded-md overflow-hidden border bg-gray-50">
                        <img src={form.avatarUrl} alt="selected avatar preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Department</label>
                <select value={form.department} onChange={handleChange('department')} className="w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-gray-900">
                  <option value="">Select department</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                {errors.department && <div className="text-xs text-red-400 mt-1">{errors.department}</div>}
              </div>

              {/* Updated On (read only) */}
              <div>
                <label className="block text-sm font-medium mb-1">Updated On</label>
                <input readOnly value={form.updatedOn ? new Date(form.updatedOn).toLocaleString() : ''} className="w-full rounded-md border px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800" />
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-green-600">{savedMessage}</div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setForm(emptyForm);
                      setAvatarFile(null);
                    }}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded"
                  >
                    Reset
                  </button>
                  <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary text-white rounded">
                    {submitting ? 'Saving...' : 'Save Employee'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}