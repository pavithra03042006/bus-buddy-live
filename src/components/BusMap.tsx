import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useBus } from '@/contexts/BusContext';
import { Bus } from '@/types/bus';
import { Bus as BusIcon, MapPin } from 'lucide-react';

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom bus marker icon
const createBusIcon = (status: Bus['status']) => {
  const color = status === 'active' ? '#22c55e' : status === 'unavailable' ? '#ef4444' : '#f59e0b';
  
  return L.divIcon({
    className: 'custom-bus-marker',
    html: `
      <div class="bus-icon ${status}" style="background: ${color}; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border: 2px solid white;">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 6v6"/>
          <path d="M15 6v6"/>
          <path d="M2 12h19.6"/>
          <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/>
          <circle cx="7" cy="18" r="2"/>
          <path d="M9 18h5"/>
          <circle cx="16" cy="18" r="2"/>
        </svg>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
};

// Component to handle map center changes - must be inside MapContainer
function MapController({ selectedBus }: { selectedBus: Bus | null }) {
  const map = useMap();

  useEffect(() => {
    if (selectedBus) {
      map.flyTo([selectedBus.currentLocation.lat, selectedBus.currentLocation.lng], 15, {
        duration: 1,
      });
    }
  }, [selectedBus, map]);

  return null;
}

// Bus Markers component - must be inside MapContainer
function BusMarkers({ buses, onBusClick }: { buses: Bus[]; onBusClick: (bus: Bus) => void }) {
  return (
    <>
      {buses.map((bus) => (
        <Marker
          key={bus.id}
          position={[bus.currentLocation.lat, bus.currentLocation.lng]}
          icon={createBusIcon(bus.status)}
          eventHandlers={{
            click: () => onBusClick(bus),
          }}
        >
          <Popup>
            <div className="p-2 min-w-[200px]">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    bus.status === 'active'
                      ? 'bg-green-500'
                      : bus.status === 'unavailable'
                      ? 'bg-red-500'
                      : 'bg-orange-500'
                  }`}
                >
                  <BusIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">{bus.busNumber}</h3>
                  <span className="text-xs text-gray-500">{bus.type}</span>
                </div>
              </div>
              
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-1.5 text-gray-600">
                  <MapPin className="w-3 h-3" />
                  <span>{bus.currentLocation.placeName}</span>
                </div>
                <p>
                  <span className="text-gray-500">Route:</span> {bus.route.from} → {bus.route.to}
                </p>
                <p>
                  <span className="text-gray-500">Driver:</span> {bus.driver.name}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Updated: {bus.currentLocation.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}

interface BusMapProps {
  onBusSelect?: (bus: Bus) => void;
}

export default function BusMap({ onBusSelect }: BusMapProps) {
  const { buses, selectedBus, setSelectedBus } = useBus();

  // Tirunelveli center coordinates
  const center: [number, number] = [8.7139, 77.7567];

  const handleBusClick = (bus: Bus) => {
    setSelectedBus(bus);
    onBusSelect?.(bus);
  };

  return (
    <MapContainer
      center={center}
      zoom={13}
      className="w-full h-full rounded-lg"
      style={{ background: '#f0f4f8' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapController selectedBus={selectedBus} />
      <BusMarkers buses={buses} onBusClick={handleBusClick} />
    </MapContainer>
  );
}
