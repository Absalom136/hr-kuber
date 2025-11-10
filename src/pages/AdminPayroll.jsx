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

function toNumber(value) {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return Number.isNaN(value) ? 0 : value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/,/g, '').trim();
    if (cleaned === '') return 0;
    const parsed = Number(cleaned);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function round2(amount) {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

// Kenyan Tax Calculation Functions (Effective February 2025)
function calculatePAYE(grossSalary) {
  const personalRelief = 2400; // Monthly personal relief
  let taxableIncome = grossSalary;
  let tax = 0;

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

  tax = Math.max(0, tax - personalRelief);
  return round2(tax);
}

function calculateNSSF(grossSalary) {
  const LEL = 8000;
  const UEL = 72000;
  const rate = 0.06;

  let pensionableEarnings = grossSalary;
  if (pensionableEarnings < LEL) return 0;
  if (pensionableEarnings > UEL) pensionableEarnings = UEL;

  return round2(pensionableEarnings * rate);
}

function calculateSHIF(grossSalary) {
  const rate = 0.0275;
  const minimum = 500;
  const contribution = Math.max(minimum, grossSalary * rate);
  // SHIF is remitted to the nearest 0.05 (floor)
  const roundedToStep = Math.floor(contribution * 20) / 20;
  return round2(roundedToStep);
}

function calculatePayroll(rawValues = {}) {
  const basic = toNumber(rawValues.basic_salary);
  const rental = toNumber(rawValues.rental_allowance);
  const commuter = toNumber(rawValues.commuter_allowance);
  const otherAllowances = toNumber(rawValues.other_allowances);
  const allowancesTotal = rental + commuter + otherAllowances;
  const grossSalary = round2(basic + allowancesTotal);

  const pension =
    rawValues.pension !== undefined ? toNumber(rawValues.pension) : round2(basic * 0.08);
  const loanRecovery = toNumber(rawValues.loan_recovery);
  const saccoContribution = toNumber(rawValues.sacco_contribution);
  const housingLevy =
    rawValues.housing_levy !== undefined
      ? toNumber(rawValues.housing_levy)
      : round2(grossSalary * 0.015);
  const otherDeductions = toNumber(rawValues.other_deductions);

  const nssf =
    rawValues.nssf !== undefined ? toNumber(rawValues.nssf) : calculateNSSF(grossSalary);
  const shif =
    rawValues.shif !== undefined ? toNumber(rawValues.shif) : calculateSHIF(grossSalary);

  const taxableIncome = grossSalary - nssf;
  const tax =
    rawValues.tax !== undefined ? round2(toNumber(rawValues.tax)) : calculatePAYE(taxableIncome);
  const deductionsTotal = round2(
    pension + loanRecovery + saccoContribution + housingLevy + otherDeductions + nssf + shif + tax
  );
  const netPay = round2(grossSalary - deductionsTotal);

  return {
    basic_salary: round2(basic),
    rental_allowance: round2(rental),
    commuter_allowance: round2(commuter),
    other_allowances: round2(otherAllowances),
    allowances_total: round2(allowancesTotal),
    gross_salary: grossSalary,
    pension: round2(pension),
    loan_recovery: round2(loanRecovery),
    sacco_contribution: round2(saccoContribution),
    housing_levy: round2(housingLevy),
    other_deductions: round2(otherDeductions),
    nssf: round2(nssf),
    shif: round2(shif),
    tax: round2(tax),
    deductions_total: deductionsTotal,
    net_pay: netPay,
  };
}

function formatCurrency(amount) {
  return `Ksh. ${(amount || 0).toLocaleString('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDeduction(amount) {
  const value = Math.abs(toNumber(amount));
  if (!value) return '-';
  return `-${formatCurrency(value)}`;
}

function getAllowancesTotal(record) {
  if (!record) return 0;
  if (record.allowances_total !== undefined) return toNumber(record.allowances_total);
  return round2(
    toNumber(record.rental_allowance) +
      toNumber(record.commuter_allowance) +
      toNumber(record.other_allowances)
  );
}

function getDeductionsTotal(record) {
  if (!record) return 0;
  if (record.deductions_total !== undefined) return toNumber(record.deductions_total);
  return round2(
    toNumber(record.pension) +
      toNumber(record.loan_recovery) +
      toNumber(record.sacco_contribution) +
      toNumber(record.housing_levy) +
      toNumber(record.other_deductions) +
      toNumber(record.nssf) +
      toNumber(record.shif) +
      toNumber(record.tax)
  );
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

      const templates = [
        {
          basic_salary: 16360,
          rental_allowance: 3750,
          commuter_allowance: 3000,
          other_allowances: 0,
          pension: 2053.2,
          loan_recovery: 1321,
          sacco_contribution: 250,
          housing_levy: 346.65,
          shif: 635.5,
          nssf: 360,
          tax: 0,
          other_deductions: 0,
        },
        {
          basic_salary: 48500,
          rental_allowance: 12000,
          commuter_allowance: 4500,
          other_allowances: 3500,
          pension: 3800,
          loan_recovery: 2500,
          sacco_contribution: 1200,
          housing_levy: 540,
          other_deductions: 600,
        },
        {
          basic_salary: 29800,
          rental_allowance: 6500,
          commuter_allowance: 4200,
          other_allowances: 1200,
          pension: 2100,
          loan_recovery: 0,
          sacco_contribution: 500,
          housing_levy: 430,
          other_deductions: 300,
        },
      ];

      const payrollEntries = users.map((user, index) => {
        const template = templates[index % templates.length];

        const computed = calculatePayroll(template);

        return {
          id: user.id,
          employee: user,
          payroll_period: new Date().toISOString().slice(0, 7),
          status: 'Paid',
          payment_date: new Date().toISOString().slice(0, 10),
          payment_method: 'Bank Transfer',
          notes: '',
          ...template,
          ...computed,
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
    const base = {
      id: payroll.id,
      employee_id: payroll.employee?.id,
      basic_salary: payroll.basic_salary ?? 0,
      rental_allowance: payroll.rental_allowance ?? 0,
      commuter_allowance: payroll.commuter_allowance ?? 0,
      other_allowances: payroll.other_allowances ?? 0,
      pension: payroll.pension ?? 0,
      loan_recovery: payroll.loan_recovery ?? 0,
      sacco_contribution: payroll.sacco_contribution ?? 0,
      housing_levy: payroll.housing_levy ?? 0,
      other_deductions: payroll.other_deductions ?? 0,
      payroll_period: payroll.payroll_period || '',
      status: payroll.status || 'Pending',
      payment_date: payroll.payment_date || '',
      payment_method: payroll.payment_method || 'Bank Transfer',
      notes: payroll.notes || '',
    };
    const computed = calculatePayroll(base);
    setEditPayroll({ ...base, ...computed });
  };

  const closeEdit = () => setEditPayroll(null);

  const handleEditChange = (field, value) => {
    setEditPayroll((prev) => {
      const updated = { ...prev, [field]: value };
      const recalculated = calculatePayroll(updated);
      return { ...updated, ...recalculated };
    });
  };

  const computedEdit = editPayroll ? calculatePayroll(editPayroll) : null;
  const viewAllowancesTotal = viewPayroll ? getAllowancesTotal(viewPayroll) : 0;
  const viewDeductionsTotal = viewPayroll ? getDeductionsTotal(viewPayroll) : 0;

  const handleSaveEdit = async () => {
    if (!editPayroll) return;
    setSaving(true);
    try {
      const url = buildUrl(`/api/admin/payroll/${editPayroll.id}/`);
      const calculated = calculatePayroll(editPayroll);
      const body = {
        employee_id: editPayroll.employee_id,
        basic_salary: calculated.basic_salary,
        rental_allowance: calculated.rental_allowance,
        commuter_allowance: calculated.commuter_allowance,
        other_allowances: calculated.other_allowances,
        pension: calculated.pension,
        loan_recovery: calculated.loan_recovery,
        sacco_contribution: calculated.sacco_contribution,
        housing_levy: calculated.housing_levy,
        other_deductions: calculated.other_deductions,
        gross_salary: calculated.gross_salary,
        allowances_total: calculated.allowances_total,
        nssf: calculated.nssf,
        shif: calculated.shif,
        tax: calculated.tax,
        deductions_total: calculated.deductions_total,
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
        const updatedFromServer = await res.json().catch(() => null);
        const mergedUpdate = updatedFromServer || {
          ...editPayroll,
          ...calculated,
          status: editPayroll.status,
          payment_date: editPayroll.payment_date,
          payment_method: editPayroll.payment_method,
          notes: editPayroll.notes,
        };
        setPayrolls((prev) =>
          prev.map((p) =>
            p.id === editPayroll.id ? { ...p, ...mergedUpdate, employee: p.employee } : p
          )
        );
        setFiltered((prev) =>
          prev.map((p) =>
            p.id === editPayroll.id ? { ...p, ...mergedUpdate, employee: p.employee } : p
          )
        );
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
                    <th className="px-4 py-3">Rental Allow.</th>
                    <th className="px-4 py-3">Commuter Allow.</th>
                    <th className="px-4 py-3">Gross Earnings</th>
                    <th className="px-4 py-3">Total Deductions</th>
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
                      const deductionsTotal = getDeductionsTotal(p);
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
                          <td className="px-4 py-3">{formatCurrency(p.rental_allowance || 0)}</td>
                          <td className="px-4 py-3">{formatCurrency(p.commuter_allowance || 0)}</td>
                          <td className="px-4 py-3">{formatCurrency(p.gross_salary || 0)}</td>
                          <td className="px-4 py-3">{formatCurrency(deductionsTotal)}</td>
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

                <div className="space-y-6 text-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-600 dark:text-gray-400 mb-2">EMPLOYEE</h4>
                      <div className="space-y-1">
                        <div><span className="font-medium">Name:</span> {viewPayroll.employee ? `${viewPayroll.employee.first_name || ''} ${viewPayroll.employee.last_name || ''}`.trim() || viewPayroll.employee.username : '—'}</div>
                        <div><span className="font-medium">Payroll No:</span> {viewPayroll.employee?.payroll_number || viewPayroll.employee?.id || '—'}</div>
                        <div><span className="font-medium">Email:</span> {viewPayroll.employee?.email || '—'}</div>
                        <div><span className="font-medium">Department:</span> {viewPayroll.employee?.department_name || viewPayroll.employee?.profile?.department_name || '—'}</div>
                        <div><span className="font-medium">Position:</span> {viewPayroll.employee?.position || viewPayroll.employee?.profile?.position || '—'}</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-600 dark:text-gray-400 mb-2">PAYMENT</h4>
                      <div className="space-y-1">
                        <div><span className="font-medium">Period:</span> {viewPayroll.payroll_period ? new Date(viewPayroll.payroll_period + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}</div>
                        <div><span className="font-medium">Status:</span> {viewPayroll.status || 'Pending'}</div>
                        <div><span className="font-medium">Payment Date:</span> {viewPayroll.payment_date ? new Date(viewPayroll.payment_date).toLocaleDateString('en-KE') : '—'}</div>
                        <div><span className="font-medium">Payment Method:</span> {viewPayroll.payment_method || '—'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div>
                      <h4 className="font-semibold text-gray-600 dark:text-gray-400 mb-3 border-b pb-2 uppercase tracking-wide">Earnings</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between"><span>Basic Salary</span><span className="font-medium">{formatCurrency(viewPayroll.basic_salary || 0)}</span></div>
                        <div className="flex justify-between"><span>Rental House Allowance</span><span className="font-medium">{formatCurrency(viewPayroll.rental_allowance || 0)}</span></div>
                        <div className="flex justify-between"><span>Commuter Allowance</span><span className="font-medium">{formatCurrency(viewPayroll.commuter_allowance || 0)}</span></div>
                        {toNumber(viewPayroll.other_allowances) !== 0 && (
                          <div className="flex justify-between"><span>Other Allowances</span><span className="font-medium">{formatCurrency(viewPayroll.other_allowances || 0)}</span></div>
                        )}
                        <div className="flex justify-between font-semibold border-t pt-2"><span>TOTAL EARNINGS</span><span>{formatCurrency(viewPayroll.gross_salary || toNumber(viewPayroll.basic_salary) + viewAllowancesTotal)}</span></div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-600 dark:text-gray-400 mb-3 border-b pb-2 uppercase tracking-wide">Deductions</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between"><span>Pension</span><span className="font-medium text-red-600">{formatDeduction(viewPayroll.pension)}</span></div>
                        {toNumber(viewPayroll.loan_recovery) !== 0 && (
                          <div className="flex justify-between"><span>Loan Recovery</span><span className="font-medium text-red-600">{formatDeduction(viewPayroll.loan_recovery)}</span></div>
                        )}
                        {toNumber(viewPayroll.sacco_contribution) !== 0 && (
                          <div className="flex justify-between"><span>Sacco Contribution</span><span className="font-medium text-red-600">{formatDeduction(viewPayroll.sacco_contribution)}</span></div>
                        )}
                        <div className="flex justify-between"><span>NSSF</span><span className="font-medium text-red-600">{formatDeduction(viewPayroll.nssf)}</span></div>
                        <div className="flex justify-between"><span>PAYE Tax</span><span className="font-medium text-red-600">{formatDeduction(viewPayroll.tax)}</span></div>
                        <div className="flex justify-between"><span>SHIF</span><span className="font-medium text-red-600">{formatDeduction(viewPayroll.shif)}</span></div>
                        {toNumber(viewPayroll.housing_levy) !== 0 && (
                          <div className="flex justify-between"><span>Housing Levy</span><span className="font-medium text-red-600">{formatDeduction(viewPayroll.housing_levy)}</span></div>
                        )}
                        {toNumber(viewPayroll.other_deductions) !== 0 && (
                          <div className="flex justify-between"><span>Other Deductions</span><span className="font-medium text-red-600">{formatDeduction(viewPayroll.other_deductions)}</span></div>
                        )}
                        <div className="flex justify-between font-semibold border-t pt-2"><span>TOTAL DEDUCTIONS</span><span className="text-red-600">{formatDeduction(viewDeductionsTotal)}</span></div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-primary/10 dark:bg-primary/20 rounded-lg p-4 flex justify-between items-center text-base">
                    <span className="font-semibold uppercase tracking-wide">NETT PAY</span>
                    <span className="text-xl font-bold text-primary">{formatCurrency(viewPayroll.net_pay || 0)}</span>
                  </div>

                  {viewPayroll.notes && (
                    <div className="text-sm">
                      <div className="text-gray-500 dark:text-gray-400 mb-1 font-semibold">Notes</div>
                      <div>{viewPayroll.notes}</div>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        Rental House Allowance (Ksh)
                        <input
                          type="number"
                          step="0.01"
                          className="w-full mt-1 p-2 border rounded bg-white dark:bg-gray-700"
                          value={editPayroll.rental_allowance}
                          onChange={(e) => handleEditChange('rental_allowance', e.target.value)}
                        />
                      </label>
                      <label className="text-sm">
                        Commuter Allowance (Ksh)
                        <input
                          type="number"
                          step="0.01"
                          className="w-full mt-1 p-2 border rounded bg-white dark:bg-gray-700"
                          value={editPayroll.commuter_allowance}
                          onChange={(e) => handleEditChange('commuter_allowance', e.target.value)}
                        />
                      </label>
                      <label className="text-sm">
                        Other Allowances (Ksh)
                        <input
                          type="number"
                          step="0.01"
                          className="w-full mt-1 p-2 border rounded bg-white dark:bg-gray-700"
                          value={editPayroll.other_allowances}
                          onChange={(e) => handleEditChange('other_allowances', e.target.value)}
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="text-sm">
                        Pension (Ksh)
                        <input
                          type="number"
                          step="0.01"
                          className="w-full mt-1 p-2 border rounded bg-white dark:bg-gray-700"
                          value={editPayroll.pension}
                          onChange={(e) => handleEditChange('pension', e.target.value)}
                        />
                      </label>
                      <label className="text-sm">
                        Loan Recovery (Ksh)
                        <input
                          type="number"
                          step="0.01"
                          className="w-full mt-1 p-2 border rounded bg-white dark:bg-gray-700"
                          value={editPayroll.loan_recovery}
                          onChange={(e) => handleEditChange('loan_recovery', e.target.value)}
                        />
                      </label>
                      <label className="text-sm">
                        Sacco Contribution (Ksh)
                        <input
                          type="number"
                          step="0.01"
                          className="w-full mt-1 p-2 border rounded bg-white dark:bg-gray-700"
                          value={editPayroll.sacco_contribution}
                          onChange={(e) => handleEditChange('sacco_contribution', e.target.value)}
                        />
                      </label>
                      <label className="text-sm">
                        Housing Levy (Ksh)
                        <input
                          type="number"
                          step="0.01"
                          className="w-full mt-1 p-2 border rounded bg-white dark:bg-gray-700"
                          value={editPayroll.housing_levy}
                          onChange={(e) => handleEditChange('housing_levy', e.target.value)}
                        />
                        <div className="text-xs text-gray-500 mt-1">Defaults to 1.5% of gross pay</div>
                      </label>
                      <label className="text-sm md:col-span-2">
                        Other Deductions (Ksh)
                        <input
                          type="number"
                          step="0.01"
                          className="w-full mt-1 p-2 border rounded bg-white dark:bg-gray-700"
                          value={editPayroll.other_deductions}
                          onChange={(e) => handleEditChange('other_deductions', e.target.value)}
                        />
                        <div className="text-xs text-gray-500 mt-1">NSSF, SHIF, and PAYE calculate automatically</div>
                      </label>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded space-y-2 text-sm">
                      <h4 className="font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Summary</h4>
                      {computedEdit ? (
                        <div className="grid grid-cols-2 gap-2">
                          <div><span className="text-gray-600 dark:text-gray-400">Gross Salary</span><div className="font-semibold">{formatCurrency(computedEdit.gross_salary)}</div></div>
                          <div><span className="text-gray-600 dark:text-gray-400">Allowances Total</span><div className="font-semibold">{formatCurrency(computedEdit.allowances_total)}</div></div>
                          <div><span className="text-gray-600 dark:text-gray-400">NSSF</span><div className="font-semibold">{formatCurrency(computedEdit.nssf)}</div></div>
                          <div><span className="text-gray-600 dark:text-gray-400">SHIF</span><div className="font-semibold">{formatCurrency(computedEdit.shif)}</div></div>
                          <div><span className="text-gray-600 dark:text-gray-400">PAYE Tax</span><div className="font-semibold">{formatCurrency(computedEdit.tax)}</div></div>
                          <div><span className="text-gray-600 dark:text-gray-400">Total Deductions</span><div className="font-semibold text-red-600">{formatDeduction(computedEdit.deductions_total)}</div></div>
                          <div className="col-span-2">
                            <span className="text-gray-600 dark:text-gray-400">Net Pay</span>
                            <div className="text-xl font-semibold text-primary">{formatCurrency(computedEdit.net_pay)}</div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-500">Enter salary details to see summary.</div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

