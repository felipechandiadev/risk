import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import PresentationHeader from './PresentationHeader';
import SlideIntro from './slides/SlideIntro';
import SlideMapa from './slides/SlideMapa';
import SlidePuntosCriticos from './slides/SlidePuntosCriticos';
import SlideViento from './slides/SlideViento';

const slides = [
  {
    id: 'intro',
    label: 'Inicio',
    subtitle: 'Resumen de la presentación',
    Component: SlideIntro,
  },
  {
    id: 'mapa',
    label: 'Mapa',
    subtitle: 'Puntos críticos georreferenciados',
    Component: SlideMapa,
  },
  {
    id: 'puntos-criticos',
    label: 'Clasificación',
    subtitle: 'Clasificación de riesgo de todos los puntos',
    Component: SlidePuntosCriticos,
  },
  {
    id: 'viento',
    label: 'Viento',
    subtitle: 'Río atmosférico y corrientes de viento',
    Component: SlideViento,
  },
];

export default function Presentation() {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'ArrowRight') {
        setActiveSlide((current) => Math.min(current + 1, slides.length - 1));
      }

      if (event.key === 'ArrowLeft') {
        setActiveSlide((current) => Math.max(current - 1, 0));
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const ActiveComponent = slides[activeSlide].Component;

  return (
    <div className="presentation-shell">
      <PresentationHeader
        title="Presentación interactiva"
        subtitle="Diapositivas con mapas, iframes y contenido navegable"
        slides={slides}
        activeIndex={activeSlide}
        onSelect={setActiveSlide}
      />

      <main className={`presentation-content ${slides[activeSlide].id === 'mapa' ? 'map-active' : ''}`}>
        <ActiveComponent />
      </main>

      <footer className="presentation-footer">
        <button
          className="presentation-nav-button"
          onClick={() => setActiveSlide((current) => Math.max(current - 1, 0))}
          disabled={activeSlide === 0}
        >
          <ArrowLeft size={18} />
          <span>Anterior</span>
        </button>

        <div className="presentation-counter">
          {activeSlide + 1} / {slides.length}
        </div>

        <button
          className="presentation-nav-button"
          onClick={() => setActiveSlide((current) => Math.min(current + 1, slides.length - 1))}
          disabled={activeSlide === slides.length - 1}
        >
          <span>Siguiente</span>
          <ArrowRight size={18} />
        </button>
      </footer>
    </div>
  );
}
