export type BusStatus = 'active' | 'unavailable' | 'substitute';

export interface BusLocation {
  lat: number;
  lng: number;
  placeName: string;
  timestamp: Date;
}

export interface Bus {
  id: string;
  busNumber: string;
  type: 'AC' | 'Non-AC';
  route: {
    id: string;
    name: string;
    from: string;
    to: string;
    stops: string[];
  };
  driver: {
    name: string;
    phone: string;
  };
  conductor: {
    name: string;
  };
  currentLocation: BusLocation;
  nextStop: string;
  status: BusStatus;
  substituteBus?: {
    busNumber: string;
    replacedAt: Date;
  };
  // Total number of seats on the bus (used for seat selection UI)
  totalSeats?: number;
}

export interface Booking {
  id: string;
  busId: string;
  userId: string;
  passengerName: string;
  passengerPhone: string;
  fromStop: string;
  toStop: string;
  date: Date;
  seatCount: number;
  // Optional list of specific seat identifiers (like ['1','2','3'])
  seatNumbers?: string[];
  status: 'confirmed' | 'cancelled' | 'completed';
  bookedAt: Date;
  totalFare: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'passenger' | 'driver' | 'admin';
}
