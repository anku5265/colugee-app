import { Outlet } from 'react-router-dom';
import TopHeader from './TopHeader';
import LeftSidebar from './LeftSidebar';
import { UserRole } from '../../App';

interface DashboardLayoutProps {
  onLogout: () => void;
  userRole: UserRole;
}

export default function DashboardLayout({ onLogout, userRole }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <TopHeader onLogout={onLogout} userRole={userRole} />
      <div className="flex">
        <LeftSidebar userRole={userRole} />
        <main className="flex-1 ml-64 mt-16 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
