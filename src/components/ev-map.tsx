"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapPin, Navigation, Zap } from "lucide-react";

// Fix Leaflet's default icon issue in Next.js
const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Custom EV Icon
const evIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-cyan.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

type EVStation = {
  ID: number;
  AddressInfo: {
    Title: string;
    AddressLine1: string;
    Town: string;
    Latitude: number;
    Longitude: number;
    Distance: number;
  };
  Connections: Array<{
    PowerKW: number;
    ConnectionType: { Title: string };
  }>;
};

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function EVMap() {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [stations, setStations] = useState<EVStation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchStations = async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const apiKey = "7b86cf65-b580-483a-ade1-2340e1451925";
      const res = await fetch(`https://api.openchargemap.io/v3/poi?key=${apiKey}&latitude=${lat}&longitude=${lng}&distance=50&distanceunit=KM&maxresults=50`);
      if (!res.ok) throw new Error("Failed to fetch stations");
      const data = await res.json();
      setStations(data);
    } catch (err: any) {
      setError(err.message || "Could not load stations");
    } finally {
      setLoading(false);
    }
  };

  const locateUser = () => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setPosition([lat, lng]);
          fetchStations(lat, lng);
        },
        (err) => {
          setError("Location access denied or unavailable.");
          setLoading(false);
          // Fallback to Bangalore, India if denied
          const fallback: [number, number] = [12.9716, 77.5946];
          setPosition(fallback);
          fetchStations(fallback[0], fallback[1]);
        }
      );
    }
  };

  useEffect(() => {
    locateUser();
  }, []);

  if (!position) {
    return (
      <div className="glass-panel w-full h-[500px] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 animate-pulse"></div>
        <div className="flex flex-col items-center gap-3 relative z-10 text-[var(--muted-foreground)]">
          <Navigation className="w-8 h-8 animate-bounce text-primary" />
          <p>Locating you to find nearby chargers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[500px] rounded-2xl overflow-hidden shadow-2xl border border-[var(--glass-border)]">
      {loading && (
         <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-background/90 backdrop-blur border border-primary px-4 py-2 rounded-full text-sm font-bold text-primary flex items-center gap-2 shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]">
            <Zap className="w-4 h-4 animate-pulse" /> Fetching Stations...
         </div>
      )}
      <MapContainer 
        center={position} 
        zoom={12} 
        style={{ height: '100%', width: '100%', background: '#0B1120' }}
        zoomControl={false}
      >
        <ChangeView center={position} zoom={12} />
        {/* Dark mode tiles using CartoDB */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        
        {/* User Location */}
        <Marker position={position} icon={customIcon}>
          <Popup className="glass-popup">
             <div className="font-bold text-primary">You are here</div>
          </Popup>
        </Marker>

        {/* EV Stations */}
        {stations.map(station => (
          <Marker 
            key={station.ID} 
            position={[station.AddressInfo.Latitude, station.AddressInfo.Longitude]}
            icon={evIcon}
          >
            <Popup className="custom-popup">
              <div className="p-2 min-w-[200px]">
                <h3 className="font-bold text-lg leading-tight mb-1">{station.AddressInfo.Title}</h3>
                <p className="text-xs text-gray-500 mb-2">{station.AddressInfo.AddressLine1}, {station.AddressInfo.Town}</p>
                
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">Connections</p>
                  {station.Connections && station.Connections.length > 0 ? (
                    station.Connections.map((conn, idx) => (
                       <div key={idx} className="flex justify-between items-center text-sm border-b border-gray-100 last:border-0 pb-1 last:pb-0">
                         <span>{conn.ConnectionType?.Title || "Unknown"}</span>
                         <span className="font-mono bg-green-100 text-green-700 px-1 rounded text-xs">
                           {conn.PowerKW ? `${conn.PowerKW} kW` : "N/A"}
                         </span>
                       </div>
                    ))
                  ) : (
                    <p className="text-xs italic">Details unavailable</p>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
