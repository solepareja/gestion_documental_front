/**
 * Validador oficial de DNI y NIE español.
 * 
 * DNI: 8 números + 1 letra (número % 23 mapeado a TRWAGMYFPDXBNJZSQVHLCKE).
 * NIE: Letra inicial (X=0, Y=1, Z=2) + 7 números + 1 letra.
 */

const LETRAS = 'TRWAGMYFPDXBNJZSQVHLCKE';

/**
 * Normaliza una cadena de DNI o NIE: quita espacios, guiones y pasa a mayúsculas.
 */
export function normalizarDni(valor) {
  if (!valor || typeof valor !== 'string') return '';
  return valor.trim().toUpperCase().replace(/[-\s]/g, '');
}

/**
 * Valida un DNI o NIE.
 * @param {string} valor - El DNI o NIE a validar
 * @returns {{ valido: boolean, mensaje?: string, letraEsperada?: string, dniFormateado?: string }}
 */
export function validarDniNie(valor) {
  if (!valor || typeof valor !== 'string' || !valor.trim()) {
    return { valido: false, mensaje: 'El DNI/NIE es obligatorio.' };
  }

  const limpio = normalizarDni(valor);

  const regexDni = /^[0-9]{8}[A-Z]$/;
  const regexNie = /^[XYZ][0-9]{7}[A-Z]$/;

  if (!regexDni.test(limpio) && !regexNie.test(limpio)) {
    return {
      valido: false,
      mensaje: 'Formato no válido. Introduce 8 dígitos y una letra (ej: 12345678Z) o un NIE (ej: X1234567L).',
    };
  }

  let numero;
  if (regexDni.test(limpio)) {
    numero = parseInt(limpio.slice(0, 8), 10);
  } else {
    // NIE: reemplazar X por 0, Y por 1, Z por 2
    const prefijo = limpio[0] === 'X' ? '0' : limpio[0] === 'Y' ? '1' : '2';
    numero = parseInt(prefijo + limpio.slice(1, 8), 10);
  }

  const letraEsperada = LETRAS.charAt(numero % 23);
  const letraActual = limpio.slice(-1);

  if (letraActual !== letraEsperada) {
    return {
      valido: false,
      mensaje: `DNI incorrecto${letraEsperada}`,
      letraEsperada,
    };
  }

  return {
    valido: true,
    dniFormateado: limpio,
  };
}
