import { Outlet } from 'react-router-dom';
import TopHeader from './TopHeader';
import LeftSidebar from './LeftSidebar';

interface DashboardLayoutProps {
  onLogout: () => void;
}

export default function DashboardLayout({ onLogout }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <TopHeader onLogout={onLogout} />
      <div className="flex">
        <LeftSidebar />
        <main className="flex-1 ml-64 mt-16 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
