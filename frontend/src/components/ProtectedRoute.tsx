import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SideNavBar from './SideNavBar';
import TopAppBar from './TopAppBar';

export default function ProtectedRoute() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-background flex">
      <SideNavBar />
      <div className="flex-1 flex flex-col ml-64 min-h-screen">
        <TopAppBar />
        <main className="mt-16 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
