import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Sparkles, Shield, UserCheck, ArrowRight, Lock, Mail } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e?.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(email, password);
    setIsLoading(false);

    if (result.success) {
      // Redirect based on role
      const role = result.user.role;
      if (role === 'MANAGER') navigate('/dashboard');
      else if (role === 'FRONT_DESK') navigate('/front-desk');
      else if (role === 'DEPARTMENT_HEAD') navigate('/department');
      else if (role === 'STAFF') navigate('/staff');
      else navigate('/dashboard');
    } else {
      setError(result.error);
    }
  };

  const handleQuickLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    login(demoEmail, demoPassword).then((result) => {
      if (result.success) {
        const role = result.user.role;
        if (role === 'MANAGER') navigate('/dashboard');
        else if (role === 'FRONT_DESK') navigate('/front-desk');
        else if (role === 'DEPARTMENT_HEAD') navigate('/department');
        else if (role === 'STAFF') navigate('/staff');
      }
    });
  };

  const demoAccounts = [
    {
      role: 'General Manager',
      email: 'manager@resort360.com',
      password: 'password123',
      desc: 'Full operations oversight, AI recommendation approvals, and closed-loop execution',
      badge: 'MANAGER'
    },
    {
      role: 'Front Desk Lead',
      email: 'frontdesk@resort360.com',
      password: 'password123',
      desc: 'Arrivals, departures, early-checkin flags & room readiness',
      badge: 'FRONT_DESK'
    },
    {
      role: 'Housekeeping Lead',
      email: 'housekeeping.head@resort360.com',
      password: 'password123',
      desc: 'Department workload, shift balancing, task delegation',
      badge: 'DEPT_HEAD'
    },
    {
      role: 'Operations Staff',
      email: 'staff.elena@resort360.com',
      password: 'password123',
      desc: 'Task execution, progress tracking, shift completion',
      badge: 'STAFF'
    }
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left Side: Brand & Quick Demo Switcher */}
        <div className="space-y-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Operations Co-Pilot</span>
            </div>
            <h1 className="text-3xl font-extrabold text-charcoal-900 tracking-tight">
              Smart Resort <span className="text-forest-900">360</span>
            </h1>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Predictive operations management and closed-loop decision orchestration for luxury resorts.
            </p>
          </div>

          {/* Quick Demo Access Roles */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-sky-400" />
                1-Click Demo Login
              </span>
              <span className="text-[10px] text-slate-500">Pick any role to evaluate</span>
            </div>

            <div className="space-y-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  onClick={() => handleQuickLogin(acc.email, acc.password)}
                  className="w-full text-left p-3 rounded-lg bg-slate-800/80 hover:bg-slate-750 border border-slate-700/70 hover:border-sky-500/50 transition-all flex items-center justify-between group"
                >
                  <div className="pr-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white group-hover:text-sky-300">
                        {acc.role}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-slate-900 text-slate-400 rounded font-mono">
                        {acc.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{acc.desc}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Traditional Login Form */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-8 shadow-2xl backdrop-blur">
          <h2 className="text-xl font-bold text-white mb-1">Sign In to Dashboard</h2>
          <p className="text-xs text-slate-400 mb-6">Enter your internal resort credentials</p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="manager@resort360.com"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full mt-2"
            >
              <Shield className="w-4 h-4" />
              <span>{isLoading ? 'Authenticating...' : 'Sign In'}</span>
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-700/60 text-center">
            <p className="text-xs text-slate-400">
              Evaluating as Guest?{' '}
              <a href="/guest-request" className="text-sky-400 hover:underline font-medium">
                Submit QR Guest Request →
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
