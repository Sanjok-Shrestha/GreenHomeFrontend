import api from "../api";
import { useState } from "react";

export default function PostWaste() {
  const [wasteType, setWasteType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!wasteType.trim() || !quantity.trim()) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await api.post("/waste/post", {
        wasteType,
        quantity,
      });
      alert("Estimated Price: Rs " + res.data.estimatedPrice);
      setWasteType("");
      setQuantity("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Post Waste</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <input
        placeholder="Waste Type"
        value={wasteType}
        onChange={(e) => setWasteType(e.target.value)}
        disabled={loading}
      />
      <input
        placeholder="Quantity"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        disabled={loading}
      />
      <button onClick={submit} disabled={loading}>
        {loading ? "Submitting..." : "Submit"}
      </button>
    </div>
  );
}
