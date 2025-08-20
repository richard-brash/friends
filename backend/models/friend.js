// Friend model (in-memory for now)
export let friends = [];
let nextId = 1;

export function getAllFriends(locationsRef) {
  return friends.map(friend => {
    // Enrich with location details for history
    const enrichedHistory = friend.locationHistory.map(entry => {
      const location = locationsRef.find(l => l.id === entry.locationId);
      return {
        ...entry,
        locationName: location ? location.description : 'Unknown Location'
      };
    });

    // Get last known location
    const lastKnownEntry = friend.locationHistory.length > 0 
      ? friend.locationHistory[friend.locationHistory.length - 1]
      : null;
    
    const lastKnownLocation = lastKnownEntry 
      ? locationsRef.find(l => l.id === lastKnownEntry.locationId)
      : null;

    return {
      ...friend,
      locationHistory: enrichedHistory,
      lastKnownLocation: lastKnownLocation ? {
        ...lastKnownLocation,
        dateRecorded: lastKnownEntry.dateRecorded,
        notes: lastKnownEntry.notes
      } : null
    };
  });
}

export function addFriend(name, phone = "", email = "", notes = "") {
  const friend = {
    id: nextId++,
    name,
    phone,
    email,
    notes,
    locationHistory: [], // Array of { locationId, dateRecorded, notes }
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  friends.push(friend);
  return friend;
}

export function updateFriend(id, updates) {
  const friend = friends.find(f => f.id === id);
  if (!friend) return null;

  // Update basic fields
  if (updates.name !== undefined) friend.name = updates.name;
  if (updates.phone !== undefined) friend.phone = updates.phone;
  if (updates.email !== undefined) friend.email = updates.email;
  if (updates.notes !== undefined) friend.notes = updates.notes;
  
  friend.updatedAt = new Date().toISOString();
  return friend;
}

export function addLocationToFriendHistory(friendId, locationId, notes = "", dateRecorded = null) {
  const friend = friends.find(f => f.id === friendId);
  if (!friend) return null;

  const historyEntry = {
    locationId,
    dateRecorded: dateRecorded || new Date().toISOString(),
    notes,
    id: Date.now() // Simple ID for history entries
  };

  friend.locationHistory.push(historyEntry);
  friend.updatedAt = new Date().toISOString();
  return friend;
}

export function updateLocationHistory(friendId, historyEntryId, updates) {
  const friend = friends.find(f => f.id === friendId);
  if (!friend) return null;

  const entry = friend.locationHistory.find(e => e.id === historyEntryId);
  if (!entry) return null;

  if (updates.locationId !== undefined) entry.locationId = updates.locationId;
  if (updates.dateRecorded !== undefined) entry.dateRecorded = updates.dateRecorded;
  if (updates.notes !== undefined) entry.notes = updates.notes;

  friend.updatedAt = new Date().toISOString();
  return friend;
}

export function removeLocationHistory(friendId, historyEntryId) {
  const friend = friends.find(f => f.id === friendId);
  if (!friend) return null;

  friend.locationHistory = friend.locationHistory.filter(e => e.id !== historyEntryId);
  friend.updatedAt = new Date().toISOString();
  return friend;
}

export function deleteFriend(id) {
  friends = friends.filter(f => f.id !== id);
}

export function getFriendsAtLocation(locationId) {
  return friends.filter(friend => 
    friend.locationHistory.some(entry => entry.locationId === locationId)
  );
}

export function getFriendsLastSeenAt(locationId) {
  return friends.filter(friend => {
    const lastEntry = friend.locationHistory[friend.locationHistory.length - 1];
    return lastEntry && lastEntry.locationId === locationId;
  });
}
