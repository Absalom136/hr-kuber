import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEdit, FaTrash, FaSearch, FaPrint } from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

function buildUrl(path) {
  if (!API_BASE) return path;
  return `${API_BASE.replace(/\/$/, '')}${path}`;
}

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

export default function AdminUsers() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const collapsed = !sidebarOpen;
  const collapsedOffset = '5rem';
  const expandedOffset = '16rem';
  const offset = sidebarOpen ? expandedOffset : collapsedOffset;

  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [viewUser, setViewUser] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [saving, setSaving] = useState(false);

  const viewPrintRef = useRef(null);
  const didFetch = useRef(false);
  const navigate = useNavigate();
  const userName = localStorage.getItem('username') || 'Admin';
  const avatarFromStorage = localStorage.getItem('avatarUrl') || '/default-avatar.png';

  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;
    fetchUsers();
    const onStorage = (e) => {
      if (e.key === 'sidebarOpen') setSidebarOpen(e.newValue === 'true');
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      setFiltered(users);
      return;
    }
    setFiltered(
      users.filter((u) => {
        const name = `${u.first_name ?? u.firstName ?? ''} ${u.last_name ?? u.lastName ?? ''}`.toLowerCase();
        return (
          name.includes(q) ||
          (u.email || '').toLowerCase().includes(q) ||
          (u.role || '').toLowerCase().includes(q) ||
          (u.username || '').toLowerCase().includes(q)
        );
      })
    );
  }, [query, users]);

  const getCsrf = () => getCookie('csrftoken') || getCookie('csrfToken') || '';

  const fetchUsers = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const url = buildUrl('/api/admin/users/');
      const res = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRFToken': getCsrf(),
        },
      });

      const txt = await res.text();
      if (res.status === 401 || res.status === 403) {
        setErrorMsg('Unauthorized. Check your session or token.');
        setUsers([]);
        setFiltered([]);
        setLoading(false);
        return;
      }

      let data = null;
      try {
        data = txt ? JSON.parse(txt) : null;
      } catch (err) {
        console.warn('Failed to parse JSON response for users. Raw text returned.', err);
        data = txt;
      }

      const list = Array.isArray(data) ? data : data?.results ?? [];
      if (!Array.isArray(list)) {
        console.warn('Unexpected users response shape — using empty list.', data);
        setUsers([]);
        setFiltered([]);
      } else {
        setUsers(list);
        setFiltered(list);
      }
    } catch (err) {
      console.error('Fetch users error', err);
      setErrorMsg('Network error while loading users');
      setUsers([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (!selectAll) {
      const ids = new Set(filtered.map((u) => u.id));
      setSelectedIds(ids);
      setSelectAll(true);
    } else {
      setSelectedIds(new Set());
      setSelectAll(false);
    }
  };

  const toggleSelectOne = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
    setSelectAll(next.size === filtered.length && filtered.length > 0);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this user? This action cannot be undone.')) return;
    try {
      const url = buildUrl(`/api/admin/users/${id}/`);
      const res = await fetch(url, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'X-CSRFToken': getCsrf(),
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== id));
        setFiltered((prev) => prev.filter((u) => u.id !== id));
        const next = new Set(selectedIds);
        next.delete(id);
        setSelectedIds(next);
      } else {
        const text = await res.text();
        console.error('Delete failed', res.status, text);
        alert(`Failed to delete user (${res.status})`);
      }
    } catch (err) {
      console.error('Delete error', err);
      alert('Network error while deleting user');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return alert('No users selected');
    if (!confirm(`Delete ${selectedIds.size} selected users?`)) return;
    try {
      const url = buildUrl('/api/admin/users/bulk-delete/');
      const res = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrf(),
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });

      if (res.ok) {
        setUsers((prev) => prev.filter((u) => !selectedIds.has(u.id)));
        setFiltered((prev) => prev.filter((u) => !selectedIds.has(u.id)));
        setSelectedIds(new Set());
        setSelectAll(false);
      } else if (res.status === 404) {
        for (const id of Array.from(selectedIds)) {
          // eslint-disable-next-line no-await-in-loop
          await fetch(buildUrl(`/api/admin/users/${id}/`), {
            method: 'DELETE',
            credentials: 'include',
            headers: { 'X-CSRFToken': getCsrf(), 'X-Requested-With': 'XMLHttpRequest' },
          });
        }
        setUsers((prev) => prev.filter((u) => !selectedIds.has(u.id)));
        setFiltered((prev) => prev.filter((u) => !selectedIds.has(u.id)));
        setSelectedIds(new Set());
        setSelectAll(false);
      } else {
        const text = await res.text();
        console.error('Bulk delete failed', res.status, text);
        alert(`Bulk delete failed (${res.status})`);
      }
    } catch (err) {
      console.error('Bulk delete error', err);
      alert('Network error during bulk delete');
    }
  };

  const openView = (user) => setViewUser(user);
  const closeView = () => setViewUser(null);

  // Edit handlers
  const openEdit = (user) => {
    setEditUser({
      id: user.id,
      username: user.username || '',
      first_name: user.first_name ?? user.firstName ?? '',
      last_name: user.last_name ?? user.lastName ?? '',
      email: user.email || '',
      role: user.role || '',
      avatar_url: user.avatar_url || user.avatarUrl || '',
      id_number: user.id_number || user.idNumber || '',
      dob: user.date_of_birth || user.dob || '',
      gender: user.gender || '',
      phone: user.phone || user.phone_number || '',
      physical_address: user.physical_address || user.address || '',
      payroll_number: user.payroll_number || user.payrollNumber || '',
      department: user.department || '',
      updated_on: new Date().toISOString(),
    });
  };

  const closeEdit = () => setEditUser(null);

  const handleEditChange = (field, value) => {
    setEditUser((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      const url = buildUrl(`/api/admin/users/${editUser.id}/`);
      const body = {
        username: editUser.username,
        first_name: editUser.first_name,
        last_name: editUser.last_name,
        email: editUser.email,
        role: editUser.role,
        id_number: editUser.id_number,
        date_of_birth: editUser.dob,
        gender: editUser.gender,
        phone: editUser.phone,
        physical_address: editUser.physical_address,
        payroll_number: editUser.payroll_number,
        department: editUser.department,
        updated_on: editUser.updated_on,
      };

      const res = await fetch(url, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrf(),
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const updated = await res.json().catch(() => null);
        setUsers((prev) => prev.map((u) => (u.id === editUser.id ? { ...u, ...updated } : u)));
        setFiltered((prev) => prev.map((u) => (u.id === editUser.id ? { ...u, ...updated } : u)));
        closeEdit();
      } else {
        const text = await res.text();
        console.error('Edit save failed', res.status, text);
        alert(`Failed to save changes (${res.status})`);
      }
    } catch (err) {
      console.error('Save edit error', err);
      alert('Network error while saving changes');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    if (!viewPrintRef.current) return;
    // Grab the modal content HTML and inline styles
    const content = viewPrintRef.current.innerHTML;
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((node) => node.outerHTML)
      .join('\n');

    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) return alert('Unable to open print window — check popup blocker');

    printWindow.document.open();
    printWindow.document.write(`
      <html>
        <head>
          <title>User details</title>
          ${styles}
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial; padding: 20px; color: #111827; }
            .user-print-container { max-width: 800px; margin: 0 auto; }
            img { max-width: 120px; border-radius: 50%; }
            .meta { margin-top: 8px; }
            .row { margin: 6px 0; }
            .label { font-weight: 600; color: #374151; }
            .value { margin-left: 6px; color: #111827; }
          </style>
        </head>
        <body>
          <div class="user-print-container">
            ${content}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    // Wait for content to render before printing
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      // keep the window open so user can confirm; comment out next line if you want it closed automatically
      printWindow.close();
    }, 250);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white transition-colors duration-300">
      <Sidebar collapsed={collapsed} />

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

      <div className="app-main-wrapper relative min-h-screen">
        <Topbar
          userName={userName}
          avatarUrl={avatarFromStorage}
          pageTitle="Users"
          onToggleSidebar={() => setSidebarOpen((s) => !s)}
        />

        <main className="p-6 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            <header className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold">Users</h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">Admins and Employees registered on the platform</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by name, email, or role"
                    className="pl-10 pr-4 py-2 rounded-md border w-72 text-sm bg-white dark:bg-gray-800"
                    aria-label="Search users"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <FaSearch />
                  </div>
                </div>

                <button onClick={fetchUsers} className="px-3 py-2 bg-primary text-white rounded">Refresh</button>
                <button onClick={handleBulkDelete} className="px-3 py-2 bg-red-600 text-white rounded">Delete Selected</button>
              </div>
            </header>

            <section className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
              <table className="min-w-full table-auto">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr className="text-left text-sm text-gray-600 dark:text-gray-200">
                    <th className="px-4 py-3">
                      <input type="checkbox" checked={selectAll} onChange={toggleSelectAll} aria-label="Select all users" />
                    </th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>

                <tbody className="text-sm">
                  {loading && (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-gray-500">Loading users...</td>
                    </tr>
                  )}

                  {!loading && (!filtered || filtered.length === 0) && (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-gray-500">{errorMsg || 'No users found'}</td>
                    </tr>
                  )}

                  {!loading &&
                    filtered.map((u) => {
                      const fullName = `${u.first_name ?? u.firstName ?? ''} ${u.last_name ?? u.lastName ?? ''}`.trim() || u.username || '—';
                      const avatar = u.avatar_url || u.avatarUrl || '/default-avatar.png';
                      const roleLabel = u.role ?? u.user_role ?? 'Employee';
                      const date = u.date_joined || u.date_joined_at || u.created_at || u.created || u.signup_date || '';
                      const formattedDate = date ? new Date(date).toLocaleString() : '';

                      return (
                        <tr key={u.id} className="border-t last:border-b">
                          <td className="px-4 py-3">
                            <input type="checkbox" checked={selectedIds.has(u.id)} onChange={() => toggleSelectOne(u.id)} aria-label={`Select user ${fullName}`} />
                          </td>
                          <td className="px-4 py-3 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden border bg-gray-100">
                              <img
                                src={avatar}
                                alt={`${fullName} avatar`}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.onerror = null; e.target.src = '/default-avatar.png'; }}
                              />
                            </div>
                            <div>
                              <div className="font-semibold">{fullName}</div>
                              <div className="text-xs text-gray-500">{u.username || `ID: ${u.id}`}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3">{roleLabel}</td>
                          <td className="px-4 py-3">{u.email}</td>
                          <td className="px-4 py-3">{formattedDate}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button title="View" onClick={() => openView(u)} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                                <FaEye />
                              </button>
                              <button title="Edit" onClick={() => openEdit(u)} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                                <FaEdit />
                              </button>
                              <button title="Delete" onClick={() => handleDelete(u.id)} className="p-2 rounded hover:bg-red-50 dark:hover:bg-red-700 text-red-600">
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </section>
          </div>
        </main>

        {/* View modal (wider + scrollable) */}
        {viewUser && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full shadow-lg">
              <div className="p-6 max-h-[80vh] overflow-auto" ref={viewPrintRef}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {`${(viewUser.first_name ?? viewUser.firstName ?? '').trim()} ${(viewUser.last_name ?? viewUser.lastName ?? '').trim()}`.trim() ||
                        viewUser.username ||
                        'User details'}
                    </h3>
                    <div className="text-sm text-gray-500 dark:text-gray-400">User details</div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button onClick={handlePrint} title="Print" className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded flex items-center gap-2">
                      <FaPrint /> Print
                    </button>
                    <button onClick={closeView} className="text-gray-600 dark:text-gray-300">Close</button>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="w-28 h-28 rounded-full overflow-hidden border flex-shrink-0">
                    <img
                      src={viewUser.avatar_url || viewUser.avatarUrl || '/default-avatar.png'}
                      alt="avatar"
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.onerror = null; e.target.src = '/default-avatar.png'; }}
                    />
                  </div>

                  <div className="flex-1">
                    <div className="font-semibold text-lg">
                      {`${(viewUser.first_name ?? viewUser.firstName ?? '')} ${(viewUser.last_name ?? viewUser.lastName ?? '')}`.trim() || viewUser.username}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">{viewUser.email}</div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-300">
                      <div>Role: <span className="font-medium text-gray-800 dark:text-white">{viewUser.role ?? 'Employee'}</span></div>
                      <div>Joined: <span className="font-medium text-gray-800 dark:text-white">{viewUser.date_joined ? new Date(viewUser.date_joined).toLocaleString() : ''}</span></div>
                      <div>ID Number: <span className="font-medium text-gray-800 dark:text-white">{viewUser.id_number || viewUser.idNumber || '—'}</span></div>
                      <div>Phone: <span className="font-medium text-gray-800 dark:text-white">{viewUser.phone || viewUser.phone_number || '—'}</span></div>
                      <div>Department: <span className="font-medium text-gray-800 dark:text-white">{viewUser.department || '—'}</span></div>
                      <div>Payroll #: <span className="font-medium text-gray-800 dark:text-white">{viewUser.payroll_number || '—'}</span></div>
                      <div className="col-span-2 mt-2">Address: <div className="font-medium text-gray-800 dark:text-white">{viewUser.physical_address || '—'}</div></div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                  <button onClick={() => { closeView(); openEdit(viewUser); }} className="px-4 py-2 bg-primary text-white rounded">Edit</button>
                  <button onClick={() => { closeView(); handleDelete(viewUser.id); }} className="px-4 py-2 bg-red-600 text-white rounded">Delete</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit modal (wider + scrollable) */}
        {editUser && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full shadow-lg">
              <div className="p-6 max-h-[85vh] overflow-auto">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold">Edit user</h3>
                  <button onClick={closeEdit} className="text-gray-600 dark:text-gray-300">Close</button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleEditChange('updated_on', new Date().toISOString());
                    handleSaveEdit();
                  }}
                >
                  <div className="grid grid-cols-1 gap-3">
                    <label className="text-sm">
                      Username
                      <input
                        className="w-full mt-1 p-2 border rounded bg-white dark:bg-gray-700"
                        value={editUser.username}
                        onChange={(e) => handleEditChange('username', e.target.value)}
                        required
                      />
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                      <label className="text-sm">
                        First name
                        <input
                          className="w-full mt-1 p-2 border rounded bg-white dark:bg-gray-700"
                          value={editUser.first_name}
                          onChange={(e) => handleEditChange('first_name', e.target.value)}
                        />
                      </label>

                      <label className="text-sm">
                        Last name
                        <input
                          className="w-full mt-1 p-2 border rounded bg-white dark:bg-gray-700"
                          value={editUser.last_name}
                          onChange={(e) => handleEditChange('last_name', e.target.value)}
                        />
                      </label>
                    </div>

                    <label className="text-sm">
                      Email
                      <input
                        type="email"
                        className="w-full mt-1 p-2 border rounded bg-white dark:bg-gray-700"
                        value={editUser.email}
                        onChange={(e) => handleEditChange('email', e.target.value)}
                        required
                      />
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                      <label className="text-sm">
                        ID Number
                        <input
                          className="w-full mt-1 p-2 border rounded bg-white dark:bg-gray-700"
                          value={editUser.id_number}
                          onChange={(e) => handleEditChange('id_number', e.target.value)}
                        />
                      </label>

                      <label className="text-sm">
                        Date of Birth
                        <input
                          type="date"
                          className="w-full mt-1 p-2 border rounded bg-white dark:bg-gray-700"
                          value={editUser.dob || ''}
                          onChange={(e) => handleEditChange('dob', e.target.value)}
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-3 items-end">
                      <label className="text-sm">
                        Phone
                        <input
                          className="w-full mt-1 p-2 border rounded bg-white dark:bg-gray-700"
                          value={editUser.phone}
                          onChange={(e) => handleEditChange('phone', e.target.value)}
                        />
                      </label>

                      <label className="text-sm">
                        Payroll Number
                        <input
                          className="w-full mt-1 p-2 border rounded bg-white dark:bg-gray-700"
                          value={editUser.payroll_number}
                          onChange={(e) => handleEditChange('payroll_number', e.target.value)}
                        />
                      </label>
                    </div>

                    <label className="text-sm">
                      Physical Address
                      <textarea
                        rows={3}
                        className="w-full mt-1 p-2 border rounded bg-white dark:bg-gray-700"
                        value={editUser.physical_address}
                        onChange={(e) => handleEditChange('physical_address', e.target.value)}
                      />
                    </label>

                    <label className="text-sm">
                      Department
                      <select
                        className="w-full mt-1 p-2 border rounded bg-white dark:bg-gray-700"
                        value={editUser.department}
                        onChange={(e) => handleEditChange('department', e.target.value)}
                      >
                        <option value="">Select department</option>
                        <option value="HR">HR</option>
                        <option value="Finance">Finance</option>
                        <option value="IT">IT</option>
                        <option value="Environment">Environment</option>
                        <option value="Sales">Sales</option>
                        <option value="Operations">Operations</option>
                      </select>
                    </label>

                    <div className="text-sm">
                      <div className="mb-2">Gender</div>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2">
                          <input type="radio" name="gender" value="Male" checked={editUser.gender === 'Male'} onChange={(e) => handleEditChange('gender', e.target.value)} />
                          Male
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="radio" name="gender" value="Female" checked={editUser.gender === 'Female'} onChange={(e) => handleEditChange('gender', e.target.value)} />
                          Female
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="radio" name="gender" value="Other" checked={editUser.gender === 'Other'} onChange={(e) => handleEditChange('gender', e.target.value)} />
                          Other
                        </label>
                      </div>
                    </div>

                    <label className="text-sm">
                      Role
                      <select
                        className="w-full mt-1 p-2 border rounded bg-white dark:bg-gray-700"
                        value={editUser.role}
                        onChange={(e) => handleEditChange('role', e.target.value)}
                      >
                        <option value="">Select role</option>
                        <option value="Admin">Admin</option>
                        <option value="Employee">Employee</option>
                        <option value="Client">Client</option>
                      </select>
                    </label>

                    <label className="text-sm">
                      Updated On
                      <input
                        type="text"
                        readOnly
                        className="w-full mt-1 p-2 border rounded bg-white dark:bg-gray-700 text-sm"
                        value={editUser.updated_on ? new Date(editUser.updated_on).toLocaleString() : new Date().toLocaleString()}
                      />
                    </label>
                  </div>

                  <div className="mt-6 flex justify-end gap-2">
                    <button type="button" onClick={closeEdit} className="px-4 py-2 border rounded">Cancel</button>
                    <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-white rounded">
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}