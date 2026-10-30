/**
 * Componente de Tabla reutilizable con estilo moderno:
 * - Bordes exteriores redondeados (rounded-2xl) y sombra suave.
 * - Sin líneas verticales y con divisores horizontales casi imperceptibles (divide-gray-100).
 * - Todo el contenido alineado a la izquierda por defecto (text-left) y con espaciado equilibrado.
 * - Soporta uso declarativo (props `columns` y `data`) o composición con subcomponentes (children).
 */

export function TableHead({ children, className = '' }) {
  return (
    <thead className={`bg-gray-50/75 dark:bg-gray-950 border-b-2 border-gray-200 dark:border-gray-700 ${className}`}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = '' }) {
  return (
    <tbody className={`divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900 ${className}`}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, onClick, className = '', hoverable = true }) {
  return (
    <tr
      onClick={onClick}
      className={`transition-colors duration-150 ${
        hoverable ? 'hover:bg-slate-50/80 dark:hover:bg-gray-800/60' : ''
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </tr>
  );
}

export function TableHeader({ children, align = 'left', className = '' }) {
  const alignClass =
    align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';

  return (
    <th
      scope="col"
      className={`px-6 py-3.5 ${alignClass} text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider ${className}`}
    >
      {children}
    </th>
  );
}

export function TableCell({ children, align = 'left', className = '' }) {
  const alignClass =
    align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';

  return (
    <td className={`px-6 py-4 ${alignClass} text-sm text-gray-700 dark:text-gray-200 align-middle [overflow-wrap:anywhere] ${className}`}>
      {children}
    </td>
  );
}

function getCellValue(item, column, index) {
  if (column.render) {
    return column.render(item, index);
  }
  if (typeof column.accessor === 'function') {
    return column.accessor(item);
  }
  if (typeof column.accessor === 'string') {
    return item[column.accessor];
  }
  if (column.key) {
    return item[column.key];
  }
  return null;
}

export default function Table({
  columns,
  data,
  children,
  keyField = 'id',
  emptyMessage = 'No hay datos disponibles',
  isLoading = false,
  onRowClick,
  hoverable = true,
  className = '',
  tableClassName = '',
  minWidth = 720,
}) {
  // Modo composición mediante children
  if (children) {
    return (
      <div className={`w-full overflow-hidden rounded-2xl bg-white dark:bg-gray-900 shadow-xs border border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="overflow-x-auto">
          <table style={{ minWidth }} className={`w-full table-fixed border-collapse text-left ${tableClassName}`}>
            {children}
          </table>
        </div>
      </div>
    );
  }

  // Modo declarativo (props columns y data)
  return (
    <div className={`w-full overflow-hidden rounded-2xl bg-white dark:bg-gray-900 shadow-xs border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="overflow-x-auto">
        <table style={{ minWidth }} className={`w-full table-fixed border-collapse text-left ${tableClassName}`}>
          <colgroup>
            {columns?.map((col, idx) => <col key={idx} style={{ width: col.width }} />)}
          </colgroup>
          <TableHead>
            <TableRow hoverable={false}>
              {columns?.map((col, idx) => (
                <TableHeader
                  key={col.key || col.accessor || idx}
                  align={col.align || 'left'}
                  className={col.headerClassName || ''}
                >
                  {col.header}
                </TableHeader>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, rIdx) => (
                <TableRow key={`skeleton-row-${rIdx}`} hoverable={false}>
                  {columns?.map((col, cIdx) => (
                    <TableCell key={`skeleton-cell-${cIdx}`} align={col.align || 'left'}>
                      <div className={`h-4 bg-gray-100 rounded animate-pulse w-3/4 ${col.align === 'right' ? 'ml-auto' : ''}`} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data && data.length > 0 ? (
              data.map((item, rowIdx) => (
                <TableRow
                  key={item[keyField] ?? rowIdx}
                  onClick={onRowClick ? () => onRowClick(item) : undefined}
                  hoverable={hoverable}
                >
                  {columns?.map((col, colIdx) => (
                    <TableCell
                      key={col.key || col.accessor || colIdx}
                      align={col.align || 'left'}
                      className={col.className || ''}
                    >
                      {getCellValue(item, col, rowIdx)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns?.length || 1}
                  className="px-6 py-12 text-center text-sm text-gray-400"
                >
                  <div className="flex flex-col items-center justify-center space-y-1.5">
                    <svg
                      className="w-8 h-8 text-gray-300 mb-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                    <span className="font-medium text-gray-500">{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            )}
          </TableBody>
        </table>
      </div>
    </div>
  );
}

// Asignación de subcomponentes estáticos
Table.Head = TableHead;
Table.Body = TableBody;
Table.Row = TableRow;
Table.Header = TableHeader;
Table.Cell = TableCell;
