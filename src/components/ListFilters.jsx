import Button from './Button';

export default function ListFilters({ id, busqueda, onSearch, placeholder, filters = [], onClear, active, count, total, loading, error }) {
  const controlClass = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500';
  return <section aria-label="Buscar y filtrar el listado" className="mb-5 rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-xs">
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
        <select id={`${id}-${filter.key}`} className={controlClass} disabled={filter.disabled} value={filter.value} onChange={event => filter.onChange(event.target.value)}>
          <option value="">{filter.allLabel || 'Todos'}</option>
          {filter.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </div>)}
      <Button variant="secondary" onClick={onClear} disabled={!active}>Limpiar filtros</Button>
    </div>
    {!loading && !error && Number.isFinite(count) && Number.isFinite(total) && <p role="status" aria-live="polite" className="mt-4 text-xs text-gray-500">
      Mostrando <span className="font-semibold text-gray-700">{count}</span> de {total} resultados
    </p>}
  </section>;
}
