import React, { useState } from 'react';
import { api } from '../api';
import { KeyRound, User, AlertTriangle, ShieldAlert, Lock } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot password
  const [showForgot, setShowForgot] = useState(false);
  const [forgotUser, setForgotUser] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.post('/auth/login', { username, password });
      
      // Store JWT & metadata locally
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      onLoginSuccess(data.user);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setForgotSuccess('');
    setLoading(true);

    try {
      const res = await api.post('/auth/forgot-password', { username: forgotUser, email: forgotEmail });
      setForgotSuccess(res.message);
      setForgotUser('');
      setForgotEmail('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-darkBg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Visual background glow elements */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-blue-600/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-indigo-600/10 blur-[100px] pointer-events-none" />

      {/* Main glass card */}
      <div className="w-full max-w-md glass-panel rounded-2xl p-8 space-y-6 shadow-2xl relative z-10">
        
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white tracking-widest text-xl shadow-lg shadow-blue-500/20 mx-auto">
            LQ
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-100 tracking-tight uppercase glow-accent">KANPUR LIQUOR ERP</h2>
            <p className="text-xs text-brand-textMuted font-medium uppercase tracking-wider">Business Intelligence Suite</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-950/20 border border-red-900/50 p-3 rounded-lg flex items-center space-x-2 text-red-400 text-xs">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {forgotSuccess && (
          <div className="bg-emerald-950/20 border border-emerald-900/50 p-3 rounded-lg text-emerald-400 text-xs">
            {forgotSuccess}
          </div>
        )}

        {!showForgot ? (
          /* LOGIN FORM */
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-semibold text-brand-textMuted uppercase block mb-1">Username / Login ID</label>
              <div className="relative">
                <User className="absolute top-3 left-3 w-4 h-4 text-brand-textMuted" />
                <input
                  type="text"
                  placeholder="admin, manager_downtown, staff_downtown"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-brand-panelBg border border-brand-border text-gray-200 placeholder-gray-600 text-xs rounded-lg pl-9 pr-4 py-2.5 outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-semibold text-brand-textMuted uppercase">Password</label>
                <button
                  type="button"
                  onClick={() => { setShowForgot(true); setError(''); setForgotSuccess(''); }}
                  className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute top-3 left-3 w-4 h-4 text-brand-textMuted" />
                <input
                  type="password"
                  placeholder="admin123, manager123, staff123"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-brand-panelBg border border-brand-border text-gray-200 placeholder-gray-600 text-xs rounded-lg pl-9 pr-4 py-2.5 outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white rounded-xl font-semibold text-xs tracking-wider uppercase shadow-lg shadow-blue-500/10 transition"
            >
              {loading ? 'Verifying Credentials...' : 'Authenticate Account'}
            </button>
          </form>
        ) : (
          /* FORGOT PASSWORD FORM */
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider text-center">Reset Account Password</h3>
            
            <div>
              <label className="text-[10px] font-semibold text-brand-textMuted uppercase block mb-1">Confirm Username</label>
              <input
                type="text"
                placeholder="Enter login username"
                value={forgotUser}
                onChange={(e) => setForgotUser(e.target.value)}
                className="w-full bg-brand-panelBg border border-brand-border text-gray-200 placeholder-gray-600 text-xs rounded-lg px-3 py-2.5 outline-none focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-semibold text-brand-textMuted uppercase block mb-1">Registered Email Address</label>
              <input
                type="email"
                placeholder="Enter email address"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="w-full bg-brand-panelBg border border-brand-border text-gray-200 placeholder-gray-600 text-xs rounded-lg px-3 py-2.5 outline-none focus:border-blue-500"
                required
              />
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => { setShowForgot(false); setError(''); setForgotSuccess(''); }}
                className="w-1/2 py-2.5 bg-brand-panelBg border border-brand-border hover:bg-brand-panelBg/80 text-gray-300 rounded-lg text-xs font-medium"
              >
                Back to Sign In
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
              >
                {loading ? 'Reseting...' : 'Reset Password'}
              </button>
            </div>
          </form>
        )}

        <div className="text-center text-[10px] text-brand-textMuted pt-4 border-t border-brand-border/40">
         Kanpur Liquor ERP Suite • Version 1.0.0 (Secure)
        </div>
      </div>
    </div>
  );
}
