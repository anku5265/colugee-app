import { Outlet } from 'react-router-dom';
import TopHeader from './TopHeader';
import LeftSidebar from './LeftSidebar';

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <TopHeader />
      <div className="flex">
        <LeftSidebar />
        <main className="flex-1 ml-64 mt-16 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
