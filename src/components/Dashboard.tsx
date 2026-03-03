import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useBus } from '@/contexts/BusContext';
import BusMap from '@/components/BusMap';
import BusList from '@/components/BusList';
import BusDetailsPanel from '@/components/BusDetailsPanel';
import BookingModal from '@/components/BookingModal';
import MyBookings from '@/components/MyBookings';
import { Button } from '@/components/ui/button';
import AdminPanel from '@/components/AdminPanel';
import { Bus as BusIcon, LogOut, Ticket, Menu, X, MapPin, List, Radio, CircleOff, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { buses, selectedBus, setSelectedBus, isTracking, toggleTracking, lastUpdate, addBus, removeBus, substituteBus } = useBus();
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isMyBookingsOpen, setIsMyBookingsOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState<'map' | 'list'>('map');

  const handleBookTicket = () => {
    console.debug('handleBookTicket', { selectedBus, user });
    if (!user) {
      toast({ title: 'Login required', description: 'Please sign in to book tickets. Redirecting to login...', variant: 'destructive' });
      // Persist intent so we can reopen the booking modal after login
      try {
        if (selectedBus) {
          sessionStorage.setItem('pending_booking', JSON.stringify({ action: 'book', busId: selectedBus.id }));
        }
      } catch {}
      // Reload to root so Index.tsx shows the AuthPage for unauthenticated users
      setTimeout(() => {
        try { window.location.assign('/'); } catch { window.location.reload(); }
      }, 600);
      return;
    }

    if (selectedBus) {
      setIsBookingOpen(true);
    }
  };

  // If there was a pending booking intent saved before redirecting to login, open it now
  React.useEffect(() => {
    try {
      const raw = sessionStorage.getItem('pending_booking');
      if (!raw) return;
      const pending = JSON.parse(raw) as { action?: string; busId?: string } | null;
      if (!pending) return;
      if (pending.action === 'book' && pending.busId && user) {
        const found = buses.find((b) => b.id === pending.busId);
        if (found) {
          setSelectedBus(found);
          setIsBookingOpen(true);
          sessionStorage.removeItem('pending_booking');
        }
      }
    } catch (e) {
      // ignore errors
    }
  }, [user, buses, setSelectedBus]);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-border bg-card/80 backdrop-blur-lg flex items-center justify-between px-4 lg:px-6 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <BusIcon className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-bold text-foreground">BusTracker</h1>
              <p className="text-xs text-muted-foreground">Real-time tracking</p>
            </div>
          </div>
        </div>

        {/* Live Tracking Indicator */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted">
            <div className={cn(
              "w-2 h-2 rounded-full",
              isTracking ? "bg-status-active animate-pulse" : "bg-muted-foreground"
            )} />
            <span className="text-xs font-medium text-muted-foreground">
              {isTracking ? 'Live Tracking' : 'Tracking Paused'}
            </span>
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {lastUpdate.toLocaleTimeString()}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTracking}
            className={cn(
              "gap-2",
              isTracking ? "text-status-active" : "text-muted-foreground"
            )}
          >
            {isTracking ? <Radio className="w-4 h-4" /> : <CircleOff className="w-4 h-4" />}
            <span className="hidden sm:inline">{isTracking ? 'Live' : 'Paused'}</span>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle - Mobile */}
          <div className="flex lg:hidden bg-muted rounded-lg p-1">
            <button
              onClick={() => setActiveView('map')}
              className={cn(
                'p-2 rounded-md transition-colors',
                activeView === 'map' ? 'bg-card shadow-sm' : 'text-muted-foreground'
              )}
            >
              <MapPin className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveView('list')}
              className={cn(
                'p-2 rounded-md transition-colors',
                activeView === 'list' ? 'bg-card shadow-sm' : 'text-muted-foreground'
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <Button variant="outline" size="sm" onClick={() => setIsMyBookingsOpen(true)}>
            <Ticket className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">My Bookings</span>
          </Button>
          {user?.role === 'admin' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsAdminPanelOpen(true)}
            >
              Admin Panel
            </Button>
          )}
          
          <div className="flex items-center gap-2 pl-2 border-l border-border">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-foreground">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={logout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Bus List */}
        <AnimatePresence>
          {(isSidebarOpen || activeView === 'list') && (
            <motion.aside
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={cn(
                'w-full lg:w-80 bg-card/95 backdrop-blur-xl border-r border-border overflow-hidden flex flex-col',
                'absolute lg:relative inset-0 z-10',
                activeView === 'map' && 'hidden lg:flex'
              )}
            >
              <div className="p-4 border-b border-border">
                <h2 className="font-semibold text-foreground">Available Buses</h2>
                <p className="text-sm text-muted-foreground">Select a bus to track or book</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
                <BusList onBusSelect={() => setActiveView('map')} />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Map Area */}
        <div className={cn(
          'flex-1 relative',
          activeView === 'list' && 'hidden lg:block'
        )}>
          <BusMap />

          {/* Map Legend */}
          <div className="absolute top-4 right-4 bg-card/90 backdrop-blur-sm rounded-xl p-4 z-10 border border-border">
            <h3 className="text-sm font-medium text-foreground mb-3">Status Legend</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full bg-status-active relative">
                  <div className="absolute inset-0 rounded-full bg-status-active animate-ping opacity-50" />
                </div>
                <span className="text-muted-foreground">Active (Live)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full bg-status-unavailable" />
                <span className="text-muted-foreground">Not Available</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full bg-status-substitute" />
                <span className="text-muted-foreground">Substitute</span>
              </div>
            </div>
          </div>

          {/* Real-time Update Indicator */}
          <div className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm rounded-lg px-3 py-2 z-10 border border-border">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                isTracking ? "bg-status-active animate-pulse" : "bg-muted-foreground"
              )} />
              <span className="text-xs font-medium">
                {isTracking ? 'GPS Active' : 'GPS Paused'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Panel - Bus Details (Fixed, Non-overlapping) */}
        <AnimatePresence>
          {selectedBus && (
            <motion.aside
              initial={{ x: 320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 320, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full lg:w-96 bg-card border-l border-border overflow-y-auto flex flex-col absolute lg:relative inset-0 lg:inset-auto z-20 lg:z-40"
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-foreground">Bus Details</h2>
                  <p className="text-sm text-muted-foreground">View info and book tickets</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedBus(null)}
                  className="lg:hidden"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="flex-1 p-4">
                <BusDetailsPanel
                  bus={selectedBus}
                  onClose={() => setSelectedBus(null)}
                  onBookTicket={handleBookTicket}
                />

                {user?.role === 'admin' && (
                  <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-medium text-foreground">Admin Controls</h4>
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        onClick={() => {
                          if (!selectedBus) return;
                          const ok = window.confirm(`Remove bus ${selectedBus.busNumber}? This will cancel its bookings.`);
                          if (!ok) return;
                          removeBus(selectedBus.id);
                          setSelectedBus(null);
                        }}
                      >
                        Remove Bus
                      </Button>

                      <Button
                        onClick={() => {
                          if (!selectedBus) return;
                          const sub = window.prompt('Substitute bus number', `${selectedBus.busNumber}-SUB`);
                          if (!sub) return;
                          substituteBus(selectedBus.id, sub);
                        }}
                      >
                        Substitute Bus
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Booking Modal */}
      {selectedBus && (
        <BookingModal
          bus={selectedBus}
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
        />
      )}

      <AdminPanel isOpen={isAdminPanelOpen} onClose={() => setIsAdminPanelOpen(false)} />

      {/* My Bookings Modal */}
      <MyBookings isOpen={isMyBookingsOpen} onClose={() => setIsMyBookingsOpen(false)} />
    </div>
  );
}
