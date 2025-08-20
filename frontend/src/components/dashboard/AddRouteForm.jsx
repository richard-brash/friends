import React, { useState } from "react";

export default function AddRouteForm({ onAdd }) {
  const [name, setName] = useState("");
  return (
    <form onSubmit={e => { e.preventDefault(); onAdd(name); setName(""); }}>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="New route name" required />
      <button type="submit">Add Route</button>
    </form>
  );
}
