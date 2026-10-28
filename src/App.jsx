import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import Login from './pages/auth/Login';
import Registro from './pages/auth/Registro';
import Dashboard from './pages/dashboard/Dashboard';
import Vehiculos from './pages/vehiculos/Vehiculos';
import Conductores from './pages/conductores/Conductores';
import VehiculoDetalle from './pages/vehiculos/VehiculoDetalle';
import Usuarios from './pages/usuarios/Usuarios';
import Trabajadores from './pages/trabajadores/Trabajadores';
import FormVehiculo from './pages/vehiculos/FormVehiculo';
import FormTrabajador from './pages/trabajadores/FormTrabajador';
import FormConductor from './pages/conductores/FormConductor';
import PersonaDetalle from './pages/PersonaDetalle';
import FormUsuario from './pages/usuarios/FormUsuario';
import Documentos from './pages/documentos/Documentos';
import FormDocumento from './pages/documentos/FormDocumento';
import HistorialDocumentoVehiculo from './pages/documentos/HistorialDocumentoVehiculo';
import Materiales from './pages/materiales/Materiales';
import FormMaterial from './pages/materiales/FormMaterial';
import Entregas from './pages/entregas/Entregas';
import FormEntrega from './pages/entregas/FormEntrega';
import EntregaDetalle from './pages/entregas/EntregaDetalle';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas públicas de autenticación */}
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />

          {/* Rutas protegidas (requieren haber iniciado sesión) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/usuarios" element={<Usuarios />} />
              <Route path="/usuarios/nuevo" element={<FormUsuario />} />
              <Route path="/usuarios/:id/editar" element={<FormUsuario key="editar-usuario" />} />
              <Route path="/documentos" element={<Documentos />} />
              <Route path="/documentos/nuevo" element={<FormDocumento />} />
              <Route path="/documentos/:id/editar" element={<FormDocumento key="editar-documento" />} />
              <Route path="/vehiculos" element={<Vehiculos />} />
              <Route path="/vehiculos/:id" element={<VehiculoDetalle />} />
              <Route path="/vehiculos/:vehiculoId/documentos/:tipo" element={<HistorialDocumentoVehiculo />} />
              <Route path="/conductores" element={<Conductores />} />
              <Route path="/trabajadores" element={<Trabajadores />} />
              <Route path="/vehiculos/nuevo" element={<FormVehiculo />} />
              <Route path="/conductores/nuevo" element={<FormConductor />} />
              <Route path="/trabajadores/nuevo" element={<FormTrabajador />} />
              <Route path="/vehiculos/:id/editar" element={<FormVehiculo key="editar-vehiculo" />} />
              <Route path="/conductores/:id" element={<PersonaDetalle tipo="conductores" />} />
              <Route path="/conductores/:id/editar" element={<FormConductor key="editar-conductor" />} />
              <Route path="/trabajadores/:id" element={<PersonaDetalle tipo="trabajadores" />} />
              <Route path="/trabajadores/:id/editar" element={<FormTrabajador key="editar-trabajador" />} />
              
              {/* Rutas del módulo de Materiales (EPIS / Vestuario) */}
              <Route path="/materiales" element={<Materiales />} />
              <Route path="/materiales/nuevo" element={<FormMaterial />} />
              <Route path="/materiales/:id/editar" element={<FormMaterial key="editar-material" />} />

              {/* Rutas del módulo de Entregas de EPIS / Vestuario */}
              <Route path="/entregas" element={<Entregas />} />
              <Route path="/entregas/nueva" element={<FormEntrega />} />
              <Route path="/entregas/:id" element={<EntregaDetalle />} />
            </Route>

            {/* Acceso directo para firmas en tablet */}
            <Route path="/firmas" element={<Navigate to="/entregas/nueva" replace />} />
          </Route>

          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
