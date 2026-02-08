import type { FC } from "react";
import { Link } from "react-router-dom";

const Unauthorized: FC = () => {
  return (
    <div style={{ padding: "40px" }}>
      <h2>Access Denied</h2>
      <p>You do not have permission to access this page.</p>

      <Link to="/dashboard">
        <button>Go to Dashboard</button>
      </Link>
    </div>
  );
};

export default Unauthorized;
