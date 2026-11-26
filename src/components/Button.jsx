/**
 *   - 'primary' / 'secondary' / 'outline': Botón gris claro.
 *   - 'add': Botón gris claro para añadir elementos.
 *   - 'danger': Botón blanco con borde rojo y texto rojo para acciones destructivas.
 *   - 'danger-solid': Botón con fondo rojo sólido.
 *   - 'ghost': Botón transparente sin bordes.
 */

export default function Button({
  as: Component = 'button',
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
    sm: 'min-h-8 px-3 py-1.5 text-xs leading-4',
    md: 'min-h-10 px-3.5 py-2 text-sm leading-5',
    lg: 'min-h-11 px-4 py-2.5 text-base leading-6',
  };

  const variants = {
    // Acción principal de formularios; no altera los botones generales.
    'form-submit':
      'bg-brand-500 hover:bg-brand-900 active:scale-[0.98] text-white border-0 shadow-none focus:ring-brand-400',
    add: 'bg-gray-100 hover:bg-gray-200/80 active:scale-[0.98] text-gray-700 border-0 shadow-none focus:ring-gray-300',
    // Acciones con superficie gris clara y discreta.
    primary:
      'bg-gray-100 hover:bg-gray-200/80 active:scale-[0.98] text-gray-700 border-0 shadow-none focus:ring-gray-300',

    // Botón secundario / acción (Superficie suave por contraste sin bordes)
    secondary:
      'bg-gray-100 hover:bg-gray-200/80 active:scale-[0.98] text-gray-700 border-0 shadow-none focus:ring-gray-300',
    outline:
      'bg-gray-100 hover:bg-gray-200/80 active:scale-[0.98] text-gray-700 border-0 shadow-none focus:ring-gray-300',

    // Botón de peligro (Suave por contraste sin bordes)
    danger:
      'bg-red-500/10 text-red-600 hover:bg-red-500/20 active:scale-[0.98] border-0 shadow-none focus:ring-red-300',

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
    <Component
      type={Component === 'button' ? type : undefined}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${chosenSize} ${chosenVariant} ${className}`}
      {...props}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      {children}
    </Component>
  );
}
