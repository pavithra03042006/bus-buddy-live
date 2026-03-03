import React, { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useBus } from '@/contexts/BusContext';
import { Bus } from '@/types/bus';
import { routeCoordinates } from '@/data/busData';

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Create custom bus icon with pulse animation for active buses
const createBusIcon = (status: Bus['status'], isSelected: boolean = false) => {
  const color = status === 'active' ? '#22c55e' : status === 'unavailable' ? '#ef4444' : '#f59e0b';
  const size = isSelected ? 48 : 40;
  const pulseAnimation = status === 'active' ? `
    <div style="
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: ${size + 20}px;
      height: ${size + 20}px;
      border-radius: 50%;
      background: ${color};
      opacity: 0.3;
      animation: pulse 2s infinite;
    "></div>
    <style>
      @keyframes pulse {
        0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.5; }
        50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.2; }
        100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.5; }
      }
    </style>
  ` : '';

  return L.divIcon({
    className: 'custom-bus-marker',
    html: `
      <div style="position: relative; width: ${size}px; height: ${size}px;">
        ${pulseAnimation}
        <div style="
          position: relative;
          background: ${color}; 
          width: ${size}px; 
          height: ${size}px; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          box-shadow: 0 4px 15px rgba(0,0,0,0.4); 
          border: 3px solid white;
          z-index: 10;
          transition: transform 0.3s ease;
          ${isSelected ? 'transform: scale(1.1);' : ''}
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="${size * 0.5}" height="${size * 0.5}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 6v6"/>
            <path d="M15 6v6"/>
            <path d="M2 12h19.6"/>
            <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/>
            <circle cx="7" cy="18" r="2"/>
            <path d="M9 18h5"/>
            <circle cx="16" cy="18" r="2"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

// Create popup content
const createPopupContent = (bus: Bus) => `
  <div style="min-width: 240px; font-family: Inter, sans-serif; padding: 4px;">
    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 14px;">
      <div style="
        width: 44px; 
        height: 44px; 
        border-radius: 12px; 
        background: ${bus.status === 'active' ? '#22c55e' : bus.status === 'unavailable' ? '#ef4444' : '#f59e0b'}; 
        display: flex; 
        align-items: center; 
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/>
          <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/>
          <circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/>
        </svg>
      </div>
      <div>
        <div style="font-weight: 700; font-size: 18px; color: #1a1a2e;">${bus.busNumber}</div>
        <div style="font-size: 13px; color: #6b7280; display: flex; align-items: center; gap: 4px;">
          ${bus.type === 'AC' ? '❄️' : '💨'} ${bus.type}
          <span style="
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            background: ${bus.status === 'active' ? '#dcfce7' : bus.status === 'unavailable' ? '#fee2e2' : '#fef3c7'};
            color: ${bus.status === 'active' ? '#166534' : bus.status === 'unavailable' ? '#991b1b' : '#92400e'};
            margin-left: 6px;
          ">${bus.status === 'active' ? 'LIVE' : bus.status.toUpperCase()}</span>
        </div>
      </div>
    </div>
    <div style="font-size: 13px; color: #374151;">
      <div style="display: flex; align-items: flex-start; gap: 8px; margin-bottom: 8px; padding: 8px; background: #f3f4f6; border-radius: 8px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" stroke-width="2" style="flex-shrink: 0; margin-top: 2px;"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
        <div>
          <div style="font-weight: 600; color: #111827;">${bus.currentLocation.placeName}</div>
          <div style="font-size: 11px; color: #9ca3af;">Lat: ${bus.currentLocation.lat.toFixed(5)}, Lng: ${bus.currentLocation.lng.toFixed(5)}</div>
        </div>
      </div>
      <div style="margin-bottom: 6px;"><span style="color: #6b7280;">🚏 Next Stop:</span> <strong>${bus.nextStop}</strong></div>
      <div style="margin-bottom: 6px;"><span style="color: #6b7280;">🛣️ Route:</span> ${bus.route.from} → ${bus.route.to}</div>
      <div style="margin-bottom: 6px;"><span style="color: #6b7280;">👤 Driver:</span> ${bus.driver.name}</div>
      <div style="margin-bottom: 6px;"><span style="color: #6b7280;">📞 Phone:</span> ${bus.driver.phone}</div>
      <div style="
        font-size: 11px; 
        color: #14b8a6; 
        margin-top: 10px; 
        padding-top: 10px; 
        border-top: 1px solid #e5e7eb;
        display: flex;
        align-items: center;
        gap: 4px;
      ">
        <span style="display: inline-block; width: 8px; height: 8px; background: #14b8a6; border-radius: 50%; animation: blink 1s infinite;"></span>
        Last updated: ${bus.currentLocation.timestamp.toLocaleTimeString()}
      </div>
    </div>
    <style>
      @keyframes blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
      }
    </style>
  </div>
`;

interface BusMapProps {
  onBusSelect?: (bus: Bus) => void;
}

export default function BusMap({ onBusSelect }: BusMapProps) {
  const { buses, selectedBus, setSelectedBus, lastUpdate } = useBus();
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const polylinesRef = useRef<Map<string, L.Polyline>>(new Map());
  const [mapReady, setMapReady] = React.useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Tirunelveli center coordinates
    const center: [number, number] = [8.7139, 77.7567];

    const map = L.map(mapContainerRef.current, {
      center,
      zoom: 14,
      zoomControl: true,
    });

    mapRef.current = map;

    // Use a cleaner map tile
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Add zoom control to bottom right
    map.zoomControl.setPosition('bottomright');

    // Draw polylines for each route using an SVG linearGradient (cyan -> violet)
    try {
      // helper: ensure <defs> exists in the map's SVG so we can add gradients
      const ensureDefs = (m: L.Map) => {
        const container = m.getContainer();
        const svg = container.querySelector('svg');
        if (!svg) return null;
        let defs = svg.querySelector('defs');
        if (!defs) {
          defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
          svg.prepend(defs);
        }
        return defs as SVGDefsElement;
      };

      const defs = ensureDefs(map);

      Object.entries(routeCoordinates).forEach(([routeId, coords]) => {
        if (!coords || coords.length === 0) return;

        // create gradient element for this route if it doesn't exist
        if (defs && !defs.querySelector(`#route-gradient-${routeId}`)) {
          const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
          grad.setAttribute('id', `route-gradient-${routeId}`);
          grad.setAttribute('x1', '0%');
          grad.setAttribute('y1', '0%');
          grad.setAttribute('x2', '100%');
          grad.setAttribute('y2', '0%');
          grad.setAttribute('gradientUnits', 'userSpaceOnUse');

          const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
          stop1.setAttribute('offset', '0%');
          stop1.setAttribute('stop-color', '#06b6d4'); // cyan-ish

          const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
          stop2.setAttribute('offset', '100%');
          stop2.setAttribute('stop-color', '#8b5cf6'); // violet-ish

          grad.appendChild(stop1);
          grad.appendChild(stop2);
          defs.appendChild(grad);
        }

        // create polyline and then set its stroke to the gradient
        const poly = L.polyline(coords as L.LatLngExpression[], {
          weight: 4,
          opacity: 0.95,
          smoothFactor: 1,
        }).addTo(map);

        try {
          const path = (poly as any).getElement ? (poly as any).getElement() : null;
          if (path) {
            path.setAttribute('stroke', `url(#route-gradient-${routeId})`);
            path.setAttribute('stroke-linecap', 'round');
          }
        } catch (e) {
          // ignore if we can't set attributes
        }

        // store for cleanup or future toggling
        polylinesRef.current.set(routeId, poly);
      });
    } catch (err) {
      // ignore drawing errors
      // console.warn('Failed to draw route polylines', err);
    }

    // Prevent map clicks from closing the booking details panel
    map.on('click', (e: L.LeafletMouseEvent) => {
      L.DomEvent.stopPropagation(e.originalEvent);
    });

    // Mark map as ready after it's fully initialized
    map.whenReady(() => {
      setMapReady(true);
    });

    return () => {
      if (mapRef.current) {
        // remove polylines
        polylinesRef.current.forEach((poly) => {
          try { poly.remove(); } catch {}
        });
        polylinesRef.current.clear();

        mapRef.current.remove();
        mapRef.current = null;
        setMapReady(false);
      }
    };
  }, []);

  // Update markers with smooth animation
  const updateMarkers = useCallback(() => {
    if (!mapRef.current) return;

    buses.forEach((bus) => {
      const existingMarker = markersRef.current.get(bus.id);
      const position: [number, number] = [bus.currentLocation.lat, bus.currentLocation.lng];
      const isSelected = selectedBus?.id === bus.id;

      if (existingMarker) {
        // Smooth transition to new position
        const currentLatLng = existingMarker.getLatLng();
        const targetLatLng = L.latLng(position);
        
        // Animate marker movement
        const steps = 10;
        let step = 0;
        const latDiff = (targetLatLng.lat - currentLatLng.lat) / steps;
        const lngDiff = (targetLatLng.lng - currentLatLng.lng) / steps;

        const animate = () => {
          if (step < steps) {
            const newLat = currentLatLng.lat + latDiff * (step + 1);
            const newLng = currentLatLng.lng + lngDiff * (step + 1);
            existingMarker.setLatLng([newLat, newLng]);
            step++;
            requestAnimationFrame(animate);
          }
        };
        animate();

        // Update icon if selection changed
        existingMarker.setIcon(createBusIcon(bus.status, isSelected));
        existingMarker.getPopup()?.setContent(createPopupContent(bus));
      } else {
        // Create new marker
        const marker = L.marker(position, {
          icon: createBusIcon(bus.status, isSelected),
        })
          .addTo(mapRef.current!)
          .bindPopup(createPopupContent(bus), {
            maxWidth: 300,
            className: 'custom-popup',
          });

        marker.on('click', () => {
          setSelectedBus(bus);
          onBusSelect?.(bus);
        });

        markersRef.current.set(bus.id, marker);
      }
    });
  }, [buses, selectedBus, setSelectedBus, onBusSelect]);

  // Update markers when buses or selection changes (only after map is ready)
  useEffect(() => {
    if (mapReady) {
      updateMarkers();
    }
  }, [updateMarkers, lastUpdate, mapReady]);

  // Fly to selected bus
  useEffect(() => {
    if (!mapRef.current || !selectedBus) return;

    mapRef.current.flyTo(
      [selectedBus.currentLocation.lat, selectedBus.currentLocation.lng],
      16,
      { duration: 0.8 }
    );
  }, [selectedBus?.id]);

  return (
    <div id="live-map-container" className="relative z-0 w-full h-full rounded-lg overflow-hidden">
      <div
        ref={mapContainerRef}
        className="w-full h-full"
        style={{ background: '#e5e7eb' }}
      />
    </div>
  );
}
