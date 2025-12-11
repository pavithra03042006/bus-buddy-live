import { Bus } from '@/types/bus';

// Tirunelveli area route coordinates for realistic bus movement
const routeCoordinates: Record<string, [number, number][]> = {
  'route-1': [
    [8.7139, 77.7567], // Tirunelveli Junction
    [8.7180, 77.7520], // Palayamkottai
    [8.7220, 77.7480], // Melapalayam
    [8.7089, 77.7517], // Vannarpettai
  ],
  'route-2': [
    [8.7089, 77.7517], // Vannarpettai Bus Stand
    [8.7050, 77.7550], // NGO Colony
    [8.7000, 77.7600], // Pettai
    [8.7239, 77.7467], // GCE Main Gate
  ],
  'route-3': [
    [8.7239, 77.7467], // GCE Main Gate
    [8.7300, 77.7400], // Thatchanallur
    [8.7350, 77.7350], // Town Hall
    [8.7400, 77.7300], // Francis Xavier College
  ],
  'route-4': [
    [8.7139, 77.7567], // Tirunelveli
    [8.7180, 77.7520], // Junction
    [8.7220, 77.7480], // Palayamkottai
    [8.7400, 77.7300], // Francis Xavier College
  ],
};

// Track current position index for each bus
const busPositionIndex: Record<string, number> = {};
const busDirection: Record<string, 1 | -1> = {}; // 1 = forward, -1 = backward

export const initialBuses: Bus[] = [
  {
    id: 'bus-1',
    busNumber: 'TN-01',
    type: 'AC',
    route: {
      id: 'route-1',
      name: 'Route 1',
      from: 'Tirunelveli',
      to: 'Vannarpettai',
      stops: ['Tirunelveli Junction', 'Palayamkottai', 'Melapalayam', 'Vannarpettai'],
    },
    driver: {
      name: 'Rajesh Kumar',
      phone: '+91 98765 43210',
    },
    conductor: {
      name: 'Suresh M',
    },
    currentLocation: {
      lat: 8.7139,
      lng: 77.7567,
      placeName: 'Tirunelveli Junction',
      timestamp: new Date(),
    },
    nextStop: 'Palayamkottai',
    status: 'active',
  },
  {
    id: 'bus-2',
    busNumber: 'TN-02',
    type: 'Non-AC',
    route: {
      id: 'route-2',
      name: 'Route 2',
      from: 'Vannarpettai',
      to: 'GCE Engineering College',
      stops: ['Vannarpettai Bus Stand', 'NGO Colony', 'Pettai', 'GCE Main Gate'],
    },
    driver: {
      name: 'Murugan S',
      phone: '+91 98765 43211',
    },
    conductor: {
      name: 'Karthik R',
    },
    currentLocation: {
      lat: 8.7089,
      lng: 77.7517,
      placeName: 'Near Vannarpettai Bus Stand',
      timestamp: new Date(),
    },
    nextStop: 'NGO Colony',
    status: 'active',
  },
  {
    id: 'bus-3',
    busNumber: 'TN-03',
    type: 'AC',
    route: {
      id: 'route-3',
      name: 'Route 3',
      from: 'GCE Engineering College',
      to: 'Francis Xavier College',
      stops: ['GCE Main Gate', 'Thatchanallur', 'Town Hall', 'Francis Xavier College'],
    },
    driver: {
      name: 'Senthil V',
      phone: '+91 98765 43212',
    },
    conductor: {
      name: 'Arun P',
    },
    currentLocation: {
      lat: 8.7239,
      lng: 77.7467,
      placeName: 'GCE Main Gate',
      timestamp: new Date(),
    },
    nextStop: 'Thatchanallur',
    status: 'active',
  },
  {
    id: 'bus-4',
    busNumber: 'TN-04',
    type: 'Non-AC',
    route: {
      id: 'route-4',
      name: 'Route 4',
      from: 'Tirunelveli',
      to: 'Francis Xavier College',
      stops: ['Tirunelveli', 'Junction', 'Palayamkottai', 'Francis Xavier College'],
    },
    driver: {
      name: 'Vijay K',
      phone: '+91 98765 43213',
    },
    conductor: {
      name: 'Manikandan L',
    },
    currentLocation: {
      lat: 8.7039,
      lng: 77.7667,
      placeName: 'Unknown Location',
      timestamp: new Date(),
    },
    nextStop: 'Junction',
    status: 'unavailable',
  },
];

// Initialize bus positions
initialBuses.forEach((bus) => {
  busPositionIndex[bus.id] = 0;
  busDirection[bus.id] = 1;
});

// Interpolate between two points
function interpolate(
  start: [number, number],
  end: [number, number],
  progress: number
): [number, number] {
  return [
    start[0] + (end[0] - start[0]) * progress,
    start[1] + (end[1] - start[1]) * progress,
  ];
}

// Get place name based on coordinates
function getPlaceName(bus: Bus, coords: [number, number]): string {
  const route = routeCoordinates[bus.route.id];
  if (!route) return bus.currentLocation.placeName;

  // Find closest stop
  let minDist = Infinity;
  let closestStopIndex = 0;

  route.forEach((stop, index) => {
    const dist = Math.sqrt(
      Math.pow(stop[0] - coords[0], 2) + Math.pow(stop[1] - coords[1], 2)
    );
    if (dist < minDist) {
      minDist = dist;
      closestStopIndex = index;
    }
  });

  const stopNames = bus.route.stops;
  if (minDist < 0.002) {
    return stopNames[closestStopIndex] || 'On Route';
  }
  return `Near ${stopNames[closestStopIndex] || 'Route'}`;
}

// Get next stop
function getNextStop(bus: Bus, currentIndex: number, direction: 1 | -1): string {
  const stops = bus.route.stops;
  const nextIndex = currentIndex + direction;
  if (nextIndex >= 0 && nextIndex < stops.length) {
    return stops[nextIndex];
  }
  return direction === 1 ? stops[stops.length - 1] : stops[0];
}

// Simulate realistic bus movement along route
export function simulateBusMovement(bus: Bus): Bus {
  if (bus.status === 'unavailable') return bus;

  const route = routeCoordinates[bus.route.id];
  if (!route || route.length < 2) {
    // Random movement if no route defined
    const movementRange = 0.0008;
    return {
      ...bus,
      currentLocation: {
        ...bus.currentLocation,
        lat: bus.currentLocation.lat + (Math.random() - 0.5) * movementRange,
        lng: bus.currentLocation.lng + (Math.random() - 0.5) * movementRange,
        timestamp: new Date(),
      },
    };
  }

  // Get current position tracking
  let posIndex = busPositionIndex[bus.id] || 0;
  let direction = busDirection[bus.id] || 1;

  // Calculate next position with smooth interpolation
  const progress = Math.random() * 0.3 + 0.1; // 10-40% progress per update
  
  const currentPos = route[Math.floor(posIndex)];
  const nextPosIndex = Math.floor(posIndex) + direction;
  
  // Check bounds and reverse direction if needed
  if (nextPosIndex >= route.length) {
    busDirection[bus.id] = -1;
    direction = -1;
  } else if (nextPosIndex < 0) {
    busDirection[bus.id] = 1;
    direction = 1;
  }

  const targetIndex = Math.max(0, Math.min(route.length - 1, Math.floor(posIndex) + direction));
  const targetPos = route[targetIndex];

  // Interpolate position
  const newCoords = interpolate(currentPos, targetPos, progress);

  // Update position index
  const newPosIndex = posIndex + direction * progress;
  busPositionIndex[bus.id] = Math.max(0, Math.min(route.length - 1, newPosIndex));

  // Add slight randomness for realistic GPS jitter
  const jitter = 0.0002;
  const finalLat = newCoords[0] + (Math.random() - 0.5) * jitter;
  const finalLng = newCoords[1] + (Math.random() - 0.5) * jitter;

  const placeName = getPlaceName(bus, [finalLat, finalLng]);
  const nextStop = getNextStop(bus, Math.floor(newPosIndex), direction);

  return {
    ...bus,
    currentLocation: {
      lat: finalLat,
      lng: finalLng,
      placeName,
      timestamp: new Date(),
    },
    nextStop,
  };
}

// Calculate distance between two coordinates in km
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate ETA based on average speed
export function calculateETA(distanceKm: number, avgSpeedKmh: number = 25): number {
  return Math.round((distanceKm / avgSpeedKmh) * 60); // Returns minutes
}
