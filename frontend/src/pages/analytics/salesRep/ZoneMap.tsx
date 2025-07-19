import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Circle, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const cityCoordinates: Record<string, { lat: number; lng: number }> = {
  Kolkata: { lat: 22.5726, lng: 88.3639 },
  Delhi: { lat: 28.6139, lng: 77.209 },
  Chennai: { lat: 13.0878, lng: 80.2785 },
  Mumbai: { lat: 19.076, lng: 72.8777 },
  // Add more cities if present in DB
};

interface ZoneSales {
  state: string;
  total_sales: number;
}

interface ZoneMapProps {
  darkMap?: boolean;
  mapHeight?: number;
}

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
  
          const isMajorCity = ["Mumbai", "Delhi", "Kolkata", "Chennai"].includes(city.state);
          const fillColor = isMajorCity ? "#F97316" : "#3B82F6";
          const radius = isMajorCity
            ? 10000 + city.total_sales / 15
            : 7000 + city.total_sales / 20;
  
          return (
            <Circle
              key={city.state}
              center={[coords.lat, coords.lng]}
              radius={radius}
              pathOptions={{
                color: fillColor,
                fillColor,
                fillOpacity: 0.6,
              }}
            >
              <Tooltip permanent direction="top" className="font-bold text-xs bg-white rounded shadow px-2 py-1">
                <div className="text-sm font-semibold text-gray-800">
                  <span className={isMajorCity ? "text-orange-600 font-extrabold" : ""}>
                    {city.state}
                  </span>
                  : ₹{city.total_sales.toLocaleString("en-IN")}
                </div>
              </Tooltip>
            </Circle>
          );
        })}
      </MapContainer>
    </div>
  );
}
