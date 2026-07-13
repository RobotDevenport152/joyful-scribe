import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';

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

function googleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

const FarmMap = ({ points, locale }: FarmMapProps) => {
  return (
    <div className="relative rounded-lg overflow-hidden border border-border shadow-sm">
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
        {points.map((pt, idx) => (
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
