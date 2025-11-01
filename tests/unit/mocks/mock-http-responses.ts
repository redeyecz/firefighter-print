/**
 * Mock HTTP Responses for Mapy.cz API
 * Based on official OpenAPI specification: https://api.mapy.com/v1/docs/routing/openapi.json
 */

/**
 * Mock successful routing response from Mapy.cz API
 * Route from Prague (14.40094, 50.0711) to Brno (16.5990122, 49.1718222)
 */
export const mockMapyCzRoutingSuccess = {
  length: 198450, // meters (approximately 198 km)
  duration: 7200, // seconds (2 hours)
  geometry: {
    type: "Feature" as const,
    geometry: {
      type: "LineString" as const,
      coordinates: [
        [14.40094, 50.0711], // Prague (start)
        [14.42, 50.08],
        [14.45, 50.1],
        [14.5, 50.15],
        [14.6, 50.2],
        [14.8, 50.25],
        [15.0, 50.3],
        [15.2, 50.28],
        [15.4, 50.25],
        [15.6, 50.2],
        [15.8, 50.15],
        [16.0, 49.95],
        [16.2, 49.75],
        [16.4, 49.5],
        [16.5, 49.3],
        [16.5990122, 49.1718222], // Brno (end)
      ],
    },
    properties: {},
  },
};

/**
 * Mock successful routing response - short route
 * Route between two nearby points in Olomouc
 */
export const mockMapyCzRoutingShortRoute = {
  length: 5420, // meters (approximately 5.4 km)
  duration: 480, // seconds (8 minutes)
  geometry: {
    type: "Feature" as const,
    geometry: {
      type: "LineString" as const,
      coordinates: [
        [17.250932, 49.593793], // Start
        [17.251, 49.594],
        [17.252, 49.595],
        [17.253, 49.596],
        [17.254, 49.597],
        [17.255, 49.598],
        [17.256, 49.599],
        [17.257432, 49.599810], // End
      ],
    },
    properties: {},
  },
};

/**
 * Mock error response - Route not found (404)
 * Based on OpenAPI spec error format
 */
export const mockMapyCzRouting404Error = {
  detail: [
    {
      msg: "Edge not found",
      errorCode: 7,
    },
  ],
};

/**
 * Mock error response - Disconnected areas (404)
 */
export const mockMapyCzRoutingDisconnectedError = {
  detail: [
    {
      msg: "Disconnected areas",
      errorCode: 9,
    },
  ],
};

/**
 * Mock error response - Unauthorized (401)
 */
export const mockMapyCzRouting401Error = {
  detail: [
    {
      msg: "Unauthorized - Invalid API key",
      errorCode: 401,
    },
  ],
};

/**
 * Mock error response - Forbidden (403)
 */
export const mockMapyCzRouting403Error = {
  detail: [
    {
      msg: "Forbidden - API key lacks permission",
      errorCode: 403,
    },
  ],
};

/**
 * Mock error response - Service unavailable (503)
 */
export const mockMapyCzRouting503Error = {
  detail: "Service temporarily unavailable",
};

/**
 * Test GPS coordinates
 */
export const testCoordinates = {
  pragueCastle: {
    latitude: 50.0911,
    longitude: 14.4016,
  },
  pragueMainStation: {
    latitude: 50.0833,
    longitude: 14.4353,
  },
  brnoCathedral: {
    latitude: 49.1918,
    longitude: 16.6079,
  },
  olomoucTownHall: {
    latitude: 49.5938,
    longitude: 17.2509,
  },
  fireStationOlomouc: {
    latitude: 49.593793,
    longitude: 17.250932,
  },
  emergencyLocationOlomouc: {
    latitude: 49.599810,
    longitude: 17.257432,
  },
};
