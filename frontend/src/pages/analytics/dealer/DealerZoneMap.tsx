import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Circle, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const cityCoordinates: Record<string, { lat: number; lng: number }> = {
  Kolkata: { lat: 22.5726, lng: 88.3639 },
  Delhi: { lat: 28.6139, lng: 77.209 },
  Chennai: { lat: 13.0878, lng: 80.2785 },
  Mumbai: { lat: 19.076, lng: 72.8777 },
  // Add more as needed
};

interface DealerZoneData {
  state: string;       // or city/zone name
  total_orders: number;
}

interface DealerZoneMapProps {
  dealerId: string;
  darkMap?: boolean;
  mapHeight?: number;
}

export default function DealerZoneMap({ dealerId, darkMap = false, mapHeight }: DealerZoneMapProps) {
  const [zoneData, setZoneData] = useState<DealerZoneData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL;
    fetch(`${API_URL}/zone-wise-orders?dealer_id=${dealerId}`)
      .then((res) => res.json())
      .then((data) => {
        setZoneData(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [dealerId]);

  console.log(zoneData);

  if (loading) return <p className="text-gray-500 text-center">Loading map…</p>;
  if (zoneData.length === 0) return <p className="text-gray-500 text-center">No data available</p>;

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

        {zoneData.map((zone) => {
          const coords = cityCoordinates[zone.state];
          if (!coords) return null;

          const isMajorCity = ["Mumbai", "Delhi", "Kolkata", "Chennai"].includes(zone.state);
          const fillColor = isMajorCity ? "#F97316" : "#3B82F6";
          const orders = typeof zone.total_sales === 'number' && !isNaN(zone.total_sales) ? zone.total_sales : 0;
          const radius = isMajorCity
            ? 8000 + orders * 300
            : 6000 + orders * 250;

          return (
            <Circle
              key={zone.state}
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
                    {zone.state}
                  </span>
                  : {zone.total_sales ?? 0} orders
                </div>
              </Tooltip>
            </Circle>
          );
        })}
      </MapContainer>
    </div>
  );
}
