import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, CheckSquare, DollarSign, FileText, Settings, Building2 } from 'lucide-react';
import { UserRole } from '../../App';

interface LeftSidebarProps {
  userRole: UserRole;
}

const superAdminNav = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/tenants', label: 'Tenant Management', icon: Building2 },
];

const instituteAdminNav = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/users', label: 'Users', icon: Users },
  { path: '/academics', label: 'Academics', icon: BookOpen },
  { path: '/attendance', label: 'Attendance', icon: CheckSquare },
  { path: '/fees', label: 'Fees', icon: DollarSign },
  { path: '/reports', label: 'Reports', icon: FileText },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function LeftSidebar({ userRole }: LeftSidebarProps) {
  const navItems = userRole === 'super_admin' ? superAdminNav : instituteAdminNav;

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200">
      {/* Role badge */}
      <div className="px-4 py-3 border-b border-gray-100">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
          userRole === 'super_admin'
            ? 'bg-purple-100 text-purple-700'
            : userRole === 'institute_admin'
            ? 'bg-blue-100 text-blue-700'
            : 'bg-green-100 text-green-700'
        }`}>
          {userRole === 'super_admin' ? '⚡ Super Admin' : userRole === 'institute_admin' ? '🏫 Institute Admin' : '🛡️ Authority'}
        </span>
      </div>

      <nav className="p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? userRole === 'super_admin'
                      ? 'bg-purple-50 text-purple-600 font-medium'
                      : 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
