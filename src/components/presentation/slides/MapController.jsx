import { useMapEvents } from 'react-leaflet';

/**
 * MapController: detecta cambios de zoom y notifica al componente padre.
 * Pasa la instancia real de Leaflet para que el padre pueda usarla con certeza.
 */
export default function MapController({ onZoomChange }) {
  useMapEvents({
    moveend: (event) => {
      if (onZoomChange) {
        onZoomChange(event.target.getZoom(), event.target);
      }
    },
    zoomend: (event) => {
      if (onZoomChange) {
        onZoomChange(event.target.getZoom(), event.target);
      }
    },
  });

  return null;
}
