import { useEffect, useState, useRef } from 'react';
import { FaPrint, FaDownload } from 'react-icons/fa';
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

function calculatePAYE(grossSalary) {
  const personalRelief = 2400;
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
  return `Ksh. ${(amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

export default function EmployeePayslip() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const collapsed = !sidebarOpen;
  const collapsedOffset = '5rem';
  const expandedOffset = '16rem';
  const offset = sidebarOpen ? expandedOffset : collapsedOffset;

  const [payroll, setPayroll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [availablePeriods, setAvailablePeriods] = useState([]);

  const printRef = useRef(null);
  const userName = localStorage.getItem('username') || 'Employee';
  const avatarFromStorage = localStorage.getItem('avatarUrl') || '/default-avatar.png';

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'sidebarOpen') setSidebarOpen(e.newValue === 'true');
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    fetchPayslip();
  }, [selectedPeriod]);

  const getCsrf = () => getCookie('csrftoken') || getCookie('csrfToken') || '';

  const fetchPayslip = async () => {
    setLoading(true);
    setError('');
    try {
      // First, get the employee's profile to get their ID
      const profileRes = await fetch(buildUrl('/api/employee/profile/'), {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      if (!profileRes.ok) {
        throw new Error('Failed to load employee profile');
      }

      const profileData = await profileRes.json();
      const employeeId = profileData.id;

      const baseValues = {
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
      };

      const computed = calculatePayroll(baseValues);

      const payrollData = {
        id: employeeId,
        employee: profileData,
        payroll_period: selectedPeriod,
        status: 'Paid',
        payment_date: new Date().toISOString().slice(0, 10),
        payment_method: 'Bank Transfer',
        company_name: 'Nairobi County - Executive',
        company_address: 'City Hall Way, Nairobi',
        ...computed,
      };

      setPayroll(payrollData);

      setAvailablePeriods((prev) => {
        if (prev.length > 0) return prev;
        const periodOptions = Array.from({ length: 6 }, (_, i) => {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          return date.toISOString().slice(0, 7);
        });
        return periodOptions;
      });
    } catch (err) {
      console.error('Failed to fetch payslip', err);
      setError(err.message || 'Unable to load payslip');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const content = printRef.current.innerHTML;
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((node) => node.outerHTML)
      .join('\n');
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      alert('Unable to open print window — check popup blocker');
      return;
    }
    printWindow.document.open();
    printWindow.document.write(
      `  
<html>
<head>
<title>Payslip - ${payroll?.payroll_period || ''}</title>
${styles}
<style>
@media print {
  body { margin: 0; padding: 20px; }
  .no-print { display: none !important; }
  .payslip-container { box-shadow: none; border: 1px solid #ddd; }
}
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial; padding: 20px; color: #111827; }
.payslip-container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; }
</style>
</head>
<body>
${content}
</body>
</html>
`
    );
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleDownload = () => {
    // Placeholder for PDF download functionality
    alert('PDF download feature coming soon');
  };

  if (loading) {
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
            pageTitle="My Payslip"
            onToggleSidebar={() => setSidebarOpen((s) => !s)}
          />
          <main className="p-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 text-center">
                <div className="text-gray-500">Loading payslip...</div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !payroll) {
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
            pageTitle="My Payslip"
            onToggleSidebar={() => setSidebarOpen((s) => !s)}
          />
          <main className="p-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 text-center">
                <div className="text-red-600 mb-4">{error || 'No payslip data available'}</div>
                <button onClick={fetchPayslip} className="px-4 py-2 bg-primary text-white rounded">
                  Retry
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const employee = payroll.employee || {};
  const fullName = `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || employee.username || 'Employee';
  const periodDate = payroll.payroll_period ? new Date(payroll.payroll_period + '-01') : new Date();
  const periodLabel = periodDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const allowancesTotal = getAllowancesTotal(payroll);
  const deductionsTotal = getDeductionsTotal(payroll);
  const profile = employee.profile || {};
  const pfNumber =
    employee.payroll_number ||
    profile.payroll_number ||
    `PF-${String(employee.id || '0000').padStart(4, '0')}`;
  const station = profile.station || 'Nairobi';
  const designation = employee.position || profile.position || 'Support Staff';
  const taxPin = profile.tax_pin || 'N/A';
  const idNumber = profile.id_number || employee.id_number || 'N/A';
  const paymentMethod = payroll.payment_method || 'Bank Transfer';

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
          pageTitle="My Payslip"
          onToggleSidebar={() => setSidebarOpen((s) => !s)}
        />
        <main className="p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            {/* Controls */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 mb-6 no-print">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <label className="text-sm">
                    Pay Period:
                    <select
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value)}
                      className="ml-2 px-3 py-2 border rounded bg-white dark:bg-gray-700"
                    >
                      {availablePeriods.map((period) => (
                        <option key={period} value={period}>
                          {new Date(period + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    <FaDownload /> Download PDF
                  </button>
                  <button
                    onClick={handlePrint}
                    className="px-4 py-2 bg-primary text-white rounded flex items-center gap-2 hover:bg-primary/90"
                  >
                    <FaPrint /> Print
                  </button>
                </div>
              </div>
            </div>

            {/* Payslip */}
            <div ref={printRef} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg payslip-container">
              {/* Header */}
              <div className="border-b-2 border-gray-300 pb-4 mb-6 text-center space-y-1">
                <h1 className="text-2xl font-bold uppercase text-primary">
                  {payroll.company_name || 'HR Kuber'}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {payroll.company_address || 'Nairobi, Kenya'}
                </p>
                <p className="text-base font-semibold text-red-600 uppercase">
                  Pay-Slip ({periodLabel})
                </p>
                <div className="text-xs text-gray-600 dark:text-gray-300 flex flex-col gap-1 md:flex-row md:gap-4 md:justify-center">
                  <span>
                    <span className="font-semibold">PF-Num:</span> {pfNumber}
                  </span>
                  <span>
                    <span className="font-semibold">Employee:</span> {fullName}
                  </span>
                  <span>
                    <span className="font-semibold">Station:</span> {station}
                  </span>
                  <span>
                    <span className="font-semibold">Designation:</span> {designation}
                  </span>
                </div>
              </div>

              <div className="space-y-6 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <div><span className="font-medium">PF Number:</span> {pfNumber}</div>
                    <div><span className="font-medium">ID Number:</span> {idNumber}</div>
                    <div><span className="font-medium">Station:</span> {station}</div>
                    <div><span className="font-medium">Tax PIN:</span> {taxPin}</div>
                  </div>
                  <div className="space-y-1">
                    <div><span className="font-medium">Designation:</span> {designation}</div>
                    <div><span className="font-medium">Payment Date:</span> {payroll.payment_date ? new Date(payroll.payment_date).toLocaleDateString('en-KE') : 'N/A'}</div>
                    <div><span className="font-medium">Payment Method:</span> {paymentMethod}</div>
                    <div>
                      <span className="font-medium">Status:</span>{' '}
                      <span className={`px-2 py-1 rounded text-xs ${payroll.status === 'Paid' ? 'bg-green-100 text-green-800' : payroll.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                        {payroll.status || 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-600 dark:text-gray-400 mb-3 border-b pb-2 uppercase tracking-wide">Earnings</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between"><span>Basic Salary</span><span className="font-medium">{formatCurrency(payroll.basic_salary)}</span></div>
                      <div className="flex justify-between"><span>Rental House Allowance</span><span className="font-medium">{formatCurrency(payroll.rental_allowance)}</span></div>
                      <div className="flex justify-between"><span>Commuter Allowance</span><span className="font-medium">{formatCurrency(payroll.commuter_allowance)}</span></div>
                      {toNumber(payroll.other_allowances) !== 0 && (
                        <div className="flex justify-between"><span>Other Allowances</span><span className="font-medium">{formatCurrency(payroll.other_allowances)}</span></div>
                      )}
                      <div className="flex justify-between font-semibold border-t pt-2"><span>TOTAL EARNINGS</span><span>{formatCurrency(payroll.gross_salary || round2(toNumber(payroll.basic_salary) + allowancesTotal))}</span></div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-600 dark:text-gray-400 mb-3 border-b pb-2 uppercase tracking-wide">Deductions</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between"><span>Pension</span><span className="font-medium text-red-600">{formatDeduction(payroll.pension)}</span></div>
                      {toNumber(payroll.loan_recovery) !== 0 && (
                        <div className="flex justify-between"><span>Loan Recovery</span><span className="font-medium text-red-600">{formatDeduction(payroll.loan_recovery)}</span></div>
                      )}
                      {toNumber(payroll.sacco_contribution) !== 0 && (
                        <div className="flex justify-between"><span>Sacco Contribution</span><span className="font-medium text-red-600">{formatDeduction(payroll.sacco_contribution)}</span></div>
                      )}
                      <div className="flex justify-between"><span>NSSF</span><span className="font-medium text-red-600">{formatDeduction(payroll.nssf)}</span></div>
                      <div className="flex justify-between"><span>PAYE Tax</span><span className="font-medium text-red-600">{formatDeduction(payroll.tax)}</span></div>
                      <div className="flex justify-between"><span>SHIF</span><span className="font-medium text-red-600">{formatDeduction(payroll.shif)}</span></div>
                      {toNumber(payroll.housing_levy) !== 0 && (
                        <div className="flex justify-between"><span>Housing Levy</span><span className="font-medium text-red-600">{formatDeduction(payroll.housing_levy)}</span></div>
                      )}
                      {toNumber(payroll.other_deductions) !== 0 && (
                        <div className="flex justify-between"><span>Other Deductions</span><span className="font-medium text-red-600">{formatDeduction(payroll.other_deductions)}</span></div>
                      )}
                      <div className="flex justify-between font-semibold border-t pt-2"><span>TOTAL DEDUCTIONS</span><span className="text-red-600">{formatDeduction(deductionsTotal)}</span></div>
                    </div>
                  </div>
                </div>

                <div className="bg-primary/10 dark:bg-primary/20 rounded-lg p-4 flex justify-between items-center text-base">
                  <div className="flex flex-col">
                    <span className="font-semibold uppercase tracking-wide">NETT PAY</span>
                    <span className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Period: {periodLabel}</span>
                  </div>
                  <span className="text-2xl font-bold text-primary">{formatCurrency(payroll.net_pay)}</span>
                </div>

                <div className="border-t pt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
                  <p>This is a computer-generated payslip. No signature is required.</p>
                  <p className="mt-1">For inquiries, please contact the HR Department.</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

