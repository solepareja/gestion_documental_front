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
    // Botón principal (Naranja corporativo)
    primary:
      'bg-brand-600 hover:bg-brand-700 text-white border border-brand-600 shadow-xs focus:ring-brand-500',

    // Botón secundario / acción (Blanco con borde gris suave)
    secondary:
      'bg-white text-gray-700 hover:text-gray-900 hover:bg-gray-50 border border-gray-200 shadow-xs focus:ring-gray-300',
    outline:
      'bg-white text-gray-700 hover:text-gray-900 hover:bg-gray-50 border border-gray-200 shadow-xs focus:ring-gray-300',

    // Botón de peligro (Blanco con borde y texto rojo)
    danger:
      'bg-white text-red-600 hover:bg-red-50 border border-red-200 shadow-xs focus:ring-red-300',

    // Peligro sólido
    'danger-solid':
      'bg-red-600 hover:bg-red-700 text-white border border-red-600 shadow-xs focus:ring-red-500',

    // Botón fantasma
    ghost:
      'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-transparent focus:ring-gray-300',
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
