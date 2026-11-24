import { useCallback, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';

// El layout conserva este estado mientras se navega dentro del mismo apartado.
export default function useEstadoApartado(clave, valorInicial) {
  const { estadoApartado, setEstadoApartado } = useOutletContext();
  const [inicial] = useState(valorInicial);
  const existe = Object.hasOwn(estadoApartado, clave);

  useEffect(() => {
    setEstadoApartado((prev) =>
      Object.hasOwn(prev, clave) ? prev : { ...prev, [clave]: inicial },
    );
  }, [clave, inicial, setEstadoApartado]);

  const actualizar = useCallback(
    (valor) => {
      setEstadoApartado((prev) => {
        const anterior = Object.hasOwn(prev, clave) ? prev[clave] : inicial;
        return { ...prev, [clave]: typeof valor === 'function' ? valor(anterior) : valor };
      });
    },
    [clave, inicial, setEstadoApartado],
  );

  return [existe ? estadoApartado[clave] : inicial, actualizar];
}
