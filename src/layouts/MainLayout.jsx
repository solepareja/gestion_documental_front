import { Outlet } from 'react-router-dom';
import NavBar from '../components/NavBar';

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col print:bg-white print:min-h-0">
      {/* Menú Superior */}
      <NavBar />
      <main className="p-3 sm:p-6 max-w-7xl mx-auto w-full flex-1 print:p-0 print:m-0 print:max-w-none">
        <Outlet /> 
      </main>
    </div>
  );
}
