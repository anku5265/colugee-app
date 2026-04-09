import { Home, Rss, UserPlus, LayoutDashboard, User } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'feed', label: 'Feed', icon: Rss },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'connect', label: 'Connect', icon: UserPlus },
  { id: 'profile', label: 'Profile', icon: User },
];

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 z-20">
      <div className="flex">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors ${
                isActive ? 'text-indigo-600' : 'text-gray-400'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] font-medium">{tab.label}</span>
              {isActive && <div className="w-1 h-1 bg-indigo-600 rounded-full" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
