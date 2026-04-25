import { Bell, Search, User, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { UserRole } from '../../App';

interface TopHeaderProps {
  onLogout: () => void;
  userRole: UserRole;
}

export default function TopHeader({ onLogout, userRole }: TopHeaderProps) {
  const [adminName, setAdminName] = useState('Admin');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .single()
          .then(({ data }) => {
            if (data?.full_name) setAdminName(data.full_name);
          });
      }
    });
  }, []);

  const headerColor = userRole === 'super_admin' ? 'text-purple-600' : 'text-blue-600';

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50">
      <div className="h-full px-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h1 className={`text-xl font-bold ${headerColor}`}>Colugee Admin</h1>
          {userRole === 'super_admin' && (
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">Platform</span>
          )}
        </div>

        <div className="flex-1 max-w-2xl mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder={userRole === 'super_admin' ? 'Search tenants...' : 'Search students, faculty, batches...'}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
          </button>

          <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${userRole === 'super_admin' ? 'bg-purple-600' : 'bg-blue-600'}`}>
              <User className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700">{adminName}</span>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
