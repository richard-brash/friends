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
};

export type RequestItem = {
  id: string;
  description: string;
  quantityRequested: number;
  quantityDelivered?: number;
};

export type RequestSummary = {
  id: string;
  status: "REQUESTED" | "PREPARING" | "READY" | "DELIVERED" | "CANCELLED";
  person?: {
    displayName: string | null;
  };
  items: RequestItem[];
};

export type LocationDetail = {
  id: string;
  name: string;
  people: PersonSummary[];
  requests: RequestSummary[];
};
