export default function Pagination({
  page,
  total,
  onChange,
  loading = false,
  mostrarRecuento = true,
}) {
  const paginas = Math.max(1, Math.ceil(total / 10));
  if (paginas <= 1) return null;
  return (
    <nav
      aria-label="Paginación"
      className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-t border-gray-100 text-sm"
    >
      {mostrarRecuento && (
        <span role="status" className="text-gray-500">
          {total
            ? `${page * 10 + 1}–${Math.min((page + 1) * 10, total)} de ${total}`
            : '0 resultados'}
        </span>
      )}
      <div className="ml-auto flex items-center gap-3">
        <button
          type="button"
          disabled={loading || page === 0}
          onClick={() => onChange(page - 1)}
          aria-label="Página anterior"
          title="Página anterior"
          className="p-3 bg-transparent text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-default cursor-pointer focus-visible:outline-2 focus-visible:outline-gray-400"
        >
          <span aria-hidden="true">&lt;</span>
        </button>
        <span>
          {page + 1} de {paginas}
        </span>
        <button
          type="button"
          disabled={loading || page + 1 >= paginas}
          onClick={() => onChange(page + 1)}
          aria-label="Página siguiente"
          title="Página siguiente"
          className="p-3 bg-transparent text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-default cursor-pointer focus-visible:outline-2 focus-visible:outline-gray-400"
        >
          <span aria-hidden="true">&gt;</span>
        </button>
      </div>
    </nav>
  );
}
