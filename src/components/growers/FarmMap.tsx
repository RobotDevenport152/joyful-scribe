import { useEffect, useMemo, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { LocateFixed, Loader2 } from 'lucide-react';

export interface MapPoint {
  name: string;
  lat: number;
  lng: number;
  region: string;
  contact?: string;
  phone?: string;
  feature?: string;
  description?: string;
  website?: string;
  type: 'collection' | 'farm';
}

interface FarmMapProps {
  points: MapPoint[];
  locale: string;
}

const COLORS = {
  collection: { fill: '#4a7c59', stroke: '#2d5a40' },
  farm: { fill: '#c9972b', stroke: '#9e7520' },
} as const;

const RADIUS_OPTIONS_KM = [3, 10, 50] as const;

function googleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

// Great-circle distance between two lat/lng points, in kilometres.
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Recenters the map whenever the user's located position changes — a plain prop change on
// MapContainer doesn't move an already-mounted map, so this needs the imperative `useMap` handle.
// The fly-to must run in an effect (not the render body), otherwise unrelated re-renders
// (e.g. clicking a radius filter) would re-trigger the animation on every render.
const RecenterOnLocate = ({ position }: { position: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(position, 11);
  }, [map, position]);
  return null;
};

const FarmMap = ({ points, locale }: FarmMapProps) => {
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [radiusKm, setRadiusKm] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setGeoError(locale === 'zh' ? '您的设备不支持定位' : 'Geolocation is not supported on this device');
      return;
    }
    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos([pos.coords.latitude, pos.coords.longitude]);
        setRadiusKm(10);
        setLocating(false);
      },
      () => {
        setGeoError(locale === 'zh' ? '无法获取您的位置，请检查定位权限' : "Couldn't get your location — check location permissions");
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  };

  const visiblePoints = useMemo(() => {
    if (!userPos || radiusKm === null) return points;
    return points.filter(pt => haversineKm(userPos[0], userPos[1], pt.lat, pt.lng) <= radiusKm);
  }, [points, userPos, radiusKm]);

  return (
    <div className="relative isolate rounded-lg overflow-hidden border border-border shadow-sm">
      {/* Legend */}
      <div className="absolute top-3 right-3 z-[1000] bg-background/95 backdrop-blur-sm border border-border rounded-md px-3 py-2 text-xs font-body space-y-1.5 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#4a7c59] border border-[#2d5a40] flex-shrink-0" />
          <span className="text-muted-foreground">{locale === 'zh' ? '收集点' : 'Collection Points'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#c9972b] border border-[#9e7520] flex-shrink-0" />
          <span className="text-muted-foreground">{locale === 'zh' ? '可参观农场' : 'Farm Visits'}</span>
        </div>
        {userPos && (
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#2563eb] border border-[#1d4ed8] flex-shrink-0" />
            <span className="text-muted-foreground">{locale === 'zh' ? '我的位置' : 'My Location'}</span>
          </div>
        )}
      </div>

      {/* Locate + radius controls */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-col gap-2 items-start">
        <button
          type="button"
          onClick={handleLocate}
          disabled={locating}
          className="flex items-center gap-1.5 bg-background/95 backdrop-blur-sm border border-border rounded-md px-3 py-1.5 text-xs font-body shadow-sm hover:bg-muted transition-colors disabled:opacity-60"
        >
          {locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LocateFixed className="w-3.5 h-3.5" />}
          {locale === 'zh' ? '定位我的位置' : 'Locate Me'}
        </button>

        {userPos && (
          <div className="flex gap-1 bg-background/95 backdrop-blur-sm border border-border rounded-md p-1 text-xs font-body shadow-sm">
            {RADIUS_OPTIONS_KM.map(km => (
              <button
                key={km}
                type="button"
                onClick={() => setRadiusKm(km)}
                className={`px-2 py-1 rounded transition-colors ${radiusKm === km ? 'bg-accent text-accent-foreground' : 'hover:bg-muted text-muted-foreground'}`}
              >
                {km}km
              </button>
            ))}
            <button
              type="button"
              onClick={() => setRadiusKm(null)}
              className={`px-2 py-1 rounded transition-colors ${radiusKm === null ? 'bg-accent text-accent-foreground' : 'hover:bg-muted text-muted-foreground'}`}
            >
              {locale === 'zh' ? '全部' : 'All'}
            </button>
          </div>
        )}

        {geoError && (
          <p className="bg-background/95 backdrop-blur-sm border border-border rounded-md px-2 py-1 text-[11px] text-destructive max-w-[200px]">
            {geoError}
          </p>
        )}
      </div>

      <MapContainer
        center={[-41.5, 172.5]}
        zoom={5}
        scrollWheelZoom={false}
        style={{ height: '480px', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {userPos && <RecenterOnLocate position={userPos} />}
        {userPos && (
          <CircleMarker
            center={userPos}
            radius={8}
            pathOptions={{ fillColor: '#2563eb', fillOpacity: 0.9, color: '#1d4ed8', weight: 2 }}
          >
            <Popup>{locale === 'zh' ? '我的位置' : 'My Location'}</Popup>
          </CircleMarker>
        )}
        {visiblePoints.map((pt, idx) => (
          <CircleMarker
            key={`${pt.type}-${idx}`}
            center={[pt.lat, pt.lng]}
            radius={7}
            pathOptions={{
              fillColor: COLORS[pt.type].fill,
              fillOpacity: 0.9,
              color: COLORS[pt.type].stroke,
              weight: 1.5,
            }}
          >
            <Popup>
              <div className="min-w-[200px] max-w-[240px]">
                <p className="font-semibold text-sm leading-tight mb-1">{pt.name}</p>
                <p className="text-xs text-gray-500 mb-1">{pt.region}</p>
                {pt.contact && <p className="text-xs">{pt.contact}</p>}
                {pt.phone && (
                  <a href={`tel:${pt.phone.replace(/\s/g, '')}`} className="text-xs text-[#4a7c59] hover:underline">
                    {pt.phone}
                  </a>
                )}
                {pt.description ? (
                  <p className="text-xs text-gray-600 mt-1 leading-snug">{pt.description}</p>
                ) : (
                  pt.feature && <p className="text-xs text-gray-600 mt-1">{pt.feature}</p>
                )}
                <div className="flex items-center gap-3 mt-1.5">
                  {pt.website && (
                    <a
                      href={pt.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-xs text-[#4a7c59] hover:underline font-medium"
                    >
                      {locale === 'zh' ? '官网 →' : 'Website →'}
                    </a>
                  )}
                  <a
                    href={googleMapsUrl(pt.lat, pt.lng)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-xs text-[#4a7c59] hover:underline font-medium"
                  >
                    {locale === 'zh' ? '导航 →' : 'Directions →'}
                  </a>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
};

export default FarmMap;
