import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import NavBar from '../components/NavBar';

function Apartado() {
  const [estadoApartado, setEstadoApartado] = useState({});

  return <Outlet context={{ estadoApartado, setEstadoApartado }} />;
}

export default function MainLayout() {
  const { pathname } = useLocation();
  const [apartado, setApartado] = useState(() => pathname.split('/')[1]);
  // Abrir una ficha (incluso de otro recurso) conserva el apartado de origen.
  // Entrar en otro listado desde el menú inicia un apartado nuevo.
  const esListado = pathname.split('/').filter(Boolean).length <= 1;
  const destino = pathname.split('/')[1];
  if (esListado && destino !== apartado) setApartado(destino);

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 flex flex-col print:bg-white print:min-h-0 transition-colors duration-200">
      {/* Menú Superior */}
      <NavBar />
      <main className="p-3 sm:p-6 min-w-0 max-w-7xl mx-auto w-full flex-1 print:p-0 print:m-0 print:max-w-none">
        <Apartado key={apartado} />
      </main>
    </div>
  );
}
