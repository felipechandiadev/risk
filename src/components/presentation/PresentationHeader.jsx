import { Compass } from 'lucide-react';
import SlideDots from './SlideDots';

export default function PresentationHeader({ title, subtitle, slides, activeIndex, onSelect }) {
  return (
    <header className="presentation-header">
      <div className="presentation-brand">
        <div className="presentation-logo">
          <img
            src="/logosec.png"
            alt="Seguridad Pública Municipalidad de Parral"
            className="presentation-logo-image"
          />
        </div>
        <div>
          <h1>Dirección de Seguridad Pública</h1>
          <p>Departamento de Gestión del Riesgo de Desastre</p>
        </div>
      </div>

      <SlideDots slides={slides} activeIndex={activeIndex} onSelect={onSelect} />
    </header>
  );
}
