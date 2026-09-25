import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Calendar,
  Package,
  History,
  QrCode,
  LogOut,
  Sparkles,
  Building2,
  Users,
  CheckSquare,
  RotateCcw,
  Menu,
  X
} from 'lucide-react';
import { demoAPI } from '../services/api';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleResetDemo = async () => {
    if (window.confirm('Reset demo database to fresh realistic operational data?')) {
      setIsResetting(true);
      try {
        await demoAPI.reset();
        alert('Database reset successfully! Reloading...');
        window.location.reload();
      } catch (err) {
        alert('Failed to reset demo: ' + (err.response?.data?.detail || err.message));
      } finally {
        setIsResetting(false);
      }
    }
  };

  // Determine navigation items based on user role
  const getNavLinks = () => {
    const links = [];

    if (!user) {
      return [{ name: 'Guest Request', path: '/guest-request', icon: QrCode }];
    }

    // Role-specific main dashboard
    if (user.role === 'MANAGER') {
      links.push({ name: 'Manager HQ', path: '/dashboard', icon: LayoutDashboard });
      links.push({ name: '7-Day Forecast', path: '/forecast', icon: Calendar });
      links.push({ name: 'Inventory & POs', path: '/inventory', icon: Package });
      links.push({ name: 'Front Desk', path: '/front-desk', icon: Building2 });
      links.push({ name: 'Activity Log', path: '/activity-log', icon: History });
    } else if (user.role === 'FRONT_DESK') {
      links.push({ name: 'Front Desk', path: '/front-desk', icon: Building2 });
      links.push({ name: 'Guest Requests', path: '/guest-request', icon: QrCode });
    } else if (user.role === 'DEPARTMENT_HEAD') {
      links.push({ name: 'Department Ops', path: '/department', icon: Users });
      links.push({ name: 'Forecast', path: '/forecast', icon: Calendar });
    } else if (user.role === 'STAFF') {
      links.push({ name: 'My Tasks', path: '/staff', icon: CheckSquare });
    }

    return links;
  };

  const navLinks = getNavLinks();

  return (
    <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 backdrop-blur bg-slate-900/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold bg-gradient-to-r from-sky-400 via-indigo-300 to-white bg-clip-text text-transparent">
                  Resort 360
                </span>
                <span className="hidden sm:inline-block ml-2 px-1.5 py-0.5 text-[10px] font-semibold bg-sky-500/20 text-sky-300 rounded border border-sky-500/30">
                  AI Co-Pilot
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Side - User Info & Actions */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <>
                {user.role === 'MANAGER' && (
                  <button
                    onClick={handleResetDemo}
                    disabled={isResetting}
                    className="flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded transition"
                    title="Reset database to fresh demo operational dataset"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                    <span>Reset Demo</span>
                  </button>
                )}

                <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-sky-400">
                    {user.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div className="text-left text-xs">
                    <p className="font-semibold text-slate-200">{user.name}</p>
                    <p className="text-slate-400 text-[10px] uppercase font-mono">{user.role.replace('_', ' ')}</p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-sm transition"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium ${
                  isActive ? 'bg-sky-500/10 text-sky-400' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.name}</span>
              </Link>
            );
          })}
          {user && (
            <div className="pt-4 mt-2 border-t border-slate-800 flex justify-between items-center">
              <div className="text-xs text-slate-300">
                <p className="font-semibold">{user.name}</p>
                <p className="text-slate-500">{user.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-xs text-red-400 bg-red-500/10 rounded border border-red-500/30"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
