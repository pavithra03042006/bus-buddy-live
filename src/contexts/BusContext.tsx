import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Bus, Booking } from '@/types/bus';
import { initialBuses, simulateBusMovement } from '@/data/busData';

interface BusContextType {
  buses: Bus[];
  bookings: Booking[];
  // map of busId -> list of booked seat identifiers
  busSeats: Record<string, string[]>;
  addBus: (bus: Omit<Bus, 'id' | 'currentLocation' | 'nextStop'>) => Bus;
  removeBus: (busId: string) => void;
  substituteBus: (busId: string, substituteBusNumber: string) => void;
  selectedBus: Bus | null;
  isTracking: boolean;
  lastUpdate: Date;
  setSelectedBus: (bus: Bus | null) => void;
  updateBusLocation: (busId: string, lat: number, lng: number, placeName: string) => void;
  updateBusStatus: (busId: string, status: Bus['status']) => void;
  createBooking: (booking: Omit<Booking, 'id' | 'bookedAt'>) => Booking;
  cancelBooking: (bookingId: string) => void;
  getUserBookings: (userId: string) => Booking[];
  toggleTracking: () => void;
}

const BusContext = createContext<BusContextType | undefined>(undefined);

export function BusProvider({ children }: { children: React.ReactNode }) {
  // Initialize from localStorage if present, otherwise use initial data
  const [buses, setBuses] = useState<Bus[]>(() => {
    try {
      const raw = localStorage.getItem('bus_tracker_buses');
      if (raw) return JSON.parse(raw) as Bus[];
    } catch {}
    return initialBuses;
  });

  const [bookings, setBookings] = useState<Booking[]>(() => {
    try {
      const raw = localStorage.getItem('bus_tracker_bookings');
      if (raw) return JSON.parse(raw) as Booking[];
    } catch {}
    return [];
  });

  // track booked seat numbers for each bus (persisted)
  const [busSeats, setBusSeats] = useState<Record<string, string[]>>(() => {
    try {
      const raw = localStorage.getItem('bus_tracker_busSeats');
      if (raw) return JSON.parse(raw) as Record<string, string[]>;
    } catch {}
    const map: Record<string, string[]> = {};
    initialBuses.forEach((b) => {
      map[b.id] = [];
    });
    return map;
  });
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [isTracking, setIsTracking] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Real-time GPS simulation with more frequent updates
  const startTracking = useCallback(() => {
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
    }

    trackingIntervalRef.current = setInterval(() => {
      setBuses((prevBuses) => {
        const updatedBuses = prevBuses.map((bus) => simulateBusMovement(bus));
        setLastUpdate(new Date());
        return updatedBuses;
      });
    }, 2000); // Update every 2 seconds for smooth tracking
  }, []);

  const stopTracking = useCallback(() => {
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }
  }, []);

  const toggleTracking = useCallback(() => {
    setIsTracking((prev) => {
      if (prev) {
        stopTracking();
      } else {
        startTracking();
      }
      return !prev;
    });
  }, [startTracking, stopTracking]);

  // Start tracking on mount
  useEffect(() => {
    if (isTracking) {
      startTracking();
    }
    return () => stopTracking();
  }, [isTracking, startTracking, stopTracking]);

  // Update selected bus when buses update
  useEffect(() => {
    if (selectedBus) {
      const updatedBus = buses.find((b) => b.id === selectedBus.id);
      if (updatedBus) {
        setSelectedBus(updatedBus);
      }
    }
  }, [buses, selectedBus?.id]);

  const updateBusLocation = useCallback(
    (busId: string, lat: number, lng: number, placeName: string) => {
      setBuses((prevBuses) =>
        prevBuses.map((bus) =>
          bus.id === busId
            ? {
                ...bus,
                currentLocation: {
                  lat,
                  lng,
                  placeName,
                  timestamp: new Date(),
                },
              }
            : bus
        )
      );
      setLastUpdate(new Date());
    },
    []
  );

  const updateBusStatus = useCallback(
    (busId: string, status: Bus['status']) => {
      setBuses((prevBuses) =>
        prevBuses.map((bus) =>
          bus.id === busId ? { ...bus, status } : bus
        )
      );
    },
    []
  );

  const createBooking = useCallback(
    (bookingData: Omit<Booking, 'id' | 'bookedAt'>): Booking => {
      const newBooking: Booking = {
        ...bookingData,
        id: `booking-${Date.now()}`,
        bookedAt: new Date(),
      };

      // persist booking
      setBookings((prev) => {
        const next = [...prev, newBooking];
        try { localStorage.setItem('bus_tracker_bookings', JSON.stringify(next)); } catch {}
        return next;
      });

      // mark seats as booked for the bus (if any)
      if (bookingData.seatNumbers && bookingData.seatNumbers.length > 0) {
        setBusSeats((prev) => {
          const copy = { ...prev };
          const existing = copy[bookingData.busId] ?? [];
          copy[bookingData.busId] = [...existing, ...bookingData.seatNumbers!];
          try { localStorage.setItem('bus_tracker_busSeats', JSON.stringify(copy)); } catch {}
          return copy;
        });
      }

      return newBooking;
    },
    []
  );

  const cancelBooking = useCallback((bookingId: string) => {
    setBookings((prev) => {
      const bookingToCancel = prev.find((b) => b.id === bookingId);

      // free seats if booking had seatNumbers
      if (bookingToCancel?.seatNumbers && bookingToCancel.seatNumbers.length > 0) {
        setBusSeats((prevSeats) => {
          const copy = { ...prevSeats };
          const booked = copy[bookingToCancel.busId] ?? [];
          copy[bookingToCancel.busId] = booked.filter(
            (s) => !bookingToCancel.seatNumbers!.includes(s)
          );
          try { localStorage.setItem('bus_tracker_busSeats', JSON.stringify(copy)); } catch {}
          return copy;
        });
      }

      const next = prev.map((booking) =>
        booking.id === bookingId
          ? { ...booking, status: 'cancelled' as const }
          : booking
      );
      try { localStorage.setItem('bus_tracker_bookings', JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  // Admin functions
  const addBus = useCallback((busData: Omit<Bus, 'id' | 'currentLocation' | 'nextStop'>): Bus => {
    const newBus: Bus = {
      ...busData,
      id: `bus-${Date.now()}`,
      currentLocation: {
        lat: 8.7139,
        lng: 77.7567,
        placeName: busData.route.from,
        timestamp: new Date(),
      },
      nextStop: busData.route.stops[1] ?? busData.route.from,
    } as Bus;

    setBuses((prev) => {
      const next = [...prev, newBus];
      try { localStorage.setItem('bus_tracker_buses', JSON.stringify(next)); } catch {}
      return next;
    });

    setBusSeats((prev) => {
      const copy = { ...prev, [newBus.id]: [] };
      try { localStorage.setItem('bus_tracker_busSeats', JSON.stringify(copy)); } catch {}
      return copy;
    });

    return newBus;
  }, []);

  const removeBus = useCallback((busId: string) => {
    setBuses((prev) => {
      const next = prev.filter((b) => b.id !== busId);
      try { localStorage.setItem('bus_tracker_buses', JSON.stringify(next)); } catch {}
      return next;
    });

    setBusSeats((prev) => {
      const copy = { ...prev };
      delete copy[busId];
      try { localStorage.setItem('bus_tracker_busSeats', JSON.stringify(copy)); } catch {}
      return copy;
    });

    // cancel any bookings for this bus
    setBookings((prev) => {
      const next = prev.map((bk) => (bk.busId === busId ? { ...bk, status: 'cancelled' as const } : bk));
      try { localStorage.setItem('bus_tracker_bookings', JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const substituteBus = useCallback((busId: string, substituteBusNumber: string) => {
    setBuses((prev) => {
      const next = prev.map((b) =>
        b.id === busId
          ? { ...b, substituteBus: { busNumber: substituteBusNumber, replacedAt: new Date() }, status: 'substitute' as Bus['status'] }
          : b
      );
      try { localStorage.setItem('bus_tracker_buses', JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const getUserBookings = useCallback(
    (userId: string) => {
      return bookings.filter((booking) => booking.userId === userId);
    },
    [bookings]
  );

  return (
    <BusContext.Provider
      value={{
        buses,
        bookings,
        busSeats,
        addBus,
        removeBus,
        substituteBus,
        selectedBus,
        isTracking,
        lastUpdate,
        setSelectedBus,
        updateBusLocation,
        updateBusStatus,
        createBooking,
        cancelBooking,
        getUserBookings,
        toggleTracking,
      }}
    >
      {children}
    </BusContext.Provider>
  );
}

export function useBus() {
  const context = useContext(BusContext);
  if (context === undefined) {
    throw new Error('useBus must be used within a BusProvider');
  }
  return context;
}
