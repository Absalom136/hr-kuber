import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEye, FaEdit, FaTrash, FaSearch } from 'react-icons/fa';
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
  const collapsedOffset = '5rem'; // matches Sidebar w-20
  const expandedOffset = '16rem'; // matches Sidebar w-64
  const offset = sidebarOpen ? expandedOffset : collapsedOffset;

  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [viewUser, setViewUser] = useState(null);

  const didFetch = useRef(false);
  const navigate = useNavigate();
  const userName = localStorage.getItem('username') || 'Admin';
  const avatarFromStorage = localStorage.getItem('avatarUrl') || '/default-avatar.png';

  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;
    fetchUsers();
    // listen to external sidebar toggle if other components toggle it
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

  const getCsrf = () => getCookie('csrftoken') || '';

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
      // Attempt a backend bulk-delete endpoint; fallback to client-side loop if absent
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
        // bulk endpoint not present — delete one by one
        for (const id of Array.from(selectedIds)) {
          // eslint-disable-next-line no-await-in-loop
          await handleDelete(id);
        }
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

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white transition-colors duration-300">
      <Sidebar collapsed={collapsed} />

      <style>{`
        /* Sync Topbar and main wrapper with sidebar width */
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
                              <button title="Edit" onClick={() => navigate(`/admin/users/edit/${u.id}`)} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
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

        {viewUser && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold">User details</h3>
                <button onClick={closeView} className="text-gray-600 dark:text-gray-300">Close</button>
              </div>

              <div className="flex gap-4 items-center">
                <div className="w-24 h-24 rounded-full overflow-hidden border">
                  <img
                    src={viewUser.avatar_url || viewUser.avatarUrl || '/default-avatar.png'}
                    alt="avatar"
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.onerror = null; e.target.src = '/default-avatar.png'; }}
                  />
                </div>

                <div>
                  <div className="font-semibold text-lg">
                    {`${(viewUser.first_name ?? viewUser.firstName ?? '')} ${(viewUser.last_name ?? viewUser.lastName ?? '')}`.trim()}
                  </div>
                  <div className="text-sm text-gray-500">{viewUser.email}</div>
                  <div className="text-sm text-gray-500 mt-2">Role: <span className="font-medium">{viewUser.role ?? 'Employee'}</span></div>
                  <div className="text-sm text-gray-500 mt-1">Joined: <span className="font-medium">{viewUser.date_joined ? new Date(viewUser.date_joined).toLocaleString() : ''}</span></div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button onClick={() => navigate(`/admin/users/edit/${viewUser.id}`)} className="px-4 py-2 bg-primary text-white rounded">Edit</button>
                <button onClick={() => { closeView(); handleDelete(viewUser.id); }} className="px-4 py-2 bg-red-600 text-white rounded">Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}