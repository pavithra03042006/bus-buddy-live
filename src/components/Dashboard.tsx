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
import { Bus as BusIcon, LogOut, Ticket, Menu, X, MapPin, List } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { selectedBus, setSelectedBus } = useBus();
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isMyBookingsOpen, setIsMyBookingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState<'map' | 'list'>('map');

  const handleBookTicket = () => {
    if (selectedBus) {
      setIsBookingOpen(true);
    }
  };

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
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar - Bus List */}
        <AnimatePresence>
          {(isSidebarOpen || activeView === 'list') && (
            <motion.aside
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={cn(
                'w-full lg:w-96 bg-card/95 backdrop-blur-xl border-r border-border overflow-hidden flex flex-col',
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

          {/* Selected Bus Details Panel */}
          <AnimatePresence>
            {selectedBus && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-4 left-4 right-4 lg:right-auto lg:w-96 z-10"
              >
                <BusDetailsPanel
                  bus={selectedBus}
                  onClose={() => setSelectedBus(null)}
                  onBookTicket={handleBookTicket}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Map Legend */}
          <div className="absolute top-4 right-4 glass-panel rounded-xl p-4 z-10">
            <h3 className="text-sm font-medium text-foreground mb-3">Status Legend</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full bg-status-active" />
                <span className="text-muted-foreground">Active</span>
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
        </div>
      </div>

      {/* Booking Modal */}
      {selectedBus && (
        <BookingModal
          bus={selectedBus}
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
        />
      )}

      {/* My Bookings Modal */}
      <MyBookings isOpen={isMyBookingsOpen} onClose={() => setIsMyBookingsOpen(false)} />
    </div>
  );
}
