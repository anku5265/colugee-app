import { Users, GraduationCap, Calendar, FileText, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const stats = [
    { label: 'Total Students', value: '1,234', trend: '+12%', icon: Users, color: 'blue' },
    { label: 'Total Faculty', value: '89', trend: '+5%', icon: GraduationCap, color: 'green' },
    { label: 'Active Events', value: '15', trend: '+3', icon: Calendar, color: 'purple' },
    { label: 'Total Audits', value: '456', trend: '+23%', icon: FileText, color: 'orange' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to Colugee Admin Panel</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 bg-${stat.color}-100 rounded-lg`}>
                  <Icon className={`h-6 w-6 text-${stat.color}-600`} />
                </div>
                <div className="flex items-center text-green-600 text-sm font-medium">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  {stat.trend}
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
              <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Recent Activities</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm">New student enrolled</span>
              <span className="text-xs text-gray-500">2 hours ago</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm">Fee payment received</span>
              <span className="text-xs text-gray-500">5 hours ago</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm">Attendance marked</span>
              <span className="text-xs text-gray-500">1 day ago</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <button className="w-full text-left px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
              Add New Student
            </button>
            <button className="w-full text-left px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100">
              Mark Attendance
            </button>
            <button className="w-full text-left px-4 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100">
              Generate Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
