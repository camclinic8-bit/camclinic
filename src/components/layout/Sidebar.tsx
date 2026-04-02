'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Users2,
  Building2,
  BarChart3,
  LogOut,
  Menu,
  X,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/Button';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Jobs', href: '/jobs', icon: Briefcase },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Team', href: '/technicians', icon: Users2, roles: ['super_admin', 'service_manager', 'service_incharge'] },
  { name: 'Branches', href: '/branches', icon: Building2, roles: ['super_admin', 'service_manager', 'service_incharge'] },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { sidebarOpen, sidebarCollapsed, toggleSidebar, toggleSidebarCollapsed } =
    useUIStore();

  // While user profile loads, show all nav items (middleware already verified auth).
  // Once loaded, filter by role.
  const filteredNavigation = navigation.filter(item => {
    if (!item.roles) return true;
    if (!user) return true; // profile still loading — show all temporarily
    return item.roles.includes(user.role);
  });

  return (
    <>
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-md"
        onClick={toggleSidebar}
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-64 shrink-0 bg-white border-r border-gray-200
        transform transition-[transform,width] duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${sidebarCollapsed ? 'lg:w-[4.25rem] lg:min-w-[4.25rem]' : 'lg:w-64'}
      `}
      >
        <div className="flex flex-col h-full min-h-0">
          {/* Mobile / drawer: full title */}
          <div className="border-b p-4 lg:hidden">
            <h1 className="text-xl font-bold text-blue-600">CamClinic</h1>
            <p className="text-xs text-gray-500 mt-1">Camera Service Management</p>
          </div>

          {/* Desktop: expanded header + collapse control */}
          <div
            className={`border-b p-4 items-start justify-between gap-2 ${
              sidebarCollapsed ? 'hidden' : 'hidden lg:flex'
            }`}
          >
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-blue-600">CamClinic</h1>
              <p className="text-xs text-gray-500 mt-1">Camera Service Management</p>
            </div>
            <button
              type="button"
              onClick={toggleSidebarCollapsed}
              className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              aria-label="Minimize sidebar"
              title="Minimize sidebar"
            >
              <ChevronsLeft className="h-4 w-4" aria-hidden />
            </button>
          </div>

          {/* Desktop: collapsed — brand + expand */}
          <div
            className={`border-b items-center gap-3 py-4 px-2 ${
              sidebarCollapsed ? 'hidden lg:flex lg:flex-col' : 'hidden'
            }`}
          >
            <span className="text-xl font-bold text-blue-600" aria-hidden>
              C
            </span>
            <button
              type="button"
              onClick={toggleSidebarCollapsed}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              aria-label="Expand sidebar"
              title="Expand sidebar"
            >
              <ChevronsRight className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <nav
            className={`flex-1 overflow-y-auto space-y-1 p-4 ${sidebarCollapsed ? 'lg:p-2 lg:space-y-1' : ''}`}
          >
            {filteredNavigation.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={item.name}
                  className={`
                    flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors
                    ${sidebarCollapsed ? 'lg:justify-center lg:px-2 lg:py-2.5' : ''}
                    ${isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                  onClick={() => {
                    if (window.innerWidth < 1024) toggleSidebar();
                  }}
                >
                  <item.icon className="h-5 w-5 shrink-0" aria-hidden />
                  <span className={sidebarCollapsed ? 'lg:sr-only' : ''}>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className={`border-t p-4 ${sidebarCollapsed ? 'lg:p-2' : ''}`}>
            <div className={`mb-3 ${sidebarCollapsed ? 'lg:hidden' : ''}`}>
              {user ? (
                <>
                  <p className="text-sm font-medium text-gray-900 truncate">{user.full_name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user.role.replace(/_/g, ' ')}</p>
                </>
              ) : (
                <>
                  <div className="h-4 w-28 bg-gray-200 rounded animate-pulse mb-1" />
                  <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                </>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              className={`w-full justify-start ${sidebarCollapsed ? 'lg:justify-center lg:px-0' : ''}`}
              onClick={signOut}
              title="Sign out"
            >
              <LogOut className={`h-4 w-4 shrink-0 ${sidebarCollapsed ? '' : 'mr-2'}`} />
              <span className={sidebarCollapsed ? 'lg:sr-only' : ''}>Sign Out</span>
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
