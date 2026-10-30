import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { esOscuro, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={esOscuro ? 'Cambiar a modo claro (sol)' : 'Cambiar a modo noche (luna)'}
      aria-label={esOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo noche'}
      className="relative p-2 rounded-full transition-all duration-200 focus:outline-none cursor-pointer text-gray-500 hover:text-amber-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-amber-400 dark:hover:bg-gray-800/80 active:scale-95"
    >
      {esOscuro ? (
        // Icono de Sol (para volver al modo día)
        <svg
          className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-45"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364-6.364l-1.414 1.414M7.05 16.95l-1.414 1.414m12.728 0l-1.414-1.414M7.05 7.05L5.636 5.636M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        // Icono de Luna (para pasar a modo noche)
        <svg
          className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 hover:text-indigo-600 transition-transform duration-300 -rotate-12 hover:rotate-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
    </button>
  );
}
