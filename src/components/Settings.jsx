import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { 
  Settings as SettingsIcon, ShieldAlert, KeyRound, Database, 
  Terminal, Check, AlertTriangle, RefreshCw 
} from 'lucide-react';

export default function Settings({ user }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Audits (Admin only)
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    try {
      await api.post('/settings/change-password', { currentPassword, newPassword });
      setSuccess('Your account password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchLogs = async () => {
    if (user.role !== 'Admin') return;
    setLogsLoading(true);
    try {
      const data = await api.get('/settings/logs');
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleBackupDownload = () => {
    // SQLite binary file download helper
    const url = api.getBackupUrl();
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-gray-100 tracking-tight">Console Settings</h2>
        <p className="text-xs text-brand-textMuted mt-0.5">Control login credentials, back up the system database, and trace audit logs</p>
      </div>

      {error && (
        <div className="bg-red-950/20 border border-red-900/50 p-4 rounded-xl flex items-center space-x-3 text-red-400 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-emerald-950/20 border border-emerald-900/50 p-4 rounded-xl flex items-center space-x-3 text-emerald-400 text-sm">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Change Password Block */}
        <div className="glass-panel rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider flex items-center space-x-2">
            <KeyRound className="w-4 h-4 text-blue-500" />
            <span>Update Account Password</span>
          </h3>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-semibold text-brand-textMuted uppercase block mb-1">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-brand-panelBg border border-brand-border text-gray-200 text-xs rounded-lg p-2.5 outline-none"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-semibold text-brand-textMuted uppercase block mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-brand-panelBg border border-brand-border text-gray-200 text-xs rounded-lg p-2.5 outline-none"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-semibold text-brand-textMuted uppercase block mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-brand-panelBg border border-brand-border text-gray-200 text-xs rounded-lg p-2.5 outline-none"
                required
              />
            </div>

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-semibold text-xs text-white">
              Save Password Changes
            </button>
          </form>
        </div>

        {/* Database & Backup Block (Admin Only) */}
        {user.role === 'Admin' && (
          <div className="glass-panel rounded-xl p-5 space-y-4 h-fit">
            <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider flex items-center space-x-2">
              <Database className="w-4 h-4 text-emerald-500" />
              <span>Database Dumps / Backup</span>
            </h3>
            
            <p className="text-xs text-brand-textMuted">
              Export and download the fully consolidated SQLite binary database file. 
              This download can be stored as a cold backup or uploaded directly to cloud servers for instant system restoration.
            </p>

            <button
              onClick={handleBackupDownload}
              className="w-full py-3 bg-brand-panelBg border border-brand-border hover:border-emerald-500 text-gray-200 hover:text-white rounded-xl font-semibold text-xs flex items-center justify-center space-x-1.5 transition-all"
            >
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Download SQLite DB Backup</span>
            </button>
          </div>
        )}

        {/* Audit Trails logs block (Admin Only) */}
        {user.role === 'Admin' && (
          <div className="lg:col-span-2 glass-panel rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-blue-500" />
                <span>Security Audit logs</span>
              </h3>
              <button 
                onClick={fetchLogs}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
              >
                Refresh logs
              </button>
            </div>

            {logsLoading ? (
              <div className="flex justify-center py-6">
                <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto max-h-64 overflow-y-auto pr-1">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="border-b border-brand-border text-brand-textMuted uppercase font-semibold">
                      <th className="py-2">Timestamp</th>
                      <th className="py-2">User</th>
                      <th className="py-2">Action</th>
                      <th className="py-2">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/40">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-brand-panelBg/20 text-gray-300">
                        <td className="py-2 font-mono text-brand-textMuted">{log.created_at}</td>
                        <td className="py-2 font-semibold">{log.username || 'System'}</td>
                        <td className="py-2 text-blue-400">{log.action}</td>
                        <td className="py-2 text-brand-textMuted max-w-xs truncate">{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
