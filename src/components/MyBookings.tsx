import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useBus } from '@/contexts/BusContext';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { X, Ticket, MapPin, Calendar, Users, Clock, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MyBookingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MyBookings({ isOpen, onClose }: MyBookingsProps) {
  const { user } = useAuth();
  const { bookings, buses, cancelBooking } = useBus();

  const userBookings = user ? bookings.filter((b) => b.userId === user.id) : [];

  const handleCancelBooking = (bookingId: string) => {
    cancelBooking(bookingId);
    toast({
      title: 'Booking Cancelled',
      description: 'Your booking has been cancelled successfully.',
    });
  };

  const getBus = (busId: string) => buses.find((b) => b.id === busId);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-overlay/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-card rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative p-6 bg-primary text-primary-foreground">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-primary-foreground/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary-foreground/10 flex items-center justify-center">
                <Ticket className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">My Bookings</h2>
                <p className="text-sm text-primary-foreground/80">
                  {userBookings.length} {userBookings.length === 1 ? 'booking' : 'bookings'}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)] scrollbar-hide">
            {userBookings.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Ticket className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">No Bookings Yet</h3>
                <p className="text-muted-foreground">
                  Your booked tickets will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {userBookings.map((booking, index) => {
                  const bus = getBus(booking.busId);
                  return (
                    <motion.div
                      key={booking.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={cn(
                        'p-4 rounded-xl border',
                        booking.status === 'cancelled'
                          ? 'bg-status-unavailable/5 border-status-unavailable/20'
                          : 'bg-card border-border'
                      )}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-foreground">{bus?.busNumber || 'Unknown Bus'}</h4>
                          <p className="text-sm text-muted-foreground">{bus?.type}</p>
                        </div>
                        <span
                          className={cn(
                            'status-badge',
                            booking.status === 'confirmed' && 'bg-status-active/15 text-status-active',
                            booking.status === 'cancelled' && 'bg-status-unavailable/15 text-status-unavailable',
                            booking.status === 'completed' && 'bg-muted text-muted-foreground'
                          )}
                        >
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span>{booking.fromStop} → {booking.toStop}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(booking.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>{booking.seatCount} {booking.seatCount === 1 ? 'Seat' : 'Seats'}</span>
                        </div>
                        {booking.seatNumbers && booking.seatNumbers.length > 0 && (
                          <div className="text-sm text-muted-foreground">Seats: {booking.seatNumbers.join(', ')}</div>
                        )}
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>Booked: {new Date(booking.bookedAt).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                        <span className="font-semibold text-foreground">₹{booking.totalFare}</span>
                        {booking.status === 'confirmed' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleCancelBooking(booking.id)}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
