import React, { useState } from "react";

export default function AddLocationForm({ onAdd, routes }) {
  const [desc, setDesc] = useState("");
  const [notes, setNotes] = useState("");
  const [routeId, setRouteId] = useState("");
  return (
    <form onSubmit={e => {
      e.preventDefault();
      let parsedRouteId = routeId === "" ? null : Number(routeId);
      onAdd({ description: desc, notes, routeId: parsedRouteId });
      setDesc(""); setNotes(""); setRouteId("");
    }}>
      <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description" required />
      <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes" />
      <select value={routeId} onChange={e => setRouteId(e.target.value)}>
        <option key="add-form-no-route" value="">No Route</option>
        {routes.map(r => <option key={`add-form-route-${r.id}`} value={r.id}>{r.name}</option>)}
      </select>
      <button type="submit">Add Location</button>
    </form>
  );
}
