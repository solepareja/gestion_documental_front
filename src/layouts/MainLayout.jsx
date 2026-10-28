import { Outlet } from 'react-router-dom';
import NavBar from '../components/NavBar';

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Menú Superior */}
      <NavBar />
      <main className="p-3 sm:p-6 max-w-7xl mx-auto w-full flex-1">
        <Outlet /> 
      </main>
    </div>
  );
}
