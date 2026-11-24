import { useLayoutEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function CreateFormLayout({
  title,
  description,
  backTo,
  category,
  children,
  editing = false,
  backLabel,
}) {
  const { pathname, search } = useLocation();
  const contentRef = useRef(null);

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, search]);

  useLayoutEffect(() => {
    const content = contentRef.current;
    let frame;
    const showError = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const alert = content.querySelector('.create-error[role="alert"]');
        if (!alert) return;
        alert.setAttribute('tabindex', '-1');
        alert.focus({ preventScroll: true });
        alert.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
            ? 'instant'
            : 'smooth',
          block: 'center',
        });
      });
    };
    const observer = new MutationObserver((mutations) => {
      if (
        mutations.some(
          ({ target, addedNodes }) =>
            target.parentElement?.closest('.create-error') ||
            target.matches?.('.create-error') ||
            Array.from(addedNodes).some(
              (node) => node.matches?.('.create-error') || node.querySelector?.('.create-error'),
            ),
        )
      ) {
        showError();
      }
    });
    observer.observe(content, { childList: true, subtree: true, characterData: true });
    // También muestra un error que sigue siendo el mismo al volver a guardar.
    content.addEventListener('submit', showError, true);
    showError();
    return () => {
      observer.disconnect();
      content.removeEventListener('submit', showError, true);
      cancelAnimationFrame(frame);
    };
  }, [pathname, search]);

  return (
    <div className="create-page">
      <Link to={backTo} className="create-back">
        <span aria-hidden="true">←</span> Volver a{' '}
        {backLabel || (editing ? 'la ficha' : category.toLowerCase())}
      </Link>
      <div className="create-card">
        <header className="create-header">
          <div className="create-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path
                d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"
                strokeLinejoin="round"
              />
              <path d="M14 3v6h6M8 13h8M8 17h5" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="create-eyebrow">{category}</p>
            <h1>{title}</h1>
            <p className="create-description">
              {editing
                ? 'Actualiza los datos de la ficha y guarda los cambios cuando hayas terminado.'
                : description}
            </p>
          </div>
        </header>
        <div ref={contentRef} className="create-content">
          {children}
        </div>
      </div>
    </div>
  );
}
