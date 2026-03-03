import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useBus } from '@/contexts/BusContext';
import { Bus, Booking } from '@/types/bus';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { X, Bus as BusIcon, MapPin, Calendar, Users, CreditCard, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookingModalProps {
  bus: Bus;
  isOpen: boolean;
  onClose: () => void;
}

export default function BookingModal({ bus, isOpen, onClose }: BookingModalProps) {
  const { user } = useAuth();
  const { createBooking, busSeats } = useBus();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    passengerName: user?.name || '',
    passengerPhone: user?.phone || '',
    fromStop: '',
    toStop: '',
    date: new Date().toISOString().split('T')[0],
    seatCount: 1,
  });
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const maxSelectable = 5; // limit selection to 5 seats in UI

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: 'Login required', description: 'Please sign in to book tickets.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const bookingPayload = {
      busId: bus.id,
      userId: user.id,
      passengerName: formData.passengerName,
      passengerPhone: formData.passengerPhone,
      fromStop: formData.fromStop,
      toStop: formData.toStop,
      date: new Date(formData.date),
      seatCount: selectedSeats.length || formData.seatCount,
      seatNumbers: selectedSeats.length > 0 ? selectedSeats : undefined,
      status: 'confirmed' as const,
      totalFare: (selectedSeats.length || formData.seatCount) * 50, // Base fare calculation
    };

    console.debug('Booking payload', bookingPayload);

    try {
      createBooking(bookingPayload);
    } catch (err) {
      console.error('createBooking error', err);
      toast({ title: 'Booking Failed', description: 'Unable to create booking.', variant: 'destructive' });
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    setStep(3);

    toast({
      title: 'Booking Confirmed!',
      description: `Your ticket for ${bus.busNumber} has been booked successfully.`,
    });
  };

  const resetAndClose = () => {
    setStep(1);
    setFormData({
      passengerName: user?.name || '',
      passengerPhone: user?.phone || '',
      fromStop: '',
      toStop: '',
      date: new Date().toISOString().split('T')[0],
      seatCount: 1,
    });
    setSelectedSeats([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-overlay/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={resetAndClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative p-6 bg-primary text-primary-foreground">
            <button
              onClick={resetAndClose}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-primary-foreground/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary-foreground/10 flex items-center justify-center">
                <BusIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Book Ticket</h2>
                <p className="text-sm text-primary-foreground/80">
                  {bus.busNumber} • {bus.type}
                </p>
              </div>
            </div>
          </div>

          {/* Steps indicator */}
          <div className="flex items-center justify-center gap-2 py-4 bg-muted/30">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                  step >= s
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {step > s ? <CheckCircle className="w-4 h-4" /> : s}
              </div>
            ))}
          </div>

          {/* Content */}
          <div className="p-6">
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="fromStop">From</Label>
                  <Select
                    value={formData.fromStop}
                    onValueChange={(value) => setFormData({ ...formData, fromStop: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select boarding point" />
                    </SelectTrigger>
                    <SelectContent>
                      {bus.route.stops.map((stop) => (
                        <SelectItem key={stop} value={stop}>
                          {stop}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="toStop">To</Label>
                  <Select
                    value={formData.toStop}
                    onValueChange={(value) => setFormData({ ...formData, toStop: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select drop point" />
                    </SelectTrigger>
                    <SelectContent>
                      {bus.route.stops
                        .filter((stop) => stop !== formData.fromStop)
                        .map((stop) => (
                          <SelectItem key={stop} value={stop}>
                            {stop}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seats">Select Seats (click to toggle)</Label>
                    <div className="grid grid-cols-8 gap-2 p-2 rounded-lg bg-muted/10">
                        {Array.from({ length: bus.totalSeats ?? 32 }).map((_, idx) => {
                        const seatId = (idx + 1).toString();
                        const booked = (busSeats[bus.id] || []).includes(seatId);
                        const selected = selectedSeats.includes(seatId);

                        return (
                          <button
                            key={seatId}
                            type="button"
                            title={`Seat ${seatId}`}
                            onClick={() => {
                              if (booked) return;
                              setSelectedSeats((s) => {
                                let next: string[];
                                if (s.includes(seatId)) {
                                  next = s.filter((x) => x !== seatId);
                                } else {
                                  if (s.length >= maxSelectable) return s;
                                  next = [...s, seatId];
                                }
                                setFormData((f) => ({ ...f, seatCount: next.length }));
                                return next;
                              });
                            }}
                            className={cn(
                              'px-2 py-1 rounded text-xs font-medium transition-colors',
                              booked
                                ? 'bg-status-unavailable/20 text-status-unavailable cursor-not-allowed'
                                : selected
                                ? 'bg-accent text-accent-foreground'
                                : 'bg-secondary text-secondary-foreground hover:bg-accent/5'
                            )}
                            disabled={booked}
                          >
                            {seatId}
                          </button>
                        );
                      })}
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      Selected: {selectedSeats.length} / {maxSelectable}
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={() => setStep(2)}
                  disabled={!formData.fromStop || !formData.toStop || selectedSeats.length === 0}
                >
                  Continue
                </Button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.form
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="passengerName">Passenger Name</Label>
                  <Input
                    id="passengerName"
                    value={formData.passengerName}
                    onChange={(e) => setFormData({ ...formData, passengerName: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passengerPhone">Phone Number</Label>
                  <Input
                    id="passengerPhone"
                    type="tel"
                    value={formData.passengerPhone}
                    onChange={(e) => setFormData({ ...formData, passengerPhone: e.target.value })}
                    required
                  />
                </div>

                {/* Booking Summary */}
                <div className="p-4 rounded-xl bg-muted/50 space-y-2">
                  <h4 className="font-medium text-foreground">Booking Summary</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Route</span>
                      <span>{formData.fromStop} → {formData.toStop}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date</span>
                      <span>{new Date(formData.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Seats</span>
                      <span>{selectedSeats.length || formData.seatCount}</span>
                    </div>
                    {selectedSeats.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        Selected Seats: {selectedSeats.join(', ')}
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-border font-medium">
                      <span>Total Fare</span>
                      <span className="text-accent">₹{(selectedSeats.length || formData.seatCount) * 50}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                    Back
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isSubmitting}>
                    {isSubmitting ? 'Booking...' : 'Confirm Booking'}
                  </Button>
                </div>
              </motion.form>
            )}

            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6"
              >
                <div className="w-16 h-16 rounded-full bg-status-active/15 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-status-active" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Booking Confirmed!</h3>
                <p className="text-muted-foreground mb-6">
                  Your ticket has been booked successfully. You will receive a confirmation shortly.
                </p>
                <Button onClick={resetAndClose} className="w-full">
                  Done
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
