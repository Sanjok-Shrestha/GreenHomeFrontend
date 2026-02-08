import type { FC } from "react";
import { useNavigate } from "react-router-dom";

const AdminDashboard: FC = () => {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div style={{ padding: "40px" }}>
      <h2>Admin Dashboard</h2>

      <button>Manage Pricing</button><br /><br />
      <button>Verify Collectors</button><br /><br />
      <button>View Reports</button><br /><br />

      <button onClick={logout}>Logout</button>
    </div>
  );
};

export default AdminDashboard;
