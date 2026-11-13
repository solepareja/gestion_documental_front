import { useState } from 'react';

export default function SearchInput({ value = '', onChange, className = '', ...props }) {
  const [texto, setTexto] = useState(value);
  const [valorAnterior, setValorAnterior] = useState(value);
  if (valorAnterior !== value) {
    setValorAnterior(value);
    setTexto(value);
  }

  return (
    <form
      role="search"
      className="relative flex items-center min-w-0"
      onSubmit={(event) => {
        event.preventDefault();
        onChange({ target: { value: texto.trim() } });
      }}
    >
      <input
        aria-label={props.placeholder || 'Buscar'}
        {...props}
        value={texto}
        onChange={(event) => setTexto(event.target.value)}
        className={`min-w-0 flex-1 ${className} pr-12!`}
      />
      <button
        type="submit"
        aria-label="Buscar"
        title="Buscar"
        className="absolute right-1 inset-y-0 w-11 flex items-center justify-center text-gray-500 hover:text-gray-800 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400 rounded-lg"
      >
        <svg
          aria-hidden="true"
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path strokeLinecap="round" d="m16 16 4.5 4.5" />
        </svg>
      </button>
    </form>
  );
}
