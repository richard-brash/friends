import React from "react";
import RouteSection from "./RouteSection";

export default function RouteList({ routes, locations, ...handlers }) {
  // Always include 'No Route' as a pseudo-route
  const allRoutes = [...routes, { id: "noroute", name: "No Route" }];

  return (
    <div>
      {allRoutes.map((routeData, index) => {
        const isNoRoute = routeData.id === "noroute";
        const route = isNoRoute ? null : routeData;
        const routeId = isNoRoute ? null : routeData.id;
        
        return (
          <RouteSection
            key={routeData.id || `route-${index}`}
            route={route}
            locations={locations.filter(l => (isNoRoute ? !l.routeId : l.routeId === routeId))}
            routes={routes}
            {...handlers}
          />
        );
      })}
    </div>
  );
}
