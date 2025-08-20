import React from "react";
import LocationItem from "./LocationItem";

export default function LocationList({ locations, route, routes, ...handlers }) {
  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {locations.map((loc, index) => (
        <LocationItem 
          key={loc.id || `temp-location-${index}`} 
          location={loc} 
          route={route} 
          locations={locations} 
          routes={routes} 
          {...handlers} 
        />
      ))}
    </ul>
  );
}
