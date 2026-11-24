import { parrafosLegalesEntrega } from '../utils/entregaLegal';

export default function DeclaracionEntrega() {
  return (
    <div className="bg-brand-500/10 p-4 rounded-2xl text-xs text-brand-950 space-y-2">
      <p className="font-bold">Declaración de recepción y conformidad:</p>
      <p className="text-gray-600 leading-relaxed">{parrafosLegalesEntrega[0]}</p>
      <details className="group">
        <summary className="cursor-pointer py-2 font-semibold text-brand-950 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500">
          <span className="group-open:hidden">Leer más</span>
          <span className="hidden group-open:inline">Ocultar</span>
        </summary>
        <div className="pt-2 space-y-3 text-gray-600 leading-relaxed">
          {parrafosLegalesEntrega.slice(1, -1).map((parrafo) => (
            <p key={parrafo}>{parrafo}</p>
          ))}
        </div>
      </details>
    </div>
  );
}
