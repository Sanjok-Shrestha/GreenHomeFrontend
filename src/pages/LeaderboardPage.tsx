import { useEffect, useState } from "react";
import axios from "axios";

interface User {
  name: string;
  points: number;
}

const LeaderboardPage = () => {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    axios
      .get("http://localhost:3000/api/users/leaderboard")
      .then((res) => setUsers(res.data))
      .catch(() => alert("Error loading leaderboard"));
  }, []);

  return (
    <div style={{ padding: "30px" }}>
      <h2>🏆 Leaderboard</h2>

      <table style={{ width: "100%", marginTop: "20px", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ borderBottom: "1px solid black" }}>Rank</th>
            <th style={{ borderBottom: "1px solid black" }}>Name</th>
            <th style={{ borderBottom: "1px solid black" }}>Points</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user, index) => (
            <tr key={index}>
              <td style={{ padding: "10px" }}>{index + 1}</td>
              <td style={{ padding: "10px" }}>{user.name}</td>
              <td style={{ padding: "10px" }}>{user.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LeaderboardPage;
