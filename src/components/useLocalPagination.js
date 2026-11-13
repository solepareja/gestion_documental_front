import { useState } from 'react';
export default function useLocalPagination(datos, clave = '') {
  const [seleccion, setSeleccion] = useState({ clave, page: 0 });
  const page = Math.min(
    seleccion.clave === clave ? seleccion.page : 0,
    Math.max(0, Math.ceil(datos.length / 10) - 1),
  );
  return {
    visibles: datos.slice(page * 10, page * 10 + 10),
    pagination: { page, total: datos.length, onChange: (page) => setSeleccion({ clave, page }) },
  };
}
