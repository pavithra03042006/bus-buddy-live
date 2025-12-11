import React from 'react';
import { motion } from 'framer-motion';
import { useBus } from '@/contexts/BusContext';
import { Bus } from '@/types/bus';
import { Bus as BusIcon, MapPin, User, Phone, Clock, Navigation, Snowflake, Fan } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BusListProps {
  onBusSelect?: (bus: Bus) => void;
}

export default function BusList({ onBusSelect }: BusListProps) {
  const { buses, selectedBus, setSelectedBus } = useBus();

  const handleBusClick = (bus: Bus) => {
    setSelectedBus(bus);
    onBusSelect?.(bus);
  };

  const getStatusBadge = (status: Bus['status']) => {
    const styles = {
      active: 'bg-status-active/15 text-status-active',
      unavailable: 'bg-status-unavailable/15 text-status-unavailable',
      substitute: 'bg-status-substitute/15 text-status-substitute',
    };

    const labels = {
      active: 'Active',
      unavailable: 'Not Available',
      substitute: 'Substitute',
    };

    return (
      <span className={cn('status-badge', styles[status])}>
        <span className={cn('w-1.5 h-1.5 rounded-full', {
          'bg-status-active': status === 'active',
          'bg-status-unavailable': status === 'unavailable',
          'bg-status-substitute': status === 'substitute',
        })} />
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="space-y-3">
      {buses.map((bus, index) => (
        <motion.div
          key={bus.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          onClick={() => handleBusClick(bus)}
          className={cn(
            'p-4 rounded-xl cursor-pointer transition-all duration-300',
            'bg-card border border-border/50 hover:border-accent/50',
            'hover:shadow-lg hover:shadow-accent/5',
            selectedBus?.id === bus.id && 'border-accent shadow-lg shadow-accent/10 bg-accent/5'
          )}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center',
                  bus.status === 'active' && 'bg-status-active/15',
                  bus.status === 'unavailable' && 'bg-status-unavailable/15',
                  bus.status === 'substitute' && 'bg-status-substitute/15'
                )}
              >
                <BusIcon className={cn(
                  'w-6 h-6',
                  bus.status === 'active' && 'text-status-active',
                  bus.status === 'unavailable' && 'text-status-unavailable',
                  bus.status === 'substitute' && 'text-status-substitute'
                )} />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-lg">{bus.busNumber}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {bus.type === 'AC' ? (
                    <Snowflake className="w-3.5 h-3.5 text-accent" />
                  ) : (
                    <Fan className="w-3.5 h-3.5" />
                  )}
                  <span>{bus.type}</span>
                </div>
              </div>
            </div>
            {getStatusBadge(bus.status)}
          </div>

          {/* Route */}
          <div className="flex items-center gap-2 text-sm mb-3">
            <Navigation className="w-4 h-4 text-accent" />
            <span className="text-foreground font-medium">
              {bus.route.from} → {bus.route.to}
            </span>
          </div>

          {/* Current Location */}
          <div className="flex items-start gap-2 text-sm mb-3 p-2 rounded-lg bg-muted/50">
            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
            <div>
              <span className="text-foreground">{bus.currentLocation.placeName}</span>
              {bus.status !== 'unavailable' && (
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  Updated: {bus.currentLocation.timestamp.toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>

          {/* Driver Info */}
          {bus.status !== 'unavailable' && (
            <div className="flex items-center justify-between text-sm pt-3 border-t border-border/50">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="w-4 h-4" />
                <span>{bus.driver.name}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-4 h-4" />
                <span>{bus.driver.phone}</span>
              </div>
            </div>
          )}

          {/* Unavailable message */}
          {bus.status === 'unavailable' && (
            <div className="text-center py-2 text-sm text-status-unavailable bg-status-unavailable/10 rounded-lg">
              Bus Not Available - Technical Issues
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
