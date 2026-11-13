import { useEffect, useState } from 'react';
import api from '../services/api';

export default function usePagedList(tipo, filtros = {}, recarga = 0) {
  const clave = JSON.stringify(filtros);
  const [seleccion, setSeleccion] = useState({ clave, page: 0 });
  const page = seleccion.clave === clave ? seleccion.page : 0;
  const [respuesta, setRespuesta] = useState({
    clave: null,
    page: 0,
    recarga: -1,
    data: [],
    total: 0,
    opciones: {},
    error: null,
  });
  const actual =
    respuesta.clave === clave && respuesta.page === page && respuesta.recarga === recarga;
  useEffect(() => {
    const controller = new AbortController();
    api
      .get(`/listados/${tipo}`, {
        params: { ...JSON.parse(clave), page },
        signal: controller.signal,
      })
      .then(({ data }) => {
        if (controller.signal.aborted) return;
        if (page > 0 && page * 10 >= data.totalElements) {
          setSeleccion({ clave, page: Math.max(0, Math.ceil(data.totalElements / 10) - 1) });
          return;
        }
        setRespuesta({
          clave,
          page,
          recarga,
          data: data.content,
          total: data.totalElements,
          opciones: data.opciones || {},
          error: null,
        });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setRespuesta({
            clave,
            page,
            recarga,
            data: [],
            total: 0,
            opciones: {},
            error:
              error.response?.data?.message ||
              'No se pudieron cargar los registros. Inténtalo de nuevo.',
          });
      });
    return () => controller.abort();
  }, [tipo, clave, page, recarga]);
  const cargando = !actual;
  return {
    data: actual ? respuesta.data : [],
    total: actual ? respuesta.total : 0,
    opciones: respuesta.opciones,
    cargando,
    error: actual ? respuesta.error : null,
    pagination: {
      page,
      total: actual ? respuesta.total : 0,
      loading: cargando,
      onChange: (page) => setSeleccion({ clave, page }),
    },
  };
}
