import { useLayoutEffect } from 'react';
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

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
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
        <div className="create-content">{children}</div>
      </div>
    </div>
  );
}
