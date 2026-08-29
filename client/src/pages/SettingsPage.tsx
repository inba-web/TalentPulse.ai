import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { UserPlus, Shield, Mail, User, Key, Loader2, RefreshCw, Settings } from 'lucide-react';

export default function SettingsPage() {
  const { user: currentUser, updateProfile, changePassword } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Profile Update State
  const [profileName, setProfileName] = useState(currentUser?.fullName || '');
  const [profileEmail, setProfileEmail] = useState(currentUser?.email || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    setPasswordLoading(true);
    setPasswordMessage(null);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordMessage({ type: 'success', text: 'Your password has been changed successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMessage({ type: 'error', text: err.message || 'Password change failed' });
    } finally {
      setPasswordLoading(false);
    }
  };

  // Form State for User Creation
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [roleName, setRoleName] = useState('RECRUITER');
  const [formLoading, setFormLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchUsers = async (isRefresh = false) => {
    if (currentUser?.roleName !== 'ADMIN') return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const response = await fetch('/api/auth/users');
      const result = await response.json();
      if (result.success) {
        setUsers(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.fullName);
      setProfileEmail(currentUser.email);
    }
    fetchUsers();
  }, [currentUser]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage(null);
    try {
      await updateProfile(profileName, profileEmail);
      setProfileMessage({ type: 'success', text: 'Your profile details updated successfully.' });
    } catch (err: any) {
      setProfileMessage({ type: 'error', text: err.message || 'Profile update failed' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/auth/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, roleName }),
      });

      const result = await response.json();
      if (result.success) {
        setMessage({ type: 'success', text: `User "${fullName}" successfully created.` });
        setEmail('');
        setFullName('');
        setPassword('');
        setRoleName('RECRUITER');
        fetchUsers();
      } else {
        throw new Error(result.error?.message || 'Failed to create user account');
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Creation failed' });
    } finally {
      setFormLoading(false);
    }
  };

  const isAdmin = currentUser?.roleName === 'ADMIN';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-extrabold text-text-primary tracking-tight">Settings</h1>
          <p className="text-xs text-text-muted mt-1">Manage system user credentials, roles, and administrative governance.</p>
        </div>
        <button
          onClick={() => {
            fetchUsers(true);
            if (currentUser) {
              setProfileName(currentUser.fullName);
              setProfileEmail(currentUser.email);
            }
          }}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-2 border border-border-primary hover:border-border-hover text-text-primary text-xs font-semibold rounded bg-surface-1 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="space-y-6">
        {/* Profile Settings Cards (Name & Password Side-by-Side) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Details */}
          <div className="bg-surface-1 p-6 rounded border border-border-primary space-y-4">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <Settings className="w-4 h-4 text-primary" />
              <span>My Profile Settings</span>
            </h3>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              {profileMessage && (
                <div className={`p-3 rounded border text-xs ${
                  profileMessage.type === 'success' 
                    ? 'bg-success/10 border-success/20 text-success' 
                    : 'bg-error/10 border-error/20 text-error'
                }`}>
                  {profileMessage.text}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
                  <User className="w-3.5 h-3.5" /> Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  className="w-full h-10 px-3 border border-border-primary rounded text-xs outline-none bg-background-secondary text-text-primary focus:border-primary transition"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" /> Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. john@talentpulse.ai"
                  className="w-full h-10 px-3 border border-border-primary rounded text-xs outline-none bg-background-secondary text-text-primary focus:border-primary transition"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                />
              </div>

              <div className="flex justify-start pt-2">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="h-10 px-6 bg-gradient-primary hover:brightness-110 disabled:opacity-50 text-white font-bold text-xs rounded transition flex items-center justify-center gap-2 glow-primary border-0 cursor-pointer"
                >
                  {profileLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Update Profile Details</span>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Card 2: Password */}
          <div className="bg-surface-1 p-6 rounded border border-border-primary space-y-4">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <Key className="w-4 h-4 text-primary" />
              <span>Change Security Password</span>
            </h3>

            <form onSubmit={handleChangePassword} className="space-y-4">
              {passwordMessage && (
                <div className={`p-3 rounded border text-xs ${
                  passwordMessage.type === 'success' 
                    ? 'bg-success/10 border-success/20 text-success' 
                    : 'bg-error/10 border-error/20 text-error'
                }`}>
                  {passwordMessage.text}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
                  <Key className="w-3.5 h-3.5" /> Current Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter current password..."
                  className="w-full h-10 px-3 border border-border-primary rounded text-xs outline-none bg-background-secondary text-text-primary focus:border-primary transition"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
                    <Key className="w-3.5 h-3.5" /> New Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Min 8 chars..."
                    className="w-full h-10 px-3 border border-border-primary rounded text-xs outline-none bg-background-secondary text-text-primary focus:border-primary transition"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
                    <Key className="w-3.5 h-3.5" /> Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Repeat password..."
                    className="w-full h-10 px-3 border border-border-primary rounded text-xs outline-none bg-background-secondary text-text-primary focus:border-primary transition"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-start">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="h-10 px-6 bg-gradient-primary hover:brightness-110 disabled:opacity-50 text-white font-bold text-xs rounded transition flex items-center justify-center gap-2 glow-primary border-0 cursor-pointer"
                >
                  {passwordLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Update Security Password</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Administrative Sections (Admins Only) */}
        {isAdmin && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 border-t border-border-primary">
            {/* Left Column: Create User Form */}
            <div className="bg-surface-1 p-6 rounded border border-border-primary space-y-4">
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-primary" />
                <span>Create Administrative User</span>
              </h3>

              <form onSubmit={handleCreateUser} className="space-y-4">
                {message && (
                  <div className={`p-3 rounded border text-xs ${
                    message.type === 'success' 
                      ? 'bg-success/10 border-success/20 text-success' 
                      : 'bg-error/10 border-error/20 text-error'
                  }`}>
                    {message.text}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
                    <User className="w-3.5 h-3.5" /> Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    className="w-full h-10 px-3 border border-border-primary rounded text-xs outline-none bg-background-secondary text-text-primary focus:border-primary transition"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" /> Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. john@talentpulse.ai"
                    className="w-full h-10 px-3 border border-border-primary rounded text-xs outline-none bg-background-secondary text-text-primary focus:border-primary transition"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
                    <Key className="w-3.5 h-3.5" /> Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Minimum 8 chars with uppercase, digit, symbol"
                    className="w-full h-10 px-3 border border-border-primary rounded text-xs outline-none bg-background-secondary text-text-primary focus:border-primary transition"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5" /> Assign Role Name
                  </label>
                  <select
                    className="w-full h-10 px-3 border border-border-primary rounded text-xs bg-background-secondary text-text-primary focus:border-primary outline-none transition"
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                  >
                    <option value="ADMIN">ADMIN (Full Governance)</option>
                    <option value="MANAGER">MANAGER (Academic & Candidates)</option>
                    <option value="LEAD">LEAD (Companies & Job Postings)</option>
                    <option value="RECRUITER">RECRUITER (Screening & ATS Evaluations)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-full h-10 bg-gradient-primary hover:brightness-110 disabled:opacity-50 text-white font-bold text-xs rounded transition flex items-center justify-center gap-2 glow-primary border-0 cursor-pointer"
                >
                  {formLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Provision User Account</span>
                  )}
                </button>
              </form>
            </div>

            {/* Right Columns: Users Catalog */}
            <div className="lg:col-span-2 bg-surface-1 p-6 rounded border border-border-primary space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">System Users Directory</h3>
                <button
                  onClick={() => fetchUsers(true)}
                  disabled={refreshing}
                  className="p-1.5 border border-border-primary hover:border-border-hover rounded text-text-secondary hover:text-text-primary transition cursor-pointer bg-transparent"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {loading ? (
                <div className="text-center py-20 text-text-secondary">
                  <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                  <span>Fetching user records...</span>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-20 text-text-secondary">
                  No registered user records found.
                </div>
              ) : (
                <div className="border border-border-primary rounded overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-background-tertiary border-b border-border-primary text-[11px] font-bold text-text-muted uppercase tracking-wider">
                          <th className="px-6 py-4">Full Name</th>
                          <th className="px-6 py-4">Email</th>
                          <th className="px-6 py-4">System Role</th>
                          <th className="px-6 py-4 text-right">Created Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-primary text-xs text-text-secondary">
                        {users.map((u) => (
                          <tr key={u.id} className="hover:bg-surface-2 transition duration-150">
                            <td className="px-6 py-4 font-bold text-text-primary">{u.fullName}</td>
                            <td className="px-6 py-4 font-mono">{u.email}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                                u.roleName === 'ADMIN' 
                                  ? 'bg-success/10 border-success/20 text-success'
                                  : u.roleName === 'LEAD'
                                  ? 'bg-primary/10 border-primary/20 text-primary'
                                  : 'bg-warning/10 border-warning/20 text-warning'
                              }`}>
                                {u.roleName}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right text-text-muted">
                              {new Date(u.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
