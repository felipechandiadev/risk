import { useEffect, useState } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import pointsData from '../../../../critical-points.json';
import parralBoundaries from '../../../data/parral-boundaries.json';
import L from 'leaflet';

const riskColor = (level) => {
  const normalized = String(level || '').trim().toLowerCase();
  if (normalized === 'alto') return '#ef4444';
  if (normalized === 'medio') return '#f59e0b';
  if (normalized === 'bajo') return '#22c55e';
  return '#3b82f6';
};

export default function SlideMapa() {
  const [isClient, setIsClient] = useState(false);
  const [mapHeight, setMapHeight] = useState(null);

  useEffect(() => setIsClient(true), []);

  useEffect(() => {
    if (!isClient) return;
    const compute = () => {
      const header = document.querySelector('.presentation-header');
      const footer = document.querySelector('.presentation-footer');
      const headerH = header ? header.getBoundingClientRect().height : 0;
      const footerH = footer ? footer.getBoundingClientRect().height : 0;
      const gap = 130; // reserve extra space so map doesn't overflow
      setMapHeight(window.innerHeight - headerH - footerH - gap);
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, [isClient]);

  const points = pointsData;

  const coords = points
    .map((p) => (p.Latitud != null && p.Longitud != null ? [p.Latitud, p.Longitud] : null))
    .filter(Boolean);

  const bounds = coords.length ? L.latLngBounds(coords) : null;

  return (
    <section className="slide-card slide-map-card slide-map-full">
      <div className="slide-eyebrow">
        <span>Mapa interactivo</span>
      </div>

      <h2>Vista geográfica de puntos críticos</h2>
      <p>Se utilizan como referencia visual para reforzar la narrativa de la presentación.</p>

      <div className="map-wrapper">
        {isClient ? (
          <MapContainer
            center={[-36.14678428, -71.82158334]}
            zoom={10}
            scrollWheelZoom={false}
            attributionControl={false}
            style={{ height: mapHeight ? `${mapHeight}px` : 'calc(100vh - 200px)', width: '100%', maxHeight: '64vh' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <GeoJSON
              data={parralBoundaries}
              style={{
                color: '#e74c3c',
                weight: 3,
                opacity: 0.8,
                fillOpacity: 0.1,
              }}
            />
            {points.map((point, i) => (
              <CircleMarker
                key={`${point.Sector ?? 'pt'}-${i}`}
                center={[point.Latitud, point.Longitud]}
                radius={8}
                pathOptions={{
                  color: riskColor(point['Nivel de Riesgo']),
                  fillColor: riskColor(point['Nivel de Riesgo']),
                  fillOpacity: 0.8,
                  weight: 1,
                }}
              >
                <Popup>
                  <strong>{point.Sector}</strong>
                  <br />
                  <strong>Nivel de Riesgo:</strong> {point['Nivel de Riesgo'] || 'Desconocido'}
                  <br />
                  {point['Causa del Punto Crítico']}
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        ) : (
          <div className="map-placeholder">Cargando mapa…</div>
        )}
      </div>
    </section>
  );
}
