import type { FC } from "react";
import { Link, useNavigate } from "react-router-dom";

const Dashboard: FC = () => {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div style={{ padding: "40px" }}>
      <h2>User Dashboard</h2>

      <Link to="/post-waste"><button>Post Waste</button></Link><br /><br />
      <Link to="/pickups"><button>Pickup Status</button></Link><br /><br />
      <Link to="/rewards"><button>Rewards</button></Link><br /><br />
      <Link to="/profile"><button>Profile</button></Link><br /><br />

      <button onClick={logout}>Logout</button>
    </div>
  );
};

export default Dashboard;
