import Button from './Button';
import CustomSelect from './CustomSelect';

export default function ListFilters({ id, busqueda, onSearch, placeholder, filters = [], onClear, active, count, total, loading, error }) {
  const controlClass = 'w-full rounded-2xl border-0 bg-gray-100/80 hover:bg-gray-200/60 dark:bg-gray-800 dark:hover:bg-gray-750 px-3.5 py-2.5 text-sm font-medium text-gray-800 dark:text-gray-200 focus:outline-none focus:bg-white dark:focus:bg-gray-950 focus:ring-2 focus:ring-brand-500 transition-all';
  return <section aria-label="Buscar y filtrar el listado" className="mb-5 rounded-3xl border-0 bg-white dark:bg-gray-900 p-4 sm:p-5 shadow-sm">
    <div className="flex flex-wrap items-end gap-4">
      <div className="flex-1 min-w-0 basis-full sm:basis-64">
        <label htmlFor={`${id}-buscar`} className="block text-xs font-semibold text-gray-600 mb-2">Buscar</label>
        <div className="relative">
          <svg aria-hidden="true" className="absolute left-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="10.5" cy="10.5" r="6.5" /><path strokeLinecap="round" d="m16 16 4.5 4.5" />
          </svg>
          <input id={`${id}-buscar`} type="search" value={busqueda} onChange={event => onSearch(event.target.value)}
            placeholder={placeholder} className={`${controlClass} pl-9`} />
        </div>
      </div>
      {filters.map(filter => <div key={filter.key} className="flex-1 basis-40 min-w-0">
        <label htmlFor={`${id}-${filter.key}`} className="block text-xs font-semibold text-gray-600 mb-2">{filter.label}</label>
        <CustomSelect
          id={`${id}-${filter.key}`}
          disabled={filter.disabled}
          value={filter.value}
          onChange={event => filter.onChange(event.target.value)}
          placeholder={filter.allLabel || 'Todos'}
          options={[
            { value: '', label: filter.allLabel || 'Todos' },
            ...filter.options
          ]}
        />
      </div>)}
      <Button variant="secondary" onClick={onClear} disabled={!active}>Limpiar filtros</Button>
    </div>
    {!loading && !error && Number.isFinite(count) && Number.isFinite(total) && <p role="status" aria-live="polite" className="mt-4 text-xs text-gray-500">
      Mostrando <span className="font-semibold text-gray-700">{count}</span> de {total} resultados
    </p>}
  </section>;
}
