import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Bus, Booking } from '@/types/bus';
import { initialBuses, simulateBusMovement } from '@/data/busData';

interface BusContextType {
  buses: Bus[];
  bookings: Booking[];
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
  const [buses, setBuses] = useState<Bus[]>(initialBuses);
  const [bookings, setBookings] = useState<Booking[]>([]);
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
      setBookings((prev) => [...prev, newBooking]);
      return newBooking;
    },
    []
  );

  const cancelBooking = useCallback((bookingId: string) => {
    setBookings((prev) =>
      prev.map((booking) =>
        booking.id === bookingId
          ? { ...booking, status: 'cancelled' as const }
          : booking
      )
    );
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
