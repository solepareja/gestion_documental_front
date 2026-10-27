import { Outlet } from 'react-router-dom';
import NavBar from '../components/NavBar';

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Menú Superior */}
      <NavBar />
      <main className="p-6">
        <Outlet /> 
      </main>
    </div>
  );
}