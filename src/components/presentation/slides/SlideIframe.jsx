import { ExternalLink } from 'lucide-react';

export default function SlideIframe() {
  return (
    <section className="slide-card">
      <div className="slide-eyebrow">
        <ExternalLink size={16} />
        <span>Contenido embebido</span>
      </div>

      <h2>Integración de recursos externos</h2>
      <p>
        Este tipo de diapositiva permite incorporar mapas externos, documentos, dashboards o
        cualquier página web dentro de la presentación.
      </p>

      <div className="iframe-frame">
        <iframe
          title="Mapa embebido"
          src="https://www.openstreetmap.org/export/embed.html?bbox=-72.0,-36.2,-71.7,-36.0&layer=mapnik"
          loading="lazy"
        />
      </div>
    </section>
  );
}
