import { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  Tag,
  PieChart,
  Target,
  Settings,
  LogOut,
  Menu,
  X,
  TrendingUp,
  CreditCard,
  Shield,
  Building2,
  Users,
  Sun,
  Moon,
} from 'lucide-react';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();

  // Regular user navigation
  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Transactions', href: '/transactions', icon: Receipt },
    { name: 'Accounts', href: '/accounts', icon: Wallet },
    { name: 'Categories', href: '/categories', icon: Tag },
    { name: 'Budgets', href: '/budgets', icon: Target },
    { name: 'Allocations', href: '/allocations', icon: PieChart },
    { name: 'Reports', href: '/reports', icon: TrendingUp },
  ];

  // Admin navigation (only for regular admins, not super admins)
  const adminNavigation = user?.role === 'admin' ? [
    { name: 'Admin Panel', href: '/admin', icon: Shield },
  ] : [];

  // Super Admin navigation (completely different menu)
  const superAdminNavigation = user?.role === 'super_admin' ? [
    { name: 'Dashboard', href: '/super-admin', icon: Shield },
    { name: 'Households', href: '/super-admin/households', icon: Building2 },
    { name: 'Plans', href: '/super-admin/plans', icon: CreditCard },
    { name: 'Users', href: '/super-admin/users', icon: Users },
  ] : [];

  // Show super admin nav INSTEAD of regular nav if super admin
  const displayNavigation = user?.role === 'super_admin' ? superAdminNavigation : navigation;

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-2">
            <CreditCard className="w-8 h-8 text-blue-600 dark:text-blue-500" />
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">ExpenseTracker</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* User Info */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-400 font-semibold">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.household?.name}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {displayNavigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-150 ${
                isActive(item.href)
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          ))}

          {/* Admin Panel (only for regular admins) */}
          {adminNavigation.length > 0 && (
            <>
              <div className="px-3 py-2 mt-4">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider">
                  Admin
                </p>
              </div>
              {adminNavigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-150 ${
                    isActive(item.href)
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              ))}
            </>
          )}
        </nav>

        {/* Bottom actions */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-800 space-y-1">
          <Link
            to="/settings"
            className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-150 ${
              isActive('/settings')
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-sm font-medium">Settings</span>
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-150"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={`transition-all duration-200 ${
          sidebarOpen ? 'lg:pl-64' : 'pl-0'
        }`}
      >
        {/* Top Navbar */}
        <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 transition-colors duration-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>

              {/* Role Badge */}
              {user?.role === 'admin' && (
                <span className="px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-full">
                  Admin
                </span>
              )}
              {user?.role === 'super_admin' && (
                <span className="px-2.5 py-1 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 rounded-full">
                  Super Admin
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
