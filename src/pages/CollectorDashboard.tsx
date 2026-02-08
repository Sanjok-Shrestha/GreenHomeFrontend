import type { FC } from "react";
import { useNavigate } from "react-router-dom";

const CollectorDashboard: FC = () => {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div style={{ padding: "40px" }}>
      <h2>Collector Dashboard</h2>

      <button>View Assigned Pickups</button><br /><br />
      <button>Update Collection Status</button><br /><br />

      <button onClick={logout}>Logout</button>
    </div>
  );
};

export default CollectorDashboard;
