import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<div>Pantalla del Panel de Control</div>} />
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/usuarios/nuevo" element={<FormUsuario />} />
          <Route path="/usuarios/:id/editar" element={<FormUsuario key="editar-usuario" />} />
          <Route path="/vehiculos" element={<Vehiculos />} />
          <Route path="/vehiculos/:id" element={<VehiculoDetalle />} />
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
        </Route>
        
        <Route path="/firmas" element={<div>Formulario de tablet sin menú</div>} />
      </Routes>
    </BrowserRouter>
  );
}
