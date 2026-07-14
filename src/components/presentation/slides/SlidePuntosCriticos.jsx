import { useState } from 'react';
import pointsData from '../../../../critical-points.json';

const categories = [
  'Colapso colectores de aguas lluvia/alcantarillados',
  'Anegamiento de caminos/pasos a desnivel',
  'Acumulación de nieve',
  'Interrupción de caminos',
];

const getCategoryPoints = (category) =>
  pointsData.filter((point) => {
    const cause = String(point['Causa del Punto Crítico'] || '').trim().toLowerCase();
    const normalizedCategory = category.toLowerCase();

    if (normalizedCategory.includes('colapso') && cause.includes('colapso')) return true;
    if (normalizedCategory.includes('anegamiento') && cause.includes('anegamiento')) return true;
    if (normalizedCategory.includes('nieve') && cause.includes('nieve')) return true;
    if (normalizedCategory.includes('interrupción') && cause.includes('interrupción')) return true;
    if (normalizedCategory.includes('interrupcion') && cause.includes('interrupcion')) return true;

    return false;
  });

export default function SlidePuntosCriticos() {
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  const selectedPoints = getCategoryPoints(selectedCategory);

  return (
    <section className="slide-card">
      <div className="slide-eyebrow">Puntos críticos</div>

      <h2>Clasificación de los puntos críticos</h2>
      <p>
        Selecciona una categoría para ver los puntos críticos asociados en la parte inferior.
      </p>

      <div className="slide-grid" style={{ gap: '16px' }}>
        {categories.map((category) => {
          const count = getCategoryPoints(category).length;
          const isActive = selectedCategory === category;

          return (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              style={{
                width: '100%',
                border: 'none',
                padding: 0,
                background: 'transparent',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <article className="info-card" style={{ border: isActive ? '1px solid #38bdf8' : undefined }}>
                <h3>{category}</h3>
                <p>{count} puntos</p>
              </article>
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: '24px', borderTop: '1px solid rgba(148,163,184,0.25)', paddingTop: '16px' }}>
        <h3 style={{ marginBottom: '10px' }}>{selectedCategory}</h3>
        {selectedPoints.length > 0 ? (
          <ul style={{ margin: 0, paddingLeft: '18px', display: 'grid', gap: '8px' }}>
            {selectedPoints.map((point, index) => (
              <li key={`${point.Sector}-${index}`}>
                <strong>{point.Sector}</strong> — {point['Nivel de Riesgo'] || 'Sin nivel'}
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ margin: 0 }}>No hay puntos registrados para esta categoría.</p>
        )}
      </div>
    </section>
  );
}
