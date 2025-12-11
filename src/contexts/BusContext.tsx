import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Bus, Booking } from '@/types/bus';
import { initialBuses, simulateBusMovement } from '@/data/busData';

interface BusContextType {
  buses: Bus[];
  bookings: Booking[];
  selectedBus: Bus | null;
  setSelectedBus: (bus: Bus | null) => void;
  updateBusLocation: (busId: string, lat: number, lng: number, placeName: string) => void;
  updateBusStatus: (busId: string, status: Bus['status']) => void;
  createBooking: (booking: Omit<Booking, 'id' | 'bookedAt'>) => Booking;
  cancelBooking: (bookingId: string) => void;
  getUserBookings: (userId: string) => Booking[];
}

const BusContext = createContext<BusContextType | undefined>(undefined);

export function BusProvider({ children }: { children: React.ReactNode }) {
  const [buses, setBuses] = useState<Bus[]>(initialBuses);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);

  // Simulate real-time bus movement
  useEffect(() => {
    const interval = setInterval(() => {
      setBuses((prevBuses) =>
        prevBuses.map((bus) => simulateBusMovement(bus))
      );
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

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
        setSelectedBus,
        updateBusLocation,
        updateBusStatus,
        createBooking,
        cancelBooking,
        getUserBookings,
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
