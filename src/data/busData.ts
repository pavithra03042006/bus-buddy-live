import { Bus } from '@/types/bus';

// Tirunelveli area coordinates
const TIRUNELVELI_CENTER = { lat: 8.7139, lng: 77.7567 };

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

// Simulate bus movement
export function simulateBusMovement(bus: Bus): Bus {
  if (bus.status === 'unavailable') return bus;

  const movementRange = 0.002;
  const newLat = bus.currentLocation.lat + (Math.random() - 0.5) * movementRange;
  const newLng = bus.currentLocation.lng + (Math.random() - 0.5) * movementRange;

  return {
    ...bus,
    currentLocation: {
      ...bus.currentLocation,
      lat: newLat,
      lng: newLng,
      timestamp: new Date(),
    },
  };
}
