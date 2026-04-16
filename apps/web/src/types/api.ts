export type RouteSummary = {
  id: string;
  name: string;
  stopCount: number;
};

export type RouteStop = {
  stopOrder: number;
  location: {
    id: string;
    name: string;
  };
};

export type RouteDetail = {
  id: string;
  name: string;
  stops: RouteStop[];
};

export type PersonSummary = {
  id: string;
  displayName: string | null;
  lastSeenAt?: string | null;
  lastEncounterAt?: string | null;
  lastEncounterLocationName?: string | null;
};

export type RequestItem = {
  id: string;
  description: string;
  quantityRequested: number;
  quantityDelivered?: number;
  status?: "OPEN" | "READY" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CLOSED_UNABLE" | "UNAVAILABLE" | "UNAVAILABLE_REVERSED";
};

export type RequestHistoryEntry = {
  timestamp: string;
  title: string;
  detail?: string;
};

export type RequestSummary = {
  id: string;
  status: "REQUESTED" | "PREPARING" | "READY" | "DELIVERED" | "CANCELLED" | "CLOSED_UNABLE";
  person?: {
    displayName: string | null;
  };
  items: RequestItem[];
  history: RequestHistoryEntry[];
};

export type LocationDetail = {
  id: string;
  name: string;
  people: PersonSummary[];
  requests: RequestSummary[];
};

export type LocationOption = {
  id: string;
  name: string;
};
