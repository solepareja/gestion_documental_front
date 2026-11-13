import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    try {
      const guardado = localStorage.getItem('usuario_sesion');
      return guardado ? JSON.parse(guardado) : null;
    } catch {
      return null;
    }
  });
  const [modoTablet, setModoTablet] = useState(
    () => localStorage.getItem('modo_tablet') === 'activo',
  );
  const activarModoTablet = useCallback(() => {
    localStorage.setItem('modo_tablet', 'activo');
    setModoTablet(true);
  }, []);

  useEffect(() => {
    const sincronizar = () => {
      setModoTablet(localStorage.getItem('modo_tablet') === 'activo');
      try {
        setUsuario(JSON.parse(localStorage.getItem('usuario_sesion')));
      } catch {
        setUsuario(null);
      }
    };
    window.addEventListener('storage', sincronizar);
    return () => window.removeEventListener('storage', sincronizar);
  }, []);

  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (usuario) {
      localStorage.setItem('usuario_sesion', JSON.stringify(usuario));
    } else {
      localStorage.removeItem('usuario_sesion');
    }
  }, [usuario]);

  const login = async (correo, contrasenya) => {
    setCargando(true);
    try {
      let res;
      try {
        res = await api.post('/auth/login', { correo: correo.trim(), contrasenya });
      } catch (err) {
        if (err.response?.status === 404) {
          res = await api.post('/usuarios/login', { correo: correo.trim(), contrasenya });
        } else {
          throw err;
        }
      }
      setUsuario(res.data);
      return res.data;
    } finally {
      setCargando(false);
    }
  };

  const registro = async ({ nombre, correo, contrasenya }) => {
    setCargando(true);
    try {
      try {
        await api.post('/auth/registro', {
          nombre: nombre.trim(),
          correo: correo.trim(),
          contrasenya,
          admin: false,
          rol: 'USUARIO',
        });
      } catch (err) {
        if (err.response?.status === 404) {
          await api.post('/usuarios', {
            nombre: nombre.trim(),
            correo: correo.trim(),
            contrasenya,
            admin: false,
            rol: 'USUARIO',
          });
        } else {
          throw err;
        }
      }

      // Tras registrarse correctamente, iniciamos sesión automáticamente
      const loginRes = await login(correo, contrasenya);
      return loginRes;
    } finally {
      setCargando(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('modo_tablet');
    setModoTablet(false);
    setUsuario(null);
    localStorage.removeItem('usuario_sesion');
  };

  const rolActual = String(usuario?.rol || (usuario?.admin ? 'ADMIN' : 'USUARIO')).toUpperCase();
  const esKiosko = rolActual === 'KIOSKO';
  const esAdmin = rolActual === 'ADMIN' || Boolean(usuario?.admin);

  return (
    <AuthContext.Provider
      value={{
        usuario,
        isAuthenticated: Boolean(usuario),
        cargando,
        esKiosko,
        modoTablet,
        activarModoTablet,
        esAdmin,
        rol: rolActual,
        login,
        registro,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
