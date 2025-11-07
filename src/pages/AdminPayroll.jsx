import { useEffect, useState, useRef } from 'react';
import { FaEye, FaEdit, FaTrash, FaSearch, FaPrint, FaDownload, FaFilter } from 'react-icons/fa';
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

// Kenyan Tax Calculation Functions (Effective February 2025)
function calculatePAYE(grossSalary) {
  const personalRelief = 2400; // Monthly personal relief
  let taxableIncome = grossSalary;
  let tax = 0;

  // Progressive tax brackets
  if (taxableIncome > 800000) {
    tax += (taxableIncome - 800000) * 0.35;
    taxableIncome = 800000;
  }
  if (taxableIncome > 500000) {
    tax += (taxableIncome - 500000) * 0.325;
    taxableIncome = 500000;
  }
  if (taxableIncome > 32333) {
    tax += (taxableIncome - 32333) * 0.30;
    taxableIncome = 32333;
  }
  if (taxableIncome > 24000) {
    tax += (taxableIncome - 24000) * 0.25;
    taxableIncome = 24000;
  }
  if (taxableIncome > 0) {
    tax += taxableIncome * 0.10;
  }

  // Apply personal relief
  tax = Math.max(0, tax - personalRelief);
  return Math.round(tax);
}

function calculateNSSF(grossSalary) {
  // NSSF: 6% of pensionable earnings
  // Lower Earnings Limit (LEL): Ksh 8,000
  // Upper Earnings Limit (UEL): Ksh 72,000
  const LEL = 8000;
  const UEL = 72000;
  const rate = 0.06;

  let pensionableEarnings = grossSalary;
  if (pensionableEarnings < LEL) {
    return 0; // No contribution if below LEL
  }
  if (pensionableEarnings > UEL) {
    pensionableEarnings = UEL; // Cap at UEL
  }

  return Math.round(pensionableEarnings * rate);
}

function calculateSHIF(grossSalary) {
  // SHIF: 2.75% of gross salary, minimum Ksh 500
  const rate = 0.0275;
  const minimum = 500;
  const contribution = grossSalary * rate;
  return Math.round(Math.max(minimum, contribution));
}

function formatCurrency(amount) {
  return `Ksh. ${(amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function AdminPayroll() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const collapsed = !sidebarOpen;
  const collapsedOffset = '5rem';
  const expandedOffset = '16rem';
  const offset = sidebarOpen ? expandedOffset : collapsedOffset;

  const [payrolls, setPayrolls] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [viewPayroll, setViewPayroll] = useState(null);
  const [editPayroll, setEditPayroll] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [filterStatus, setFilterStatus] = useState('');

  const viewPrintRef = useRef(null);
  const didFetch = useRef(false);
  const userName = localStorage.getItem('username') || 'Admin';
  const avatarFromStorage = localStorage.getItem('avatarUrl') || '/default-avatar.png';

  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;
    fetchPayrolls();

    const onStorage = (e) => {
      if (e.key === 'sidebarOpen') setSidebarOpen(e.newValue === 'true');
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let filteredList = payrolls;

    // Text search
    const q = query.trim().toLowerCase();
    if (q) {
      filteredList = filteredList.filter((p) => {
        const name = `${p.employee?.first_name ?? ''} ${p.employee?.last_name ?? ''}`.toLowerCase();
        return (
          name.includes(q) ||
          (p.employee?.email || '').toLowerCase().includes(q) ||
          (p.employee?.payroll_number || '').toLowerCase().includes(q) ||
          (p.employee?.username || '').toLowerCase().includes(q)
        );
      });
    }

    // Month filter
    if (filterMonth) {
      filteredList = filteredList.filter((p) => {
        const payrollDate = p.payroll_period ? new Date(p.payroll_period) : null;
        if (!payrollDate) return false;
        return payrollDate.getMonth() + 1 === parseInt(filterMonth);
      });
    }

    // Year filter
    if (filterYear) {
      filteredList = filteredList.filter((p) => {
        const payrollDate = p.payroll_period ? new Date(p.payroll_period) : null;
        if (!payrollDate) return false;
        return payrollDate.getFullYear() === parseInt(filterYear);
      });
    }

    // Status filter
    if (filterStatus) {
      filteredList = filteredList.filter((p) => (p.status || '').toLowerCase() === filterStatus.toLowerCase());
    }

    setFiltered(filteredList);
  }, [query, payrolls, filterMonth, filterYear, filterStatus]);

  const getCsrf = () => getCookie('csrftoken') || getCookie('csrfToken') || '';

  const fetchPayrolls = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // For now, fetch users and create mock payroll data
      // Replace with actual payroll API endpoint when available
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

      if (res.status === 401 || res.status === 403) {
        setErrorMsg('Unauthorized. Check your session or token.');
        setPayrolls([]);
        setFiltered([]);
        setLoading(false);
        return;
      }

      const txt = await res.text();
      let data = null;
      try {
        data = txt ? JSON.parse(txt) : null;
      } catch (err) {
        console.warn('Failed to parse JSON response for payroll.', err);
        data = txt;
      }

      const users = Array.isArray(data) ? data : data?.results ?? [];
      
      // Transform users into payroll entries (mock data structure)
      // Replace this with actual payroll API call when backend is ready
      const payrollEntries = users.map((user) => {
        const basicSalary = 50000; // Mock data in Ksh
        const allowances = 10000;
        const grossSalary = basicSalary + allowances;
        const nssf = calculateNSSF(grossSalary);
        const shif = calculateSHIF(grossSalary);
        const otherDeductions = 2000; // Mock other deductions
        const totalDeductions = nssf + shif + otherDeductions;
        const taxableIncome = grossSalary - nssf; // NSSF is tax-exempt
        const paye = calculatePAYE(taxableIncome);
        const netPay = grossSalary - paye - totalDeductions;

        return {
          id: user.id,
          employee: user,
          payroll_period: new Date().toISOString().slice(0, 7), // Current month
          basic_salary: basicSalary,
          allowances: allowances,
          gross_salary: grossSalary,
          nssf: nssf,
          shif: shif,
          other_deductions: otherDeductions,
          deductions: totalDeductions,
          tax: paye,
          net_pay: netPay,
          status: 'Paid',
          payment_date: new Date().toISOString().slice(0, 10),
          payment_method: 'Bank Transfer',
          notes: '',
        };
      });

      setPayrolls(payrollEntries);
      setFiltered(payrollEntries);
    } catch (err) {
      console.error('Fetch payroll error', err);
      setErrorMsg('Network error while loading payroll');
      setPayrolls([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (!selectAll) {
      const ids = new Set(filtered.map((p) => p.id));
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

  const openView = (payroll) => setViewPayroll(payroll);
  const closeView = () => setViewPayroll(null);

  const openEdit = (payroll) => {
    const calculated = calculatePayroll(
      payroll.basic_salary || 0,
      payroll.allowances || 0,
      payroll.other_deductions || 0
    );
    setEditPayroll({
      id: payroll.id,
      employee_id: payroll.employee?.id,
      basic_salary: payroll.basic_salary || 0,
      allowances: payroll.allowances || 0,
      other_deductions: payroll.other_deductions || 0,
      gross_salary: calculated.gross_salary,
      nssf: calculated.nssf,
      shif: calculated.shif,
      deductions: calculated.deductions,
      tax: calculated.tax,
      net_pay: calculated.net_pay,
      payroll_period: payroll.payroll_period || '',
      status: payroll.status || 'Pending',
      payment_date: payroll.payment_date || '',
      payment_method: payroll.payment_method || 'Bank Transfer',
      notes: payroll.notes || '',
    });
  };

  const closeEdit = () => setEditPayroll(null);

  const handleEditChange = (field, value) => {
    setEditPayroll((prev) => ({ ...prev, [field]: value }));
  };

  const calculatePayroll = (basic, allowances, otherDeductions) => {
    const grossSalary = (basic || 0) + (allowances || 0);
    const nssf = calculateNSSF(grossSalary);
    const shif = calculateSHIF(grossSalary);
    const totalDeductions = nssf + shif + (otherDeductions || 0);
    const taxableIncome = grossSalary - nssf; // NSSF is tax-exempt
    const paye = calculatePAYE(taxableIncome);
    const netPay = grossSalary - paye - totalDeductions;

    return {
      gross_salary: grossSalary,
      nssf: nssf,
      shif: shif,
      deductions: totalDeductions,
      tax: paye,
      net_pay: Math.max(0, netPay),
    };
  };

  useEffect(() => {
    if (editPayroll) {
      const calculated = calculatePayroll(
        editPayroll.basic_salary,
        editPayroll.allowances,
        editPayroll.other_deductions
      );
      setEditPayroll((prev) => ({
        ...prev,
        gross_salary: calculated.gross_salary,
        nssf: calculated.nssf,
        shif: calculated.shif,
        deductions: calculated.deductions,
        tax: calculated.tax,
        net_pay: calculated.net_pay,
      }));
    }
  }, [editPayroll?.basic_salary, editPayroll?.allowances, editPayroll?.other_deductions]);

  const handleSaveEdit = async () => {
    if (!editPayroll) return;
    setSaving(true);
    try {
      // Replace with actual payroll API endpoint
      const url = buildUrl(`/api/admin/payroll/${editPayroll.id}/`);
      const calculated = calculatePayroll(
        editPayroll.basic_salary,
        editPayroll.allowances,
        editPayroll.other_deductions
      );
      const body = {
        employee_id: editPayroll.employee_id,
        basic_salary: parseFloat(editPayroll.basic_salary) || 0,
        allowances: parseFloat(editPayroll.allowances) || 0,
        other_deductions: parseFloat(editPayroll.other_deductions) || 0,
        gross_salary: calculated.gross_salary,
        nssf: calculated.nssf,
        shif: calculated.shif,
        deductions: calculated.deductions,
        tax: calculated.tax,
        net_pay: calculated.net_pay,
        payroll_period: editPayroll.payroll_period,
        status: editPayroll.status,
        payment_date: editPayroll.payment_date || null,
        payment_method: editPayroll.payment_method || 'Bank Transfer',
        notes: editPayroll.notes || '',
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
        setPayrolls((prev) => prev.map((p) => (p.id === editPayroll.id ? { ...p, ...updated } : p)));
        setFiltered((prev) => prev.map((p) => (p.id === editPayroll.id ? { ...p, ...updated } : p)));
        closeEdit();
        alert('Payroll updated successfully');
      } else {
        const text = await res.text();
        console.error('Edit save failed', res.status, text);
        alert(`Failed to save changes (${res.status}). Note: Backend API endpoint may not be implemented yet.`);
      }
    } catch (err) {
      console.error('Save edit error', err);
      alert('Network error while saving changes. Note: Backend API endpoint may not be implemented yet.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this payroll record? This action cannot be undone.')) return;
    try {
      const url = buildUrl(`/api/admin/payroll/${id}/delete/`);
      const res = await fetch(url, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'X-CSRFToken': getCsrf(),
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      if (res.ok || res.status === 204) {
        setPayrolls((prev) => prev.filter((p) => p.id !== id));
        setFiltered((prev) => prev.filter((p) => p.id !== id));
        const next = new Set(selectedIds);
        next.delete(id);
        setSelectedIds(next);
      } else {
        const text = await res.text();
        console.error('Delete failed', res.status, text);
        alert(`Failed to delete payroll record (${res.status}). Note: Backend API endpoint may not be implemented yet.`);
      }
    } catch (err) {
      console.error('Delete error', err);
      alert('Network error while deleting payroll record. Note: Backend API endpoint may not be implemented yet.');
    }
  };

  const handlePrint = () => {
    if (!viewPrintRef.current) return;
    const content = viewPrintRef.current.innerHTML;
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((node) => node.outerHTML)
      .join('\n');
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) return alert('Unable to open print window — check popup blocker');
    printWindow.document.open();
    printWindow.document.write(
      `  
<html>
<head>
<title>Payroll Details</title>
${styles}
<style>
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial; padding: 20px; color: #111827; }
.payroll-print-container { max-width: 800px; margin: 0 auto; }
.meta { margin-top: 8px; }
.row { margin: 6px 0; }
.label { font-weight: 600; color: #374151; }
.value { margin-left: 6px; color: #111827; }
</style>
</head>
<body>
<div class="payroll-print-container">
${content}
</div>
</body>
</html>
`
    );
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleBulkExport = () => {
    if (selectedIds.size === 0) {
      alert('No payroll records selected');
      return;
    }
    // Implement CSV/Excel export functionality
    alert(`Exporting ${selectedIds.size} payroll records. Feature coming soon.`);
  };

  const months = [
    { value: '', label: 'All Months' },
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

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
          pageTitle="Payroll Management"
          onToggleSidebar={() => setSidebarOpen((s) => !s)}
        />
        <main className="p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <header className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold">Payroll Management</h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">Manage employee payroll, salaries, and payments</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by name, email, or payroll number"
                    className="pl-10 pr-4 py-2 rounded-md border w-72 text-sm bg-white dark:bg-gray-800"
                    aria-label="Search payroll"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <FaSearch />
                  </div>
                </div>
                <button onClick={fetchPayrolls} className="px-3 py-2 bg-primary text-white rounded">Refresh</button>
                <button onClick={handleBulkExport} className="px-3 py-2 bg-green-600 text-white rounded flex items-center gap-2">
                  <FaDownload /> Export
                </button>
              </div>
            </header>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 mb-6">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <FaFilter className="text-gray-500" />
                  <span className="text-sm font-medium">Filters:</span>
                </div>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="px-3 py-2 border rounded text-sm bg-white dark:bg-gray-700"
                >
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="px-3 py-2 border rounded text-sm bg-white dark:bg-gray-700"
                >
                  {years.map((y) => (
                    <option key={y} value={y.toString()}>
                      {y}
                    </option>
                  ))}
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border rounded text-sm bg-white dark:bg-gray-700"
                >
                  <option value="">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="Failed">Failed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                {(filterMonth || filterStatus) && (
                  <button
                    onClick={() => {
                      setFilterMonth('');
                      setFilterStatus('');
                    }}
                    className="px-3 py-2 text-sm border rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            <section className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
              <table className="min-w-full table-auto">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr className="text-left text-sm text-gray-600 dark:text-gray-200">
                    <th className="px-4 py-3">
                      <input type="checkbox" checked={selectAll} onChange={toggleSelectAll} aria-label="Select all payroll records" />
                    </th>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Period</th>
                    <th className="px-4 py-3">Basic Salary</th>
                    <th className="px-4 py-3">Allowances</th>
                    <th className="px-4 py-3">Deductions</th>
                    <th className="px-4 py-3">PAYE Tax</th>
                    <th className="px-4 py-3">Net Pay</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {loading && (
                    <tr>
                      <td colSpan={10} className="px-4 py-6 text-center text-gray-500">Loading payroll records...</td>
                    </tr>
                  )}
                  {!loading && (!filtered || filtered.length === 0) && (
                    <tr>
                      <td colSpan={10} className="px-4 py-6 text-center text-gray-500">{errorMsg || 'No payroll records found'}</td>
                    </tr>
                  )}
                  {!loading &&
                    filtered.map((p) => {
                      const employee = p.employee || {};
                      const fullName = `${employee.first_name ?? employee.firstName ?? ''} ${employee.last_name ?? employee.lastName ?? ''}`.trim() || employee.username || '—';
                      const avatar = employee.avatar_url || employee.avatarUrl || '/default-avatar.png';
                      const period = p.payroll_period ? new Date(p.payroll_period + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—';
                      const statusColors = {
                        Paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                        Pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
                        Failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
                        Cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
                      };
                      return (
                        <tr key={p.id} className="border-t last:border-b">
                          <td className="px-4 py-3">
                            <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelectOne(p.id)} aria-label={`Select payroll ${fullName}`} />
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
                              <div className="text-xs text-gray-500">{employee.payroll_number || `ID: ${p.id}`}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3">{period}</td>
                          <td className="px-4 py-3">{formatCurrency(p.basic_salary || 0)}</td>
                          <td className="px-4 py-3">{formatCurrency(p.allowances || 0)}</td>
                          <td className="px-4 py-3">{formatCurrency(p.deductions || 0)}</td>
                          <td className="px-4 py-3">{formatCurrency(p.tax || 0)}</td>
                          <td className="px-4 py-3 font-semibold">{formatCurrency(p.net_pay || 0)}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs ${statusColors[p.status] || statusColors.Pending}`}>{p.status || 'Pending'}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button title="View" onClick={() => openView(p)} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                                <FaEye />
                              </button>
                              <button title="Edit" onClick={() => openEdit(p)} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                                <FaEdit />
                              </button>
                              <button title="Delete" onClick={() => handleDelete(p.id)} className="p-2 rounded hover:bg-red-50 dark:hover:bg-red-700 text-red-600">
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

        {/* View Payroll Modal */}
        {viewPayroll && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full shadow-lg">
              <div className="p-6 max-h-[80vh] overflow-auto" ref={viewPrintRef}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Payroll Details</h3>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {viewPayroll.employee ? `${viewPayroll.employee.first_name || ''} ${viewPayroll.employee.last_name || ''}`.trim() || viewPayroll.employee.username : 'Employee'}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={handlePrint} title="Print" className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded flex items-center gap-2">
                      <FaPrint /> Print
                    </button>
                    <button onClick={closeView} className="text-gray-600 dark:text-gray-300">Close</button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">Employee</div>
                      <div className="font-medium">
                        {viewPayroll.employee ? `${viewPayroll.employee.first_name || ''} ${viewPayroll.employee.last_name || ''}`.trim() || viewPayroll.employee.username : '—'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">Payroll Period</div>
                      <div className="font-medium">{viewPayroll.payroll_period ? new Date(viewPayroll.payroll_period + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">Basic Salary</div>
                      <div className="font-medium">{formatCurrency(viewPayroll.basic_salary || 0)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">Allowances</div>
                      <div className="font-medium">{formatCurrency(viewPayroll.allowances || 0)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">Gross Salary</div>
                      <div className="font-medium">{formatCurrency(viewPayroll.gross_salary || 0)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">NSSF</div>
                      <div className="font-medium">{formatCurrency(viewPayroll.nssf || 0)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">SHIF</div>
                      <div className="font-medium">{formatCurrency(viewPayroll.shif || 0)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">Other Deductions</div>
                      <div className="font-medium">{formatCurrency(viewPayroll.other_deductions || 0)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">Total Deductions</div>
                      <div className="font-medium">{formatCurrency(viewPayroll.deductions || 0)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">PAYE Tax</div>
                      <div className="font-medium">{formatCurrency(viewPayroll.tax || 0)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">Net Pay</div>
                      <div className="font-medium text-lg text-primary">{formatCurrency(viewPayroll.net_pay || 0)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">Status</div>
                      <div className="font-medium">{viewPayroll.status || 'Pending'}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">Payment Date</div>
                      <div className="font-medium">{viewPayroll.payment_date ? new Date(viewPayroll.payment_date).toLocaleDateString() : '—'}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">Payment Method</div>
                      <div className="font-medium">{viewPayroll.payment_method || '—'}</div>
                    </div>
                  </div>
                  {viewPayroll.notes && (
                    <div>
                      <div className="text-gray-500 dark:text-gray-400 text-sm mb-1">Notes</div>
                      <div className="text-sm">{viewPayroll.notes}</div>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end gap-2">
                  <button onClick={() => { closeView(); openEdit(viewPayroll); }} className="px-4 py-2 bg-primary text-white rounded">Edit</button>
                  <button onClick={closeView} className="px-4 py-2 border rounded">Close</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Payroll Modal */}
        {editPayroll && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full shadow-lg">
              <div className="p-6 max-h-[85vh] overflow-auto">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold">Edit Payroll</h3>
                  <button onClick={closeEdit} className="text-gray-600 dark:text-gray-300">Close</button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSaveEdit();
                  }}
                >
                  <div className="grid grid-cols-1 gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <label className="text-sm">
                        Basic Salary (Ksh)
                        <input
                          type="number"
                          step="0.01"
                          className="w-full mt-1 p-2 border rounded bg-white dark:bg-gray-700"
                          value={editPayroll.basic_salary}
                          onChange={(e) => handleEditChange('basic_salary', e.target.value)}
                          required
                        />
                      </label>
                      <label className="text-sm">
                        Allowances (Ksh)
                        <input
                          type="number"
                          step="0.01"
                          className="w-full mt-1 p-2 border rounded bg-white dark:bg-gray-700"
                          value={editPayroll.allowances}
                          onChange={(e) => handleEditChange('allowances', e.target.value)}
                        />
                      </label>
                      <label className="text-sm">
                        Other Deductions (Ksh)
                        <input
                          type="number"
                          step="0.01"
                          className="w-full mt-1 p-2 border rounded bg-white dark:bg-gray-700"
                          value={editPayroll.other_deductions || 0}
                          onChange={(e) => handleEditChange('other_deductions', e.target.value)}
                        />
                        <div className="text-xs text-gray-500 mt-1">NSSF, SHIF, and PAYE are calculated automatically</div>
                      </label>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <div className="text-gray-600 dark:text-gray-400">Gross Salary</div>
                          <div className="font-semibold">{formatCurrency(editPayroll.gross_salary || 0)}</div>
                        </div>
                        <div>
                          <div className="text-gray-600 dark:text-gray-400">NSSF</div>
                          <div className="font-semibold">{formatCurrency(editPayroll.nssf || 0)}</div>
                        </div>
                        <div>
                          <div className="text-gray-600 dark:text-gray-400">SHIF</div>
                          <div className="font-semibold">{formatCurrency(editPayroll.shif || 0)}</div>
                        </div>
                        <div>
                          <div className="text-gray-600 dark:text-gray-400">Total Deductions</div>
                          <div className="font-semibold">{formatCurrency(editPayroll.deductions || 0)}</div>
                        </div>
                        <div>
                          <div className="text-gray-600 dark:text-gray-400">PAYE Tax</div>
                          <div className="font-semibold">{formatCurrency(editPayroll.tax || 0)}</div>
                        </div>
                        <div>
                          <div className="text-gray-600 dark:text-gray-400">Net Pay</div>
                          <div className="text-xl font-semibold text-primary">{formatCurrency(editPayroll.net_pay || 0)}</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <label className="text-sm">
                        Payroll Period
                        <input
                          type="month"
                          className="w-full mt-1 p-2 border rounded bg-white dark:bg-gray-700"
                          value={editPayroll.payroll_period}
                          onChange={(e) => handleEditChange('payroll_period', e.target.value)}
                          required
                        />
                      </label>
                      <label className="text-sm">
                        Status
                        <select className="w-full mt-1 p-2 border rounded bg-white dark:bg-gray-700" value={editPayroll.status} onChange={(e) => handleEditChange('status', e.target.value)}>
                          <option value="Pending">Pending</option>
                          <option value="Paid">Paid</option>
                          <option value="Failed">Failed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </label>
                      <label className="text-sm">
                        Payment Date
                        <input
                          type="date"
                          className="w-full mt-1 p-2 border rounded bg-white dark:bg-gray-700"
                          value={editPayroll.payment_date}
                          onChange={(e) => handleEditChange('payment_date', e.target.value)}
                        />
                      </label>
                      <label className="text-sm">
                        Payment Method
                        <select className="w-full mt-1 p-2 border rounded bg-white dark:bg-gray-700" value={editPayroll.payment_method} onChange={(e) => handleEditChange('payment_method', e.target.value)}>
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="Cash">Cash</option>
                          <option value="Check">Check</option>
                          <option value="Mobile Money">Mobile Money</option>
                        </select>
                      </label>
                    </div>

                    <label className="text-sm">
                      Notes
                      <textarea rows={3} className="w-full mt-1 p-2 border rounded bg-white dark:bg-gray-700" value={editPayroll.notes} onChange={(e) => handleEditChange('notes', e.target.value)} />
                    </label>
                  </div>

                  <div className="mt-6 flex justify-end gap-2">
                    <button type="button" onClick={closeEdit} className="px-4 py-2 border rounded">Cancel</button>
                    <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-white rounded">
                      {saving ? 'Saving...' : 'Save Changes'}
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

