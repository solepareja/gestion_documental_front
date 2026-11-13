import { useState } from 'react';
import SearchInput from './SearchInput';
import Button from './Button';
import CustomSelect from './CustomSelect';

export default function ListFilters({
  id,
  busqueda,
  onSearch,
  placeholder,
  filters = [],
  onClear,
  count,
  total,
  loading,
  error,
}) {
  const [resetBusqueda, setResetBusqueda] = useState(0);
  const controlClass =
    'h-11 w-full rounded-2xl border-0 bg-gray-100/80 hover:bg-gray-200/60 px-3.5 py-2.5 text-sm font-medium text-gray-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand-500 transition-all';
  return (
    <section
      aria-label="Buscar y filtrar el listado"
      className="mb-5 rounded-2xl border-0 bg-white p-4 sm:p-5 shadow-xs"
    >
      <div className="flex flex-wrap items-end gap-x-4 gap-y-4">
        <div className="flex-1 min-w-0 basis-full sm:basis-64">
          <label
            htmlFor={`${id}-buscar`}
            className="block text-xs font-semibold text-gray-600 mb-2"
          >
            Buscar
          </label>
          <div className="relative">
            <SearchInput
              key={`${id}-${resetBusqueda}`}
              id={`${id}-buscar`}
              type="search"
              value={busqueda}
              onChange={(event) => onSearch(event.target.value)}
              placeholder={placeholder}
              className={`${controlClass} pl-4`}
            />
          </div>
        </div>
        {filters.map((filter) => (
          <div key={filter.key} className="flex-1 basis-full sm:basis-44 min-w-0">
            <label
              htmlFor={`${id}-${filter.key}`}
              className="block text-xs font-semibold text-gray-600 mb-2"
            >
              {filter.label}
            </label>
            <CustomSelect
              id={`${id}-${filter.key}`}
              className="h-11"
              disabled={filter.disabled}
              value={filter.value}
              onChange={(event) => filter.onChange(event.target.value)}
              placeholder={filter.allLabel || 'Todos'}
              options={[{ value: '', label: filter.allLabel || 'Todos' }, ...filter.options]}
            />
          </div>
        ))}
        <Button
          variant="secondary"
          className="h-11 w-full sm:w-auto shrink-0 whitespace-nowrap"
          onClick={() => {
            onClear();
            setResetBusqueda((actual) => actual + 1);
          }}
        >
          Limpiar filtros
        </Button>
      </div>
      {!loading && !error && Number.isFinite(count) && Number.isFinite(total) && (
        <p
          role="status"
          aria-live="polite"
          className="mt-4 border-t border-gray-100 pt-3 text-xs text-gray-500"
        >
          {count === total
            ? `${total} ${total === 1 ? 'resultado' : 'resultados'}`
            : `${count} de ${total} resultados`}
        </p>
      )}
    </section>
  );
}
