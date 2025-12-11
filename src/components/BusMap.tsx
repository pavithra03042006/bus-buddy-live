import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useBus } from '@/contexts/BusContext';
import { Bus } from '@/types/bus';

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Create custom bus icon
const createBusIcon = (status: Bus['status']) => {
  const color = status === 'active' ? '#22c55e' : status === 'unavailable' ? '#ef4444' : '#f59e0b';
  
  return L.divIcon({
    className: 'custom-bus-marker',
    html: `
      <div style="background: ${color}; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.3); border: 3px solid white;">
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

// Create popup content
const createPopupContent = (bus: Bus) => `
  <div style="min-width: 220px; font-family: Inter, sans-serif;">
    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
      <div style="width: 36px; height: 36px; border-radius: 10px; background: ${
        bus.status === 'active' ? '#22c55e' : bus.status === 'unavailable' ? '#ef4444' : '#f59e0b'
      }; display: flex; align-items: center; justify-content: center;">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/>
          <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/>
          <circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/>
        </svg>
      </div>
      <div>
        <div style="font-weight: 600; font-size: 16px; color: #1a1a2e;">${bus.busNumber}</div>
        <div style="font-size: 12px; color: #6b7280;">${bus.type}</div>
      </div>
    </div>
    <div style="font-size: 13px; color: #374151; space-y: 6px;">
      <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
        <span>${bus.currentLocation.placeName}</span>
      </div>
      <div style="margin-bottom: 6px;"><span style="color: #6b7280;">Route:</span> ${bus.route.from} → ${bus.route.to}</div>
      <div style="margin-bottom: 6px;"><span style="color: #6b7280;">Driver:</span> ${bus.driver.name}</div>
      <div style="margin-bottom: 6px;"><span style="color: #6b7280;">Phone:</span> ${bus.driver.phone}</div>
      <div style="font-size: 11px; color: #9ca3af; margin-top: 8px;">Updated: ${bus.currentLocation.timestamp.toLocaleTimeString()}</div>
    </div>
  </div>
`;

interface BusMapProps {
  onBusSelect?: (bus: Bus) => void;
}

export default function BusMap({ onBusSelect }: BusMapProps) {
  const { buses, selectedBus, setSelectedBus } = useBus();
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Tirunelveli center coordinates
    const center: [number, number] = [8.7139, 77.7567];

    mapRef.current = L.map(mapContainerRef.current, {
      center,
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update markers when buses change
  useEffect(() => {
    if (!mapRef.current) return;

    buses.forEach((bus) => {
      const existingMarker = markersRef.current.get(bus.id);
      const position: [number, number] = [bus.currentLocation.lat, bus.currentLocation.lng];

      if (existingMarker) {
        // Update existing marker position
        existingMarker.setLatLng(position);
        existingMarker.setIcon(createBusIcon(bus.status));
        existingMarker.getPopup()?.setContent(createPopupContent(bus));
      } else {
        // Create new marker
        const marker = L.marker(position, {
          icon: createBusIcon(bus.status),
        })
          .addTo(mapRef.current!)
          .bindPopup(createPopupContent(bus), {
            maxWidth: 280,
            className: 'custom-popup',
          });

        marker.on('click', () => {
          setSelectedBus(bus);
          onBusSelect?.(bus);
        });

        markersRef.current.set(bus.id, marker);
      }
    });
  }, [buses, setSelectedBus, onBusSelect]);

  // Fly to selected bus
  useEffect(() => {
    if (!mapRef.current || !selectedBus) return;

    mapRef.current.flyTo(
      [selectedBus.currentLocation.lat, selectedBus.currentLocation.lng],
      15,
      { duration: 1 }
    );
  }, [selectedBus]);

  return (
    <div 
      ref={mapContainerRef} 
      className="w-full h-full rounded-lg"
      style={{ background: '#e5e7eb' }}
    />
  );
}
