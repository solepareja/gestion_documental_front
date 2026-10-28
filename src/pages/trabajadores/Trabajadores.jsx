import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import Table from '../../components/Table';

export default function Trabajadores() {
  const [trabajadores, setTrabajadores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const cargarTrabajadores = async () => {
      try {
        const response = await api.get("/trabajadores");
        setTrabajadores(response.data || []);
      } catch (err) {
        console.error("Error al cargar los trabajadores", err);
        setError("Error al cargar los trabajadores");
      } finally {
        setCargando(false);
      }
    };
    cargarTrabajadores();
  }, []);

  const columns = [
    {
      header: 'Nombre',
      render: (persona) => (
        <Link
          to={"/trabajadores/" + persona.id}
          className="text-brand-600 hover:text-brand-800 hover:underline font-bold"
        >
          {persona.nombre}
        </Link>
      ),
    },
    { header: 'Apellidos', accessor: 'apellidos' },
    { header: 'DNI', accessor: 'dni' },
    {
      header: 'Teléfono',
      render: (p) => (
        <span className="text-sm font-medium text-gray-700">
          {p.telefono || '—'}
        </span>
      ),
    },
    { header: 'Correo', width: '250px', accessor: 'correo' },
    {
      header: 'EPIS / Material',
      render: (persona) => (
        <Link
          to={`/entregas/nueva?trabajadorId=${persona.id}`}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-200/60 transition-colors"
          title="Registrar entrega de EPIS o vestuario a este trabajador"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Nueva entrega</span>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Trabajadores
          </h1>
          <p className="text-sm font-medium text-gray-500 mt-1">
            Gestión de plantilla, datos de contacto y entrega de material laboral.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/entregas"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold text-xs sm:text-sm shadow-xs transition-colors"
          >
            <svg className="w-4 h-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Ver entregas de EPIS</span>
          </Link>

          <Button onClick={() => navigate('/trabajadores/nuevo')}>
            + Añadir trabajador
          </Button>
        </div>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <Table
        columns={columns}
        data={trabajadores}
        isLoading={cargando}
        emptyMessage="No hay trabajadores disponibles"
      />
    </div>
  );
}
