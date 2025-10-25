// src/pages/ClientDashboard.jsx
export default function ClientDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="card">Projects: 3</div>
      <div className="card">Invoices Due: $4,200</div>

      <div className="col-span-2">
        <h3 className="text-lg font-bold mb-2">Project Status</h3>
        <table className="table-auto w-full bg-white shadow rounded">
          <thead>
            <tr><th>Project</th><th>Status</th><th>Deadline</th></tr>
          </thead>
          <tbody>
            <tr><td>HR Portal</td><td>In Progress</td><td>Nov 10</td></tr>
            <tr><td>Payroll API</td><td>Completed</td><td>Oct 15</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}