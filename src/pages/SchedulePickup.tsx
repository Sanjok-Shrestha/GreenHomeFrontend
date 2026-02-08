import { useState } from "react";
import axios from "axios";

interface Props {
  wasteId: string;
}

const SchedulePickup = ({ wasteId }: Props) => {
  const [pickupDate, setPickupDate] = useState("");

  const handleSchedule = async () => {
    const token = localStorage.getItem("token");

    await axios.put(
      `http://localhost:5000/api/waste/schedule/${wasteId}`,
      { pickupDate },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    alert("Pickup Scheduled!");
  };

  return (
    <div>
      <h2>Schedule Pickup</h2>

      <input
        type="datetime-local"
        value={pickupDate}
        onChange={(e) => setPickupDate(e.target.value)}
      />

      <button onClick={handleSchedule}>Schedule</button>
    </div>
  );
};

export default SchedulePickup;
