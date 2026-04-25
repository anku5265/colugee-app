import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Search, Loader2, User, GraduationCap, Shield, BookOpen,
  Plus, Pencil, Trash2, KeyRound, X, Eye, EyeOff, AlertTriangle
} from 'lucide-react';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  department: string;
  institution_roll_number: string;
  year_of_study: number | null;
  section: string | null;
  branch: string | null;
  subject_specialization: string | null;
  created_at: string;
  institution_id: string;
}

interface CreateUserForm {
  email: string;
  password: string;
  full_name: string;
  role: 'student' | 'teacher' | 'authority';
  department: string;
  institution_roll_number: string;
  // student fields
  year_of_study: string;
  section: string;
  branch: string;
  // teacher fields
  subject_specialization: string;
}

const EMPTY_FORM: CreateUserForm = {
  email: '', password: '', full_name: '', role: 'student',
  department: '', institution_roll_number: '',
  year_of_study: '', section: '', branch: '', subject_specialization: '',
};

const roleIcons: Record<string, any> = {
  student: GraduationCap, teacher: BookOpen, authority: Shield,
};
const roleColors: Record<string, string> = {
  student: 'bg-blue-100 text-blue-700',
  teacher: 'bg-green-100 text-green-700',
  authority: 'bg-purple-100 text-purple-700',
};

export default function UsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [institutionId, setInstitutionId] = useState<string | null>(null);

  // Modal states
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<Profile | null>(null);
  const [deleteUser, setDeleteUser] = useState<Profile | null>(null);
  const [resetUser, setResetUser] = useState<Profile | null>(null);

  const [form, setForm] = useState<CreateUserForm>(EMPTY_FORM);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInstitutionId();
  }, []);

  const fetchInstitutionId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('profiles').select('institution_id').eq('user_id', user.id).single();
    if (data) {
      setInstitutionId(data.institution_id);
      fetchUsers(data.institution_id);
    }
  };

  const fetchUsers = async (instId?: string) => {
    const id = instId || institutionId;
    if (!id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, email, role, department, institution_roll_number, year_of_study, section, branch, subject_specialization, created_at, institution_id')
        .eq('institution_id', id)
        .in('role', ['student', 'teacher', 'authority'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      setUsers(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch = u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.institution_roll_number?.toLowerCase().includes(q);
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  // ── CREATE USER ──────────────────────────────────────────────
  const handleCreate = async () => {
    setError('');
    if (!form.email || !form.password || !form.full_name || !form.role || !form.department) {
      setError('Email, password, full name, role, and department are required.');
      return;
    }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (form.role === 'student' && !form.year_of_study) { setError('Year of study is required for students.'); return; }
    if (form.role === 'teacher' && !form.subject_specialization) { setError('Subject specialization is required for teachers.'); return; }
    if (!institutionId) { setError('Institution not found.'); return; }

    setSaving(true);
    try {
      // Check duplicate email in profiles
      const { data: existing } = await supabase.from('profiles').select('id').eq('email', form.email).maybeSingle();
      if (existing) { setError('A user with this email already exists.'); return; }

      // Step 1: Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.full_name,
            institution_id: institutionId,
            institution_roll_number: form.institution_roll_number || null,
            role: form.role,
            department: form.department,
            year_of_study: form.role === 'student' && form.year_of_study ? parseInt(form.year_of_study) : null,
            section: form.role === 'student' ? form.section || null : null,
            branch: form.role === 'student' ? form.branch || null : null,
          },
        },
      });

      if (authError) { setError(authError.message); return; }

      // authData.user can be non-null even if email not confirmed
      const userId = authData.user?.id;
      if (!userId) { setError('User creation failed. This email may already be registered.'); return; }

      // Step 2: Upsert profile — DB trigger may have already created it
      const profilePayload: Record<string, any> = {
        user_id: userId,
        email: form.email,
        full_name: form.full_name,
        role: form.role,
        department: form.department,
        institution_id: institutionId,
        institution_roll_number: form.institution_roll_number || null,
        year_of_study: form.role === 'student' && form.year_of_study ? parseInt(form.year_of_study) : null,
        section: form.role === 'student' ? form.section || null : null,
        branch: form.role === 'student' ? form.branch || null : null,
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(profilePayload, { onConflict: 'user_id' });

      if (profileError) {
        setError(`User auth created but profile save failed: ${profileError.message}`);
        return;
      }

      setShowCreate(false);
      setForm(EMPTY_FORM);
      setShowPassword(false);
      fetchUsers();
    } catch (e: any) {
      setError(e.message || 'Failed to create user.');
    } finally {
      setSaving(false);
    }
  };

  // ── EDIT USER ────────────────────────────────────────────────
  const handleEdit = async () => {
    if (!editUser) return;
    setError('');
    if (!editUser.full_name || !editUser.department) { setError('Full name and department are required.'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({
        full_name: editUser.full_name,
        department: editUser.department,
        role: editUser.role,
      }).eq('id', editUser.id);
      if (error) throw error;
      setEditUser(null);
      fetchUsers();
    } catch (e: any) {
      setError(e.message || 'Failed to update user.');
    } finally {
      setSaving(false);
    }
  };

  // ── DELETE USER ──────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteUser) return;
    setSaving(true);
    try {
      await supabase.from('profiles').delete().eq('id', deleteUser.id);
      setDeleteUser(null);
      fetchUsers();
    } catch (e: any) {
      setError(e.message || 'Failed to delete user.');
    } finally {
      setSaving(false);
    }
  };

  // ── RESET PASSWORD ───────────────────────────────────────────
  const handleResetPassword = async () => {
    if (!resetUser || !newPassword) return;
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setSaving(true);
    setError('');
    try {
      // Send password reset email (admin cannot directly set password without service role)
      const { error } = await supabase.auth.resetPasswordForEmail(resetUser.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      alert(`Password reset email sent to ${resetUser.email}`);
      setResetUser(null);
      setNewPassword('');
    } catch (e: any) {
      setError(e.message || 'Failed to send reset email.');
    } finally {
      setSaving(false);
    }
  };

  const openCreate = () => { setForm(EMPTY_FORM); setError(''); setShowCreate(true); };
  const openEdit = (u: Profile) => { setEditUser({ ...u }); setError(''); };
  const openDelete = (u: Profile) => { setDeleteUser(u); setError(''); };
  const openReset = (u: Profile) => { setResetUser(u); setNewPassword(''); setError(''); };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500">Create and manage students, teachers, and authorities</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus className="h-4 w-4" /> Add User
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, roll number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="all">All Roles</option>
          <option value="student">Students</option>
          <option value="teacher">Teachers</option>
          <option value="authority">Authority</option>
        </select>
        <span className="self-center text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded-lg">{filtered.length} users</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <User className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">User</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Department</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Roll No.</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Joined</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((user) => {
                  const RoleIcon = roleIcons[user.role] || User;
                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                            {user.full_name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{user.full_name}</p>
                            <p className="text-xs text-gray-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${roleColors[user.role] || 'bg-gray-100 text-gray-700'}`}>
                          <RoleIcon className="h-3 w-3" />{user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.department || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-mono">{user.institution_roll_number || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">{new Date(user.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(user)} title="Edit" className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => openReset(user)} title="Reset Password" className="p-1.5 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded transition-colors">
                            <KeyRound className="h-4 w-4" />
                          </button>
                          <button onClick={() => openDelete(user)} title="Delete" className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── CREATE USER MODAL ── */}
      {showCreate && (
        <Modal title="Create New User" onClose={() => setShowCreate(false)}>
          {error && <ErrorBox msg={error} />}
          <div className="space-y-4">
            <Field label="Full Name *">
              <input className={inputCls} placeholder="e.g. Rahul Kumar" value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} />
            </Field>
            <Field label="Email *">
              <input type="email" className={inputCls} placeholder="user@domain.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </Field>
            <Field label="Password *">
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} className={inputCls + ' pr-10'} placeholder="Min 6 characters" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
            <Field label="Role *">
              <select className={inputCls} value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value as any }))}>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="authority">Authority</option>
              </select>
            </Field>
            <Field label="Department *">
              <input className={inputCls} placeholder="e.g. Computer Science" value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} />
            </Field>
            <Field label="Roll Number / ID">
              <input className={inputCls} placeholder="e.g. 21BCS001" value={form.institution_roll_number} onChange={e => setForm(p => ({ ...p, institution_roll_number: e.target.value }))} />
            </Field>

            {/* Student-specific fields */}
            {form.role === 'student' && (
              <>
                <Field label="Year of Study *">
                  <select className={inputCls} value={form.year_of_study} onChange={e => setForm(p => ({ ...p, year_of_study: e.target.value }))}>
                    <option value="">Select year</option>
                    {[1,2,3,4,5].map(y => <option key={y} value={y}>{y}{y===1?'st':y===2?'nd':y===3?'rd':'th'} Year</option>)}
                  </select>
                </Field>
                <Field label="Section">
                  <input className={inputCls} placeholder="e.g. A, B, C" value={form.section} onChange={e => setForm(p => ({ ...p, section: e.target.value }))} />
                </Field>
                <Field label="Branch">
                  <input className={inputCls} placeholder="e.g. CSE, ECE, ME" value={form.branch} onChange={e => setForm(p => ({ ...p, branch: e.target.value }))} />
                </Field>
              </>
            )}

            {/* Teacher-specific fields */}
            {form.role === 'teacher' && (
              <Field label="Subject Specialization *">
                <input className={inputCls} placeholder="e.g. Data Structures, Physics" value={form.subject_specialization} onChange={e => setForm(p => ({ ...p, subject_specialization: e.target.value }))} />
              </Field>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={handleCreate} disabled={saving} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60 font-medium">
                {saving ? 'Creating...' : 'Create User'}
              </button>
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── EDIT USER MODAL ── */}
      {editUser && (
        <Modal title="Edit User" onClose={() => setEditUser(null)}>
          {error && <ErrorBox msg={error} />}
          <div className="space-y-4">
            <Field label="Full Name *">
              <input className={inputCls} value={editUser.full_name} onChange={e => setEditUser(p => p ? { ...p, full_name: e.target.value } : p)} />
            </Field>
            <Field label="Email (read-only)">
              <input className={inputCls + ' bg-gray-50 cursor-not-allowed'} value={editUser.email} readOnly />
            </Field>
            <Field label="Department *">
              <input className={inputCls} value={editUser.department} onChange={e => setEditUser(p => p ? { ...p, department: e.target.value } : p)} />
            </Field>
            <Field label="Role">
              <select className={inputCls} value={editUser.role} onChange={e => setEditUser(p => p ? { ...p, role: e.target.value } : p)}>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="authority">Authority</option>
              </select>
            </Field>
            {/* Locked fields notice */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 flex gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              Roll number, year, section, and branch are locked after account creation.
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleEdit} disabled={saving} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60 font-medium">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={() => setEditUser(null)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── DELETE CONFIRM MODAL ── */}
      {deleteUser && (
        <Modal title="Delete User" onClose={() => setDeleteUser(null)}>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-500 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-800">Are you sure?</p>
                <p className="text-sm text-red-600">This will permanently delete <strong>{deleteUser.full_name}</strong> ({deleteUser.email}). This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleDelete} disabled={saving} className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:opacity-60 font-medium">
                {saving ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button onClick={() => setDeleteUser(null)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── RESET PASSWORD MODAL ── */}
      {resetUser && (
        <Modal title="Reset Password" onClose={() => setResetUser(null)}>
          {error && <ErrorBox msg={error} />}
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Send a password reset email to <strong>{resetUser.email}</strong>. The user will receive a link to set a new password.</p>
            <div className="flex gap-3 pt-2">
              <button onClick={handleResetPassword} disabled={saving} className="flex-1 bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600 disabled:opacity-60 font-medium">
                {saving ? 'Sending...' : 'Send Reset Email'}
              </button>
              <button onClick={() => setResetUser(null)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────
const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm mb-2">{msg}</div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
