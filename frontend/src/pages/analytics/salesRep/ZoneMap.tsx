import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Tooltip,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const cityCoordinates: Record<string, { lat: number; lng: number }> = {
  Kolkata: { lat: 22.5726, lng: 88.3639 },
  Delhi: { lat: 28.6139, lng: 77.209 },
  Chennai: { lat: 13.0878, lng: 80.2785 },
  Mumbai: { lat: 19.076, lng: 72.8777 },
};

interface ZoneSales {
  state: string;
  total_sales: number;
}

interface ZoneMapProps {
  darkMap?: boolean;
  mapHeight?: number;
}

// Custom pin icon
const pinIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2776/2776067.png", // Use any PNG pin
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});

export default function ZoneMap({ darkMap = false, mapHeight }: ZoneMapProps) {
  const [zoneSales, setZoneSales] = useState<ZoneSales[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL;
    fetch(`${API_URL}/zone-sales`)
      .then((res) => res.json())
      .then((data) => {
        setZoneSales(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="text-gray-500 text-center">Loading map…</p>;
  if (zoneSales.length === 0) return <p className="text-gray-500 text-center">No data available</p>;

  return (
    <div className="w-full h-full" style={mapHeight ? { height: mapHeight } : {}}>
      <MapContainer
        center={[22.5, 82.8]}
        zoom={5}
        className="w-full h-full rounded-xl"
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url={
            darkMap
              ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          }
          attribution='&copy; OpenStreetMap contributors &copy; CARTO'
        />

        {zoneSales.map((city) => {
          const coords = cityCoordinates[city.state];
          if (!coords) return null;

          return (
            <Marker
              key={city.state}
              position={[coords.lat, coords.lng]}
              icon={pinIcon}
            >
              <Tooltip
                permanent
                direction="top"
                className="font-bold text-xs bg-white rounded shadow px-2 py-1"
              >
                <div className="text-sm font-semibold text-gray-800">
                  {city.state}: ₹{city.total_sales.toLocaleString("en-IN")}
                </div>
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
