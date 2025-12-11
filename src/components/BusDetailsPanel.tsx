import React from 'react';
import { useBus } from '@/contexts/BusContext';
import { Bus } from '@/types/bus';
import { Button } from '@/components/ui/button';
import {
  X,
  Bus as BusIcon,
  MapPin,
  Navigation,
  User,
  Phone,
  Clock,
  Snowflake,
  Fan,
  Route,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BusDetailsPanelProps {
  bus: Bus;
  onClose: () => void;
  onBookTicket: () => void;
}

export default function BusDetailsPanel({ bus, onClose, onBookTicket }: BusDetailsPanelProps) {
  const getStatusStyles = (status: Bus['status']) => ({
    active: 'bg-status-active text-white',
    unavailable: 'bg-status-unavailable text-white',
    substitute: 'bg-status-substitute text-white',
  }[status]);

  const getStatusLabel = (status: Bus['status']) => ({
    active: 'Active',
    unavailable: 'Not Available',
    substitute: 'Substitute',
  }[status]);

  return (
    <div className="rounded-xl overflow-hidden border border-border">
      {/* Header */}
      <div className={cn('p-4 text-white', getStatusStyles(bus.status))}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <BusIcon className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{bus.busNumber}</h2>
              <div className="flex items-center gap-2 text-white/90">
                {bus.type === 'AC' ? (
                  <Snowflake className="w-4 h-4" />
                ) : (
                  <Fan className="w-4 h-4" />
                )}
                <span>{bus.type}</span>
                <span>•</span>
                <span>{getStatusLabel(bus.status)}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Route Info */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Route Information
          </h3>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
            <Navigation className="w-5 h-5 text-accent" />
            <div className="flex-1">
              <div className="flex items-center gap-2 text-foreground font-medium">
                <span>{bus.route.from}</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                <span>{bus.route.to}</span>
              </div>
            </div>
          </div>

          {/* Stops */}
          <div className="p-3 rounded-xl bg-muted/50">
            <div className="flex items-center gap-2 mb-3">
              <Route className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Stops</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {bus.route.stops.map((stop, index) => (
                <span
                  key={stop}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium',
                    stop === bus.currentLocation.placeName
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  )}
                >
                  {stop}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Current Location */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Current Location
          </h3>
          <div className="p-3 rounded-xl bg-muted/50">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/15 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{bus.currentLocation.placeName}</p>
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>Updated: {bus.currentLocation.timestamp.toLocaleTimeString()}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Coordinates: {bus.currentLocation.lat.toFixed(4)}, {bus.currentLocation.lng.toFixed(4)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Driver & Conductor */}
        {bus.status !== 'unavailable' && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Staff Information
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-muted/50">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <User className="w-4 h-4" />
                  <span>Driver</span>
                </div>
                <p className="font-medium text-foreground">{bus.driver.name}</p>
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <Phone className="w-3 h-3" />
                  <span>{bus.driver.phone}</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-muted/50">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <User className="w-4 h-4" />
                  <span>Conductor</span>
                </div>
                <p className="font-medium text-foreground">{bus.conductor.name}</p>
              </div>
            </div>
          </div>
        )}

        {/* Unavailable Notice */}
        {bus.status === 'unavailable' && (
          <div className="p-4 rounded-xl bg-status-unavailable/10 border border-status-unavailable/20 text-center">
            <p className="text-status-unavailable font-medium">
              This bus is currently not available due to technical issues.
            </p>
          </div>
        )}

        {/* Book Button */}
        {bus.status === 'active' && (
          <Button onClick={onBookTicket} className="w-full" size="lg">
            Book Ticket
          </Button>
        )}
      </div>
    </div>
  );
}
