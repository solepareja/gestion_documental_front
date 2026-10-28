/**
 * Pictogramas vectoriales oficiales de vehículos del permiso de conducir DGT / Unión Europea
 * Siluetas negras vectorizadas idénticas a las del reverso de la tarjeta de conducción física.
 */

// AM: Ciclomotor / Scooter
export function IconoAM({ className = "w-8 h-4 text-gray-800" }) {
  return (
    <svg viewBox="0 0 32 16" fill="currentColor" className={className} aria-label="Ciclomotor AM">
      <circle cx="6" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="6" cy="12" r="1.1" />
      <circle cx="26" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="26" cy="12" r="1.1" />
      <path d="M6 12 L11 12 L14 13 L19 13 L22 8 L24 6.5 L23 4.5 L25 4.5 L26 6.5 L25 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M5 8.5 C7 7 12 7 14 9.5 L12 12 L8 12 Z" />
      <path d="M22 4.5 L25 4.5 L26.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// A1: Motocicleta ligera hasta 125cc
export function IconoA1({ className = "w-8 h-4 text-gray-800" }) {
  return (
    <svg viewBox="0 0 32 16" fill="currentColor" className={className} aria-label="Motocicleta A1">
      <circle cx="6" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="26" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M6 12 L11 9 L17 9 L22 6 L25 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M11 9 L14 12 L24 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M10 7.5 C12 6.5 15 6.5 18 8 L16 10 L9 9.5 Z" />
      <path d="M23 4 L26 6 L25 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// A2: Motocicleta media hasta 35kW
export function IconoA2({ className = "w-8 h-4 text-gray-800" }) {
  return (
    <svg viewBox="0 0 32 16" fill="currentColor" className={className} aria-label="Motocicleta A2">
      <circle cx="6" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="26" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M6 12 L12 8.5 L18 8.5 L22 5.5 L26 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d="M9 7 C12 5.5 16 5.5 19 7.5 L17 11 L10 9.5 Z" />
      <path d="M12 8.5 L14 12 L20 12" stroke="currentColor" strokeWidth="1.6" fill="none" />
      <path d="M22 3.5 L25 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// A: Motocicleta grande
export function IconoA({ className = "w-8 h-4 text-gray-800" }) {
  return (
    <svg viewBox="0 0 32 16" fill="currentColor" className={className} aria-label="Motocicleta A">
      <circle cx="6" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="26" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M19 6.5 L24 3 L27 5.5 L26 12" stroke="currentColor" strokeWidth="1.6" fill="none" />
      <path d="M8 8 C11 5.5 17 5 21 6.5 L19 11.5 L10 10.5 Z" />
      <path d="M6 12 L12 9 L15 12 L21 12" stroke="currentColor" strokeWidth="1.6" fill="none" />
      <path d="M22 2.5 L25 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// B1: Cuadriciclo / Micro-furgoneta (dibujo exacto del carnet)
export function IconoB1({ className = "w-8 h-4 text-gray-800" }) {
  return (
    <svg viewBox="0 0 32 16" fill="currentColor" className={className} aria-label="Cuadriciclo B1">
      <path d="M3 12 L3 5.5 C3 5 3.5 4.5 4 4.5 L18 4.5 L23 8 L28 8.5 C28.5 8.5 29 9 29 9.5 L29 12 L26.5 12 A 2.5 2.5 0 0 0 21.5 12 L10.5 12 A 2.5 2.5 0 0 0 5.5 12 Z" />
      <path d="M18 5.5 L10 5.5 L10 8 L18 8 Z" fill="white" />
      <path d="M19 5.5 L22.5 8 L19 8 Z" fill="white" />
      <circle cx="8" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="8" cy="12" r="0.8" />
      <circle cx="24" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="24" cy="12" r="0.8" />
    </svg>
  );
}

// B: Turismo / Coche (hatchback exacto del carnet)
export function IconoB({ className = "w-9 h-4 text-gray-800" }) {
  return (
    <svg viewBox="0 0 34 16" fill="currentColor" className={className} aria-label="Turismo B">
      <path d="M2 12 L3.5 9 L8 5.5 L20 5.5 L25 8.5 L31 9.5 C31.5 9.5 32 10 32 10.5 L32 12 L28.5 12 A 2.5 2.5 0 0 0 23.5 12 L10.5 12 A 2.5 2.5 0 0 0 5.5 12 Z" />
      <path d="M8.5 6.5 L14 6.5 L14 8.5 L6 8.5 Z" fill="white" />
      <path d="M15 6.5 L19.5 6.5 L23.5 8.5 L15 8.5 Z" fill="white" />
      <circle cx="8" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="8" cy="12" r="0.8" />
      <circle cx="26" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="26" cy="12" r="0.8" />
    </svg>
  );
}

// C1: Camión ligero rígido (caja cerrada y cabina unida)
export function IconoC1({ className = "w-9 h-4 text-gray-800" }) {
  return (
    <svg viewBox="0 0 34 16" fill="currentColor" className={className} aria-label="Camión C1">
      <path d="M2 12 L2 4 C2 3.5 2.5 3.5 3 3.5 L21 3.5 L21 5.5 L25 5.5 L29 8.5 L29 12 L26.5 12 A 2.5 2.5 0 0 0 21.5 12 L10.5 12 A 2.5 2.5 0 0 0 5.5 12 Z" />
      <path d="M22 6.5 L24.5 6.5 L27.5 8.5 L22 8.5 Z" fill="white" />
      <line x1="4" y1="6" x2="19" y2="6" stroke="white" strokeWidth="0.8" />
      <line x1="4" y1="8.5" x2="19" y2="8.5" stroke="white" strokeWidth="0.8" />
      <circle cx="8" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="8" cy="12" r="0.8" />
      <circle cx="24" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="24" cy="12" r="0.8" />
    </svg>
  );
}

// C: Camión pesado rígido (caja larga con doble eje trasero)
export function IconoC({ className = "w-10 h-4 text-gray-800" }) {
  return (
    <svg viewBox="0 0 38 16" fill="currentColor" className={className} aria-label="Camión pesado C">
      <path d="M2 12 L2 3.5 C2 3 2.5 3 3 3 L24 3 L24 5 L28 5 L33 8.5 L33 12 L30.5 12 A 2.4 2.4 0 0 0 25.5 12 L16.5 12 A 2.4 2.4 0 0 0 11.5 12 A 2.4 2.4 0 0 0 6.5 12 Z" />
      <path d="M25 6 L27.5 6 L31.5 8.5 L25 8.5 Z" fill="white" />
      <line x1="4" y1="5.5" x2="22" y2="5.5" stroke="white" strokeWidth="0.8" />
      <line x1="4" y1="8" x2="22" y2="8" stroke="white" strokeWidth="0.8" />
      <circle cx="9" cy="12" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="9" cy="12" r="0.8" />
      <circle cx="14" cy="12" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="14" cy="12" r="0.8" />
      <circle cx="28" cy="12" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="28" cy="12" r="0.8" />
    </svg>
  );
}

// D1: Minibús hasta 16 plazas
export function IconoD1({ className = "w-9 h-4 text-gray-800" }) {
  return (
    <svg viewBox="0 0 34 16" fill="currentColor" className={className} aria-label="Minibús D1">
      <path d="M2 12 L2 5.5 C2 4.5 3 4.5 4 4.5 L27 4.5 L30 7.5 L30 12 L27.5 12 A 2.5 2.5 0 0 0 22.5 12 L10.5 12 A 2.5 2.5 0 0 0 5.5 12 Z" />
      <rect x="5" y="6" width="4.5" height="3" rx="0.4" fill="white" />
      <rect x="11" y="6" width="4.5" height="3" rx="0.4" fill="white" />
      <rect x="17" y="6" width="4.5" height="3" rx="0.4" fill="white" />
      <path d="M23 6 L26.5 6 L28.5 8.5 L23 8.5 Z" fill="white" />
      <circle cx="8" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="8" cy="12" r="0.8" />
      <circle cx="25" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="25" cy="12" r="0.8" />
    </svg>
  );
}

// D: Autobús grande
export function IconoD({ className = "w-10 h-4 text-gray-800" }) {
  return (
    <svg viewBox="0 0 40 16" fill="currentColor" className={className} aria-label="Autobús D">
      <path d="M2 12 L2 5 C2 4 3 4 4 4 L33 4 L36 7 L36 12 L33.5 12 A 2.5 2.5 0 0 0 28.5 12 L10.5 12 A 2.5 2.5 0 0 0 5.5 12 Z" />
      <rect x="4.5" y="5.5" width="4" height="3" rx="0.4" fill="white" />
      <rect x="10" y="5.5" width="4" height="3" rx="0.4" fill="white" />
      <rect x="15.5" y="5.5" width="4" height="3" rx="0.4" fill="white" />
      <rect x="21" y="5.5" width="4" height="3" rx="0.4" fill="white" />
      <path d="M26.5 5.5 L32 5.5 L34.5 8 L26.5 8 Z" fill="white" />
      <circle cx="8" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="8" cy="12" r="0.8" />
      <circle cx="31" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="31" cy="12" r="0.8" />
    </svg>
  );
}

// BE: Turismo + Remolque (remolque a la izquierda, coche tirando a la derecha)
export function IconoBE({ className = "w-12 h-4 text-gray-800" }) {
  return (
    <svg viewBox="0 0 50 16" fill="currentColor" className={className} aria-label="Turismo con remolque BE">
      {/* Remolque izquierdo */}
      <path d="M2 12 L2 6 C2 5.5 2.5 5.5 3 5.5 L15 5.5 L15 12 L11.5 12 A 2.5 2.5 0 0 0 6.5 12 Z" />
      <circle cx="9" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="9" cy="12" r="0.8" />
      <line x1="4" y1="8" x2="13" y2="8" stroke="white" strokeWidth="0.8" />
      {/* Enganche */}
      <line x1="15" y1="11" x2="20" y2="11" stroke="currentColor" strokeWidth="1.6" />
      {/* Coche derecho B */}
      <path d="M20 12 L21.5 9 L25 5.5 L36 5.5 L40.5 8.5 L46 9.5 C46.5 9.5 47 10 47 10.5 L47 12 L44.5 12 A 2.5 2.5 0 0 0 39.5 12 L28.5 12 A 2.5 2.5 0 0 0 23.5 12 Z" />
      <path d="M25.5 6.5 L30 6.5 L30 8.5 L23.5 8.5 Z" fill="white" />
      <path d="M31 6.5 L35.5 6.5 L39.5 8.5 L31 8.5 Z" fill="white" />
      <circle cx="26" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="26" cy="12" r="0.8" />
      <circle cx="42" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="42" cy="12" r="0.8" />
    </svg>
  );
}

// C1E: Camión ligero + Remolque
export function IconoC1E({ className = "w-13 h-4 text-gray-800" }) {
  return (
    <svg viewBox="0 0 52 16" fill="currentColor" className={className} aria-label="Camión C1 con remolque C1E">
      {/* Remolque izquierdo */}
      <path d="M2 12 L2 5 C2 4.5 2.5 4.5 3 4.5 L15 4.5 L15 12 L11.5 12 A 2.5 2.5 0 0 0 6.5 12 Z" />
      <circle cx="9" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="9" cy="12" r="0.8" />
      <line x1="4" y1="7.5" x2="13" y2="7.5" stroke="white" strokeWidth="0.8" />
      {/* Enganche */}
      <line x1="15" y1="11" x2="20" y2="11" stroke="currentColor" strokeWidth="1.6" />
      {/* Camión C1 derecho */}
      <path d="M20 12 L20 4 L37 4 L37 6 L41 6 L45 8.5 L45 12 L42.5 12 A 2.5 2.5 0 0 0 37.5 12 L28.5 12 A 2.5 2.5 0 0 0 23.5 12 Z" />
      <path d="M38 7 L40.5 7 L43.5 8.5 L38 8.5 Z" fill="white" />
      <line x1="22" y1="6.5" x2="35" y2="6.5" stroke="white" strokeWidth="0.8" />
      <line x1="22" y1="9" x2="35" y2="9" stroke="white" strokeWidth="0.8" />
      <circle cx="26" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="26" cy="12" r="0.8" />
      <circle cx="40" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="40" cy="12" r="0.8" />
    </svg>
  );
}

// CE: Tráiler / Semirremolque articulado
export function IconoCE({ className = "w-13 h-4 text-gray-800" }) {
  return (
    <svg viewBox="0 0 52 16" fill="currentColor" className={className} aria-label="Tráiler articulado CE">
      {/* Semirremolque articulado izquierdo con doble eje */}
      <path d="M2 12 L2 3.5 C2 3 2.5 3 3 3 L32 3 L32 9 L28 9 L28 12 L17.5 12 A 2.4 2.4 0 0 0 12.5 12 A 2.4 2.4 0 0 0 7.5 12 Z" />
      <line x1="4" y1="5.5" x2="30" y2="5.5" stroke="white" strokeWidth="0.8" />
      <line x1="4" y1="8" x2="30" y2="8" stroke="white" strokeWidth="0.8" />
      <circle cx="10" cy="12" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="10" cy="12" r="0.8" />
      <circle cx="15" cy="12" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="15" cy="12" r="0.8" />
      {/* Cabeza tractora derecha */}
      <path d="M30 9 L34 5.5 L39 5.5 L44 8.5 L44 12 L41.5 12 A 2.4 2.4 0 0 0 36.5 12 L30 12 Z" />
      <path d="M35 6.5 L38.5 6.5 L42.5 8.5 L35 8.5 Z" fill="white" />
      <circle cx="34" cy="12" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="34" cy="12" r="0.8" />
      <circle cx="39" cy="12" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="39" cy="12" r="0.8" />
    </svg>
  );
}

// D1E: Minibús con remolque
export function IconoD1E({ className = "w-13 h-4 text-gray-800" }) {
  return (
    <svg viewBox="0 0 52 16" fill="currentColor" className={className} aria-label="Minibús con remolque D1E">
      {/* Remolque izquierdo */}
      <path d="M2 12 L2 5.5 C2 5 2.5 5 3 5 L14 5 L14 12 L11.5 12 A 2.5 2.5 0 0 0 6.5 12 Z" />
      <circle cx="9" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="9" cy="12" r="0.8" />
      {/* Enganche */}
      <line x1="14" y1="11" x2="19" y2="11" stroke="currentColor" strokeWidth="1.6" />
      {/* Minibús D1 derecho */}
      <path d="M19 12 L19 5.5 C19 4.5 20 4.5 21 4.5 L42 4.5 L45 7.5 L45 12 L42.5 12 A 2.5 2.5 0 0 0 37.5 12 L27.5 12 A 2.5 2.5 0 0 0 22.5 12 Z" />
      <rect x="22" y="6" width="3.5" height="3" rx="0.4" fill="white" />
      <rect x="27" y="6" width="3.5" height="3" rx="0.4" fill="white" />
      <rect x="32" y="6" width="3.5" height="3" rx="0.4" fill="white" />
      <path d="M38 6 L41.5 6 L43.5 8.5 L38 8.5 Z" fill="white" />
      <circle cx="25" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="25" cy="12" r="0.8" />
      <circle cx="40" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="40" cy="12" r="0.8" />
    </svg>
  );
}

// DE: Autobús con remolque
export function IconoDE({ className = "w-14 h-4 text-gray-800" }) {
  return (
    <svg viewBox="0 0 54 16" fill="currentColor" className={className} aria-label="Autobús con remolque DE">
      {/* Remolque izquierdo */}
      <path d="M2 12 L2 5.5 C2 5 2.5 5 3 5 L14 5 L14 12 L11.5 12 A 2.5 2.5 0 0 0 6.5 12 Z" />
      <circle cx="9" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="9" cy="12" r="0.8" />
      {/* Enganche */}
      <line x1="14" y1="11" x2="19" y2="11" stroke="currentColor" strokeWidth="1.6" />
      {/* Autobús D derecho */}
      <path d="M19 12 L19 5 C19 4 20 4 21 4 L45 4 L48 7 L48 12 L45.5 12 A 2.5 2.5 0 0 0 40.5 12 L27.5 12 A 2.5 2.5 0 0 0 22.5 12 Z" />
      <rect x="21.5" y="5.5" width="3.5" height="3" rx="0.4" fill="white" />
      <rect x="26.5" y="5.5" width="3.5" height="3" rx="0.4" fill="white" />
      <rect x="31.5" y="5.5" width="3.5" height="3" rx="0.4" fill="white" />
      <rect x="36.5" y="5.5" width="3.5" height="3" rx="0.4" fill="white" />
      <path d="M42 5.5 L44.5 5.5 L46.5 8 L42 8 Z" fill="white" />
      <circle cx="25" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="25" cy="12" r="0.8" />
      <circle cx="43" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="43" cy="12" r="0.8" />
    </svg>
  );
}

// Diccionario de componentes de iconos por código de carnet
export const ICONOS_CARNET = {
  AM: IconoAM,
  A1: IconoA1,
  A2: IconoA2,
  A: IconoA,
  B1: IconoB1,
  B: IconoB,
  C1: IconoC1,
  C: IconoC,
  D1: IconoD1,
  D: IconoD,
  BE: IconoBE,
  C1E: IconoC1E,
  CE: IconoCE,
  D1E: IconoD1E,
  DE: IconoDE,
};

export default function IconoVehiculoCarnet({ codigo, className }) {
  const Icono = ICONOS_CARNET[codigo?.toUpperCase()] || IconoB;
  return <Icono className={className} />;
}
