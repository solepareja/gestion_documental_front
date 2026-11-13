export default function BarraProgreso({ actual = 0, total = 0 }) {
  const porcentaje = total > 0 ? Math.round((actual / total) * 100) : 0;

  const getEstilosColor = () => {
    if (porcentaje === 100) return 'bg-emerald-500 text-emerald-700';
    if (porcentaje >= 60) return 'bg-blue-600 text-blue-700';
    if (porcentaje >= 30) return 'bg-amber-500 text-amber-700';
    return 'bg-rose-500 text-rose-700';
  };

  const estilo = getEstilosColor();
  const bgBarra = estilo.split(' ')[0];
  const textPorcentaje = estilo.split(' ').slice(1).join(' ');

  return (
    <div className="w-[120px] max-w-full">
      <div className="flex flex-wrap justify-between items-center gap-x-3 gap-y-1 text-[11px] font-semibold mb-1 tabular-nums">
        <span className="text-gray-700 whitespace-nowrap">
          {actual}/{total}
        </span>
        <span className={`whitespace-nowrap ${textPorcentaje}`}>{porcentaje}%</span>
      </div>
      <div className="w-full bg-gray-200/90 rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-500 ease-out ${bgBarra}`}
          style={{ width: `${Math.min(100, Math.max(0, porcentaje))}%` }}
        />
      </div>
    </div>
  );
}
