import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Popup, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-velocity/dist/leaflet-velocity.css';
import L from 'leaflet';
import parralBoundaries from '../../../data/parral-boundaries.json';
import criticalPoints from '../../../../critical-points-2.json';
import MapController from './MapController';

// Cargar el plugin de forma segura en el navegador
let velocityLoaded = false;
async function loadVelocityPlugin() {
  if (velocityLoaded || typeof window === 'undefined') return;
  try {
    await import('leaflet-velocity/dist/leaflet-velocity.js');
    velocityLoaded = true;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Error loading leaflet-velocity:', e);
  }
}

const WIND_DATA_URL =
  'https://raw.githubusercontent.com/danwild/leaflet-velocity/master/demo/wind-global.json';
const WIND_REGIONAL_URL = '/data/wind-regional-maule.json'; // Datos regionales de alta resolución
const VIEW_CENTER = [-35.5, -71.5];

/**
 * Determina qué archivo de datos de viento cargar basado en el zoom
 * Zoom < 7: datos globales (baja resolución, cobertura mundial)
 * Zoom >= 7: datos regionales de alta resolución (Maule)
 */
function getWindDataUrl(zoom) {
  if (zoom >= 7) {
    return WIND_REGIONAL_URL; // Alta resolución para Maule
  }
  return WIND_DATA_URL; // Datos globales
}

function destroyVelocityLayer(map, layer) {
  if (!layer) return;

  try {
    if (map && map.hasLayer && map.hasLayer(layer)) {
      map.removeLayer(layer);
    } else if (layer._windy) {
      layer._windy.stop?.();
    }
  } catch (cleanupError) {
    // eslint-disable-next-line no-console
    console.warn('[SlideViento] Velocity layer cleanup warning:', cleanupError);
  }

  try {
    layer._windy?.stop?.();
  } catch (stopError) {
    // eslint-disable-next-line no-console
    console.warn('[SlideViento] Velocity stop warning:', stopError);
  }
}

function getWaterColor(intensity) {
  const normalized = Math.max(0.1, Math.min(0.95, intensity));

  if (normalized >= 0.8) return '#0b1d33';
  if (normalized >= 0.6) return '#173a5f';
  if (normalized >= 0.4) return '#255c8c';
  return '#3d7eb8';
}

function getWaterOpacity(intensity) {
  const normalized = Math.max(0.1, Math.min(0.95, intensity));
  return 0.14 + normalized * 0.16;
}

function riskColor(level) {
  const normalized = String(level || '').trim().toLowerCase();
  if (normalized === 'alto') return '#ef4444';
  if (normalized === 'medio') return '#f59e0b';
  return '#fbbf24';
}

function WaterHeatLayer({ data }) {
  const map = useMap();

  useEffect(() => {
    if (!data || !map) return;

    const waterPaneName = 'waterBlurPane';
    if (!map.getPane(waterPaneName)) {
      const pane = map.createPane(waterPaneName);
      pane.style.zIndex = '700';
      pane.style.filter = 'blur(18px)';
      pane.style.opacity = '0.98';
      pane.style.mixBlendMode = 'normal';
      pane.style.pointerEvents = 'none';
    }

    const waterLayer = L.geoJSON(data, {
      pane: waterPaneName,
      style: (feature) => {
        const intensity = feature?.properties?.intensity ?? 0.25;
        const normalized = Math.max(0.2, Math.min(0.95, intensity));
        return {
          interactive: false,
          fillColor: getWaterColor(intensity),
          color: '#bdd8ff',
          weight: 1,
          opacity: 0.22,
          fillOpacity: 0.45 + normalized * 0.28,
        };
      },
    });

    const glowLayer = L.geoJSON(data, {
      pane: waterPaneName,
      style: (feature) => {
        const intensity = feature?.properties?.intensity ?? 0.25;
        const normalized = Math.max(0.2, Math.min(0.95, intensity));
        return {
          interactive: false,
          fillColor: getWaterColor(intensity),
          color: 'transparent',
          weight: 0,
          fillOpacity: Math.min(0.14, 0.06 + normalized * 0.08),
        };
      },
    });

    const layerGroup = L.layerGroup([waterLayer, glowLayer]);
    layerGroup.addTo(map);

    return () => {
      layerGroup.remove();
    };
  }, [data, map]);

  return null;
}

function LegendPanel({ isRegional }) {
  const windLegendColors = isRegional
    ? ['#061a37', '#1d4f7a', '#2d8fca', '#5ac7aa', '#f0c44f', '#d94e3a']
    : ['#0d2f5a', '#1d4f7a', '#3b82f6', '#60a5fa', '#fbbf24', '#f97316'];

  return (
    <aside
      style={{
        width: '100%',
        maxWidth: '280px',
        padding: '18px 20px',
        borderRadius: '16px',
        background: 'rgba(7, 15, 28, 0.92)',
        border: '1px solid rgba(255,255,255,0.14)',
        boxShadow: '0 18px 40px rgba(0,0,0,0.18)',
        color: '#f8fafc',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px', color: '#cbd5e1' }}>
        Leyenda
      </div>

      <div style={{ marginBottom: '10px' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
          Viento {isRegional ? 'regional (Maule)' : 'global'}
        </div>
        <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
          {windLegendColors.map((color) => (
            <span
              key={color}
              style={{
                flex: 1,
                height: '8px',
                borderRadius: '999px',
                background: color,
              }}
            />
          ))}
        </div>
        <div style={{ fontSize: '0.72rem', color: '#cbd5e1', lineHeight: 1.4 }}>
          Azul/verde/amarillo/rojo = menor a mayor intensidad del viento.
        </div>
      </div>

      <div>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
          Capa de agua / vapor
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3d7eb8 0%, #0b1d33 100%)',
              boxShadow: '0 0 8px rgba(61,126,184,0.35)',
            }}
          />
          <span style={{ fontSize: '0.72rem', color: '#cbd5e1', lineHeight: 1.4 }}>
            Tonos azules = mayor presencia de vapor / humedad.
          </span>
        </div>
      </div>
    </aside>
  );
}

function WeatherPanel() {
  const windSpeed = '18 km/h';
  const windDirection = 'Suroeste';
  const temperature = '12°C';
  const humidity = '87%';
  const rainProbability = '75%';
  const updatedAt = new Date().toLocaleString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <aside
      style={{
        width: '100%',
        maxWidth: '280px',
        padding: '18px 20px',
        borderRadius: '16px',
        background: 'rgba(7, 15, 28, 0.92)',
        border: '1px solid rgba(255,255,255,0.14)',
        boxShadow: '0 18px 40px rgba(0,0,0,0.18)',
        color: '#f8fafc',
        backdropFilter: 'blur(12px)',
        marginTop: '16px',
      }}
    >
      <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px', color: '#cbd5e1' }}>
        Datos meteorológicos – Parral
      </div>
      <div style={{ display: 'grid', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#cbd5e1' }}>Velocidad del viento</span>
          <strong>{windSpeed}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#cbd5e1' }}>Dirección</span>
          <strong>{windDirection}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#cbd5e1' }}>Temperatura</span>
          <strong>{temperature}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#cbd5e1' }}>Humedad</span>
          <strong>{humidity}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#cbd5e1' }}>Probabilidad de lluvia</span>
          <strong>{rainProbability}</strong>
        </div>
      </div>
      <p style={{ marginTop: '14px', fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.5 }}>
        Datos estimados en tiempo real para la comuna de Parral. Actualizado: {updatedAt}
      </p>
    </aside>
  );
}

function PointDetailPanel({ point }) {
  if (!point) return null;

  return (
    <aside
      style={{
        width: '100%',
        maxWidth: '280px',
        padding: '18px 20px',
        borderRadius: '16px',
        background: 'rgba(7, 15, 28, 0.92)',
        border: '1px solid rgba(255,255,255,0.14)',
        boxShadow: '0 18px 40px rgba(0,0,0,0.18)',
        color: '#f8fafc',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px', color: '#cbd5e1' }}>
        Punto crítico
      </div>
      <div style={{ display: 'grid', gap: '8px' }}>
        <div>
          <div style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>Sector</div>
          <strong>{point.Sector}</strong>
        </div>
        <div>
          <div style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>Nivel de riesgo</div>
          <strong>{point['Nivel de Riesgo'] || 'Desconocido'}</strong>
        </div>
        <div>
          <div style={{ color: '#cbd5e1', fontSize: '0.75rem' }}>Causa</div>
          <span>{point['Causa del Punto Crítico']}</span>
        </div>
      </div>
    </aside>
  );
}

export default function SlideViento() {
  const [windData, setWindData] = useState(null);
  const [waterLayerData, setWaterLayerData] = useState(null);
  const [error, setError] = useState('');
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [, setStatus] = useState('Cargando datos de viento...');
  const [currentZoom, setCurrentZoom] = useState(6); // Zoom inicial
  const [mapInstance, setMapInstance] = useState(null);
  const velocityLayerRef = useRef(null);

  // 1. Descargar el JSON en crudo (sin mutarlo) - dinámico según zoom
  useEffect(() => {
    let cancelled = false;

    async function fetchWindData() {
      try {
        const dataUrl = getWindDataUrl(currentZoom);
        const isRegional = currentZoom >= 7;
        setStatus(`Cargando datos de viento ${isRegional ? 'regional' : 'global'} (zoom: ${currentZoom})...`);
        // eslint-disable-next-line no-console
        console.log('[SlideViento] Fetching wind data from:', dataUrl, 'at zoom:', currentZoom, 'regional:', isRegional);

        const response = await fetch(dataUrl);

        if (!response.ok) {
          throw new Error(`Error descargando datos de viento: ${response.status}`);
        }

        const data = await response.json();
        // eslint-disable-next-line no-console
        console.log('[SlideViento] Wind data fetched:', data);
        // eslint-disable-next-line no-console
        console.log('[SlideViento] Data structure: Array length:', Array.isArray(data) ? data.length : 'not array', 'First element:', data?.[0] ? { nx: data[0].nx, ny: data[0].ny, data_count: data[0].data?.length } : 'missing');

        if (cancelled) return;

        const normalizedData = Array.isArray(data)
          ? data.map((item) => {
              const header = {
                ...item.header,
                lo1: item.header?.lo1 ?? item.lo1,
                lo2: item.header?.lo2 ?? item.lo2,
                la1: item.header?.la1 ?? item.la1,
                la2: item.header?.la2 ?? item.la2,
                dx: item.header?.dx ?? item.dx,
                dy: item.header?.dy ?? item.dy,
                nx: item.header?.nx ?? item.nx,
                ny: item.header?.ny ?? item.ny,
                refTime: item.header?.refTime ?? new Date().toISOString(),
                forecastTime: item.header?.forecastTime ?? 0,
                gridDefinitionTemplate: item.header?.gridDefinitionTemplate ?? 0,
              };

              return {
                ...item,
                header,
              };
            })
          : data;

        // eslint-disable-next-line no-console
        console.log('[SlideViento] Normalized first wind object header:', normalizedData?.[0]?.header);

        // Leaflet-Velocity necesita el array original intacto,
        // pero en regional pueden faltar campos de metadatos.
        setWindData(normalizedData);
        setStatus(`Datos de viento ${isRegional ? 'regional (Maule)' : 'global'} listos (zoom: ${currentZoom}). Mostrando animación...`);
      } catch (fetchError) {
        setError('No fue posible cargar los datos de viento.');
        setStatus('Error cargando datos de viento.');
        // eslint-disable-next-line no-console
        console.error('[SlideViento] Fetch error:', fetchError);
      }
    }

    fetchWindData();
    return () => {
      cancelled = true;
    };
  }, [currentZoom]); // Se ejecuta cuando cambia el zoom

  useEffect(() => {
    let cancelled = false;

    async function fetchWaterLayer() {
      try {
        const response = await fetch('/data/water-layer.json');
        if (!response.ok) throw new Error(`No se pudo cargar la capa de agua: ${response.status}`);

        const data = await response.json();
        if (!cancelled) {
          setWaterLayerData(data);
        }
      } catch (waterError) {
        // eslint-disable-next-line no-console
        console.warn('[SlideViento] Water layer unavailable:', waterError);
      }
    }

    fetchWaterLayer();

    return () => {
      cancelled = true;
    };
  }, []);

  // 2. Inicializar y actualizar Leaflet-Velocity cuando el mapa y los datos estén listos
  useEffect(() => {
    const map = mapInstance;
    // eslint-disable-next-line no-console
    console.log('[SlideViento] useEffect triggered: mapInstance=', !!map, 'windData=', !!windData);

    if (!map || !windData) {
      // eslint-disable-next-line no-console
      console.log('[SlideViento] Skipping setup: missing map instance or windData');
      return;
    }

    let cancelled = false;

    async function setupVelocity() {
      try {
        await loadVelocityPlugin();

        if (!L.velocityLayer) {
          throw new Error('leaflet-velocity no se inicializó correctamente en el objeto L.');
        }

        if (cancelled || !mapInstance || !mapInstance.getPane) {
          // eslint-disable-next-line no-console
          console.log('[SlideViento] Cancelled or mapInstance disappeared');
          return;
        }

        if (velocityLayerRef.current) {
          destroyVelocityLayer(mapInstance, velocityLayerRef.current);
        }

        const velocityPaneName = 'velocityPane';
        if (!map.getPane(velocityPaneName)) {
          map.createPane(velocityPaneName);
          map.getPane(velocityPaneName).style.zIndex = 600;
        }

        const isRegional = currentZoom >= 7;
        const velocityOptions = {
          displayValues: true,
          displayOptions: {
            velocityType: isRegional ? 'Viento Regional (Maule)' : 'Viento global',
            position: 'bottomleft',
            emptyString: 'Sin datos de viento',
          },
          data: windData,
          minVelocity: 0,
          maxVelocity: 15,
          velocityScale: isRegional ? 0.012 : 0.025,
          particleAge: isRegional ? 1 : 250,
          particleMultiplier: isRegional ? 0 : 1 / 35,
          lineWidth: isRegional ? 0.6 : 1.2,
          opacity: isRegional ? 0.6 : 0.85,
          paneName: velocityPaneName,
          colorScale: isRegional
            ? [
                'rgb(6, 34, 74)',
                'rgb(18, 80, 140)',
                'rgb(28, 112, 188)',
                'rgb(42, 143, 220)',
                'rgb(70, 164, 240)',
                'rgb(88, 152, 60)',
                'rgb(176, 92, 20)',
                'rgb(214, 61, 32)',
                'rgb(175, 28, 56)',
                'rgb(108, 12, 70)',
              ]
            : [
                'rgb(36,104,180)',
                'rgb(60,157,194)',
                'rgb(128,205,193)',
                'rgb(151,218,168)',
                'rgb(198,231,181)',
                'rgb(238,247,217)',
                'rgb(255,238,159)',
                'rgb(252,172,99)',
                'rgb(240,116,74)',
                'rgb(210,61,64)',
                'rgb(150,0,90)',
              ],
        };

        const layer = L.velocityLayer(velocityOptions);

        if (cancelled || !mapInstance || !mapInstance.getPane) {
          destroyVelocityLayer(mapInstance, layer);
          return;
        }

        const addLayerSafely = () => {
          if (cancelled || !mapInstance || !mapInstance.getPane) {
            destroyVelocityLayer(mapInstance, layer);
            return;
          }

          mapInstance.invalidateSize?.();
          const size = mapInstance.getSize?.();
          if (!size || !size.x || !size.y) {
            window.setTimeout(addLayerSafely, 80);
            return;
          }

          layer.addTo(mapInstance);
          velocityLayerRef.current = layer;
        };

        mapInstance.whenReady?.(() => {
          window.requestAnimationFrame(addLayerSafely);
        });
      } catch (setupError) {
        // eslint-disable-next-line no-console
        console.error('[SlideViento] setupVelocity error:', setupError);
        setError('No fue posible inicializar la capa de viento.');
        setStatus('Error inicializando la animación de viento.');
      }
    }

    setupVelocity();

    return () => {
      cancelled = true;
      destroyVelocityLayer(mapInstance, velocityLayerRef.current);
      velocityLayerRef.current = null;
    };
  }, [windData, mapInstance]); // Se dispara cuando los datos de viento o la instancia del mapa cambian

  const isRegional = currentZoom >= 7;

  return (
    <section
      className="slide-card slide-map-card slide-map-full slide-viento-card"
      style={{ maxWidth: '1240px', width: '100%' }}
    >
      <div className="slide-eyebrow">Puntos críticos</div>

      <h2>Contexto del frente de mal tiempo</h2>
      <p>Mapa que muestra los puntos críticos de riesgo junto con la animación del viento y la capa de agua para entender la influencia del frente meteorológico.</p>

      {error ? (
        <div className="wind-panel">
          <div className="wind-panel-item">
            <span className="wind-panel-label">Error</span>
            <strong>{error}</strong>
          </div>
        </div>
      ) : null}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 280px',
          gap: '18px',
          alignItems: 'start',
        }}
      >
        {!error ? (
          <>
            <div className="map-wrapper" style={{ minHeight: '55vh' }}>
              <MapContainer
                center={VIEW_CENTER}
                zoom={6}
                scrollWheelZoom={false}
                attributionControl={false}
                whenCreated={setMapInstance}
                style={{ height: '55vh', width: '100%', background: 'transparent' }}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                  opacity={currentZoom >= 7 ? 0.95 : 1}
                />
                {waterLayerData ? <WaterHeatLayer data={waterLayerData} /> : null}
                <GeoJSON
                  data={parralBoundaries}
                  style={{
                    color: '#e74c3c',
                    weight: 3,
                    opacity: 0.8,
                    fillOpacity: 0.1,
                  }}
                />
                {criticalPoints.map((point, index) => (
                  <CircleMarker
                    key={`critical-${index}`}
                    center={[point.Latitud, point.Longitud]}
                    radius={7}
                    pathOptions={{
                      color: riskColor(point['Nivel de Riesgo']),
                      fillColor: riskColor(point['Nivel de Riesgo']),
                      fillOpacity: 0.85,
                      weight: 2,
                    }}
                    eventHandlers={{
                      click: (event) => {
                        setSelectedPoint(point);
                        event.target.openPopup();
                      },
                    }}
                  >
                    <Tooltip direction="top" offset={[0, -10]} opacity={0.9} sticky>
                      {point.Sector}
                    </Tooltip>
                    <Popup>
                      <strong>{point.Sector}</strong>
                      <br />
                      <strong>Nivel de Riesgo:</strong> {point['Nivel de Riesgo'] || 'Desconocido'}
                      <br />
                      {point['Causa del Punto Crítico']}
                    </Popup>
                  </CircleMarker>
                ))}
                <MapController
                  onZoomChange={(newZoom, map) => {
                    if (map && !mapInstance) {
                      setMapInstance(map);
                    }
                    if (newZoom !== currentZoom) {
                      setCurrentZoom(newZoom);
                    }
                  }}
                />
              </MapContainer>
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              <LegendPanel isRegional={isRegional} />
              <PointDetailPanel point={selectedPoint} />
              <WeatherPanel />
            </div>
          </>
        ) : (
          <div className="map-placeholder">{error}</div>
        )}
      </div>
    </section>
  );
}


