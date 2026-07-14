export default function SlideDots({ slides, activeIndex, onSelect }) {
  return (
    <nav className="slide-dots" aria-label="Navegación de diapositivas">
      {slides.map((slide, index) => (
        <button
          key={slide.id}
          className={index === activeIndex ? 'slide-dot active' : 'slide-dot'}
          onClick={() => onSelect(index)}
          aria-label={`Ir a ${slide.label}`}
          aria-current={index === activeIndex ? 'step' : undefined}
        />
      ))}
    </nav>
  );
}
