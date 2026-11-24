export default function DisponibilidadVehiculo({ disponible, motivos = [], forzada = false }) {
  return (
    <span
      title={
        forzada
          ? 'Disponible por decisión manual'
          : motivos.length
            ? motivos.join('\n')
            : 'Todos los documentos registrados y vigentes'
      }
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
        disponible ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
      }`}
    >
      {forzada ? 'Disponible' : disponible ? 'Disponible' : 'No disponible'}
    </span>
  );
}
