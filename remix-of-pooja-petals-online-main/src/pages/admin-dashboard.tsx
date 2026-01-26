// src/pages/AdminDashboard.tsx
const AdminDashboard = () => {
  return (
    <div className="min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Only logged-in admins can see this page.
      </p>

      {/* Add your tables / customer listing here later */}
      <div className="border border-border rounded-lg p-4 bg-card">
        Admin content goes here.
      </div>
    </div>
  );
};

export default AdminDashboard;
