/**
 *   - 'primary': Botón naranja corporativo para acciones principales.
 *   - 'secondary' / 'outline': Botón blanco con borde gris y hover suave (estilo barra de acciones).
 *   - 'danger': Botón blanco con borde rojo y texto rojo para acciones destructivas.
 *   - 'danger-solid': Botón con fondo rojo sólido.
 *   - 'ghost': Botón transparente sin bordes.
 */

export default function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  icon,
  className = '',
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center gap-1.5 font-semibold rounded-xl transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-offset-1 select-none';

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-3.5 py-2 text-xs sm:text-sm',
    lg: 'px-4 py-2.5 text-sm sm:text-base',
  };

  const variants = {
    // Botón principal (Naranja pastel corporativo)
    primary:
      'bg-brand-500 hover:bg-brand-600 active:scale-[0.98] text-white border-0 shadow-xs hover:shadow-sm focus:ring-brand-300',

    // Botón secundario / acción (Superficie suave por contraste sin bordes)
    secondary:
      'bg-gray-100 hover:bg-gray-200/80 active:scale-[0.98] text-gray-700 dark:text-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 border-0 shadow-none focus:ring-gray-300',
    outline:
      'bg-gray-100 hover:bg-gray-200/80 active:scale-[0.98] text-gray-700 dark:text-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 border-0 shadow-none focus:ring-gray-300',

    // Botón de peligro (Suave por contraste sin bordes)
    danger:
      'bg-red-500/10 text-red-600 hover:bg-red-500/20 active:scale-[0.98] border-0 dark:bg-red-950/40 dark:text-red-300 shadow-none focus:ring-red-300',

    // Peligro sólido
    'danger-solid':
      'bg-red-500 hover:bg-red-600 active:scale-[0.98] text-white border-0 shadow-xs hover:shadow-sm focus:ring-red-300',

    // Botón fantasma
    ghost:
      'bg-transparent text-gray-600 hover:bg-gray-100/70 hover:text-gray-900 border-0 focus:ring-gray-300',
  };

  const chosenVariant = variants[variant] || variants.primary;
  const chosenSize = sizes[size] || sizes.md;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${chosenSize} ${chosenVariant} ${className}`}
      {...props}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
