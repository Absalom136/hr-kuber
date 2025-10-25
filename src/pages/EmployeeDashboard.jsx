// src/pages/EmployeeDashboard.jsx
export default function EmployeeDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="card">Attendance: 92%</div>
      <div className="card">Tasks Completed: 34</div>

      <div className="col-span-2">
        <h3 className="text-lg font-bold mb-2">My Tasks</h3>
        <table className="table-auto w-full bg-white shadow rounded">
          <thead>
            <tr><th>Task</th><th>Status</th><th>Due</th></tr>
          </thead>
          <tbody>
            <tr><td>Update Profile</td><td>Done</td><td>Oct 20</td></tr>
            <tr><td>Submit Leave</td><td>Pending</td><td>Oct 25</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}