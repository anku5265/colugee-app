import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';
import {
  Search, Loader2, User, GraduationCap, Shield, BookOpen,
  Plus, Pencil, Trash2, KeyRound, X, Eye, EyeOff, AlertTriangle,
  Download, Upload, Filter
} from 'lucide-react';

interface Profile {
  id: string; user_id: string; full_name: string; email: string;
  role: string; department: string; institution_roll_number: string;
  year_of_study: number | null; section: string | null; branch: string | null;
  created_at: string; institution_id: string;
}

interface CreateUserForm {
  email: string; password: string; full_name: string;
  role: 'student' | 'teacher' | 'authority' | 'institute_admin';
  department: string; institution_roll_number: string;
  year_of_study: string; section: string; branch: string;
}

const EMPTY_FORM: CreateUserForm = {
  email: '', password: '', full_name: '', role: 'student',
  department: '', institution_roll_number: '',
  year_of_study: '', section: '', branch: '',
};

const roleIcons: Record<string, any> = { student: GraduationCap, teacher: BookOpen, authority: Shield, institute_admin: Shield };
const roleColors: Record<string, string> = {
  student: 'bg-blue-100 text-blue-700', teacher: 'bg-green-100 text-green-700',
  authority: 'bg-purple-100 text-purple-700', institute_admin: 'bg-indigo-100 text-indigo-700',
};
const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [institutionId, setInstitutionId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<Profile | null>(null);
  const [deleteUser, setDeleteUser] = useState<Profile | null>(null);
  const [resetUser, setResetUser] = useState<Profile | null>(null);

  // Form
  const [form, setForm] = useState<CreateUserForm>(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Bulk import
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<{ success: number; failed: { row: number; reason: string }[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchInstitutionId(); }, []);

  const fetchInstitutionId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('profiles').select('institution_id').eq('user_id', user.id).single();
    if (data?.institution_id) { setInstitutionId(data.institution_id); fetchUsers(data.institution_id); }
  };

  const fetchUsers = async (instId?: string) => {
    const id = instId || institutionId;
    if (!id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, email, role, department, institution_roll_number, year_of_study, section, branch, created_at, institution_id')
        .eq('institution_id', id)
        .in('role', ['student', 'teacher', 'authority', 'institute_admin'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      setUsers(data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  // ── FILTERS ──────────────────────────────────────────────────
  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.institution_roll_number?.toLowerCase().includes(q);
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchDept = !deptFilter || u.department?.toLowerCase().includes(deptFilter.toLowerCase());
    const matchYear = !yearFilter || String(u.year_of_study) === yearFilter;
    const matchSection = !sectionFilter || u.section?.toLowerCase() === sectionFilter.toLowerCase();
    const matchBranch = !branchFilter || u.branch?.toLowerCase().includes(branchFilter.toLowerCase());
    return matchSearch && matchRole && matchDept && matchYear && matchSection && matchBranch;
  });

  // ── CREATE USER ──────────────────────────────────────────────
  const handleCreate = async () => {
    setError('');
    // Validate required fields
    if (!form.full_name.trim()) { setError('Full name is required.'); return; }
    if (!form.email.trim()) { setError('Email is required.'); return; }
    if (!form.password || form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (!form.role) { setError('Please select a valid role.'); return; }
    if (!form.department.trim()) { setError('Department is required.'); return; }
    if (form.role === 'student' && !form.year_of_study) { setError('Year of study is required for students.'); return; }
    if (!institutionId) { setError('Institution not found. Please re-login.'); return; }

    setSaving(true);
    try {
      // Check duplicate email within this tenant
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', form.email.trim().toLowerCase())
        .eq('institution_id', institutionId)
        .maybeSingle();
      if (existing) { setError('This email already exists in your institute.'); return; }

      // Create auth user (Supabase handles password hashing)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        options: {
          data: {
            full_name: form.full_name.trim(),
            institution_id: institutionId,
            institution_roll_number: form.institution_roll_number.trim() || null,
            role: form.role,
            department: form.department.trim(),
            year_of_study: form.role === 'student' && form.year_of_study ? parseInt(form.year_of_study) : null,
            section: form.role === 'student' ? form.section.trim() || null : null,
            branch: form.role === 'student' ? form.branch.trim() || null : null,
          },
        },
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          setError('This email is already registered on the platform.');
        } else {
          setError(authError.message);
        }
        return;
      }

      const userId = authData.user?.id;
      if (!userId) { setError('User creation failed. Please try again.'); return; }

      // Upsert profile with tenant_id
      const { error: profileError } = await supabase.from('profiles').upsert({
        user_id: userId,
        email: form.email.trim().toLowerCase(),
        full_name: form.full_name.trim(),
        role: form.role,
        department: form.department.trim(),
        institution_id: institutionId,
        institution_roll_number: form.institution_roll_number.trim() || null,
        year_of_study: form.role === 'student' && form.year_of_study ? parseInt(form.year_of_study) : null,
        section: form.role === 'student' ? form.section.trim() || null : null,
        branch: form.role === 'student' ? form.branch.trim() || null : null,
      }, { onConflict: 'user_id' });

      if (profileError) { setError(`Profile save failed: ${profileError.message}`); return; }

      setShowCreate(false);
      setForm(EMPTY_FORM);
      setShowPassword(false);
      fetchUsers();
    } catch (e: any) {
      setError(e.message || 'Failed to create user. Please try again.');
    } finally { setSaving(false); }
  };

  // ── EDIT USER ────────────────────────────────────────────────
  const handleEdit = async () => {
    if (!editUser) return;
    setError('');
    if (!editUser.full_name.trim()) { setError('Full name is required.'); return; }
    if (!editUser.department.trim()) { setError('Department is required.'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({
        full_name: editUser.full_name.trim(),
        department: editUser.department.trim(),
        role: editUser.role,
      }).eq('id', editUser.id).eq('institution_id', institutionId!);
      if (error) throw error;
      setEditUser(null);
      fetchUsers();
    } catch (e: any) { setError(e.message || 'Failed to update user.'); } finally { setSaving(false); }
  };

  // ── DELETE USER ──────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteUser) return;
    setSaving(true);
    try {
      await supabase.from('profiles').delete().eq('id', deleteUser.id).eq('institution_id', institutionId!);
      setDeleteUser(null);
      fetchUsers();
    } catch (e: any) { setError(e.message || 'Failed to delete user.'); } finally { setSaving(false); }
  };

  // ── RESET PASSWORD ───────────────────────────────────────────
  const handleResetPassword = async () => {
    if (!resetUser) return;
    setSaving(true);
    setError('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetUser.email, {
        redirectTo: `${window.location.origin}`,
      });
      if (error) throw error;
      alert(`Password reset email sent to ${resetUser.email}`);
      setResetUser(null);
    } catch (e: any) { setError(e.message || 'Failed to send reset email.'); } finally { setSaving(false); }
  };

  // ── EXPORT USERS ─────────────────────────────────────────────
  const handleExport = () => {
    const rows = filtered.map(u => ({
      full_name: u.full_name,
      email: u.email,
      role: u.role,
      department: u.department || '',
      roll_number: u.institution_roll_number || '',
      year: u.year_of_study || '',
      section: u.section || '',
      branch: u.branch || '',
      joined: new Date(u.created_at).toLocaleDateString(),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Users');
    XLSX.writeFile(wb, `users_export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // ── DOWNLOAD TEMPLATE ────────────────────────────────────────
  const handleDownloadTemplate = () => {
    const template = [
      { full_name: 'Rahul Kumar', email: 'rahul@example.com', password: 'pass123', role: 'student', department: 'Computer Science', roll_number: '21BCS001', year: 2, section: 'A', branch: 'CSE' },
      { full_name: 'Dr. Sharma', email: 'sharma@example.com', password: 'pass123', role: 'teacher', department: 'Physics', roll_number: '', year: '', section: '', branch: '' },
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'user_import_template.xlsx');
  };

  // ── BULK IMPORT ──────────────────────────────────────────────
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !institutionId) return;
    setImporting(true);
    setImportResults(null);

    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(ws);

      const validRoles = ['student', 'teacher', 'authority', 'institute_admin'];
      let successCount = 0;
      const failed: { row: number; reason: string }[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2; // Excel row number (1-indexed + header)

        // Validate required fields
        if (!row.full_name?.toString().trim()) { failed.push({ row: rowNum, reason: 'Missing full_name' }); continue; }
        if (!row.email?.toString().trim()) { failed.push({ row: rowNum, reason: 'Missing email' }); continue; }
        if (!row.password?.toString().trim() || row.password.toString().length < 6) { failed.push({ row: rowNum, reason: 'Password missing or too short (min 6 chars)' }); continue; }
        if (!row.role?.toString().trim() || !validRoles.includes(row.role.toString().toLowerCase())) { failed.push({ row: rowNum, reason: `Invalid role: "${row.role}". Use: student/teacher/authority/institute_admin` }); continue; }
        if (!row.department?.toString().trim()) { failed.push({ row: rowNum, reason: 'Missing department' }); continue; }

        const email = row.email.toString().trim().toLowerCase();
        const role = row.role.toString().toLowerCase();

        // Check duplicate within tenant
        const { data: dup } = await supabase.from('profiles').select('id').eq('email', email).eq('institution_id', institutionId).maybeSingle();
        if (dup) { failed.push({ row: rowNum, reason: `Email "${email}" already exists in this institute` }); continue; }

        // Create auth user
        const { data: authData, error: authErr } = await supabase.auth.signUp({
          email,
          password: row.password.toString(),
          options: {
            data: {
              full_name: row.full_name.toString().trim(),
              institution_id: institutionId,
              role,
              department: row.department.toString().trim(),
              institution_roll_number: row.roll_number?.toString().trim() || null,
              year_of_study: role === 'student' && row.year ? parseInt(row.year) : null,
              section: role === 'student' ? row.section?.toString().trim() || null : null,
              branch: role === 'student' ? row.branch?.toString().trim() || null : null,
            },
          },
        });

        if (authErr) { failed.push({ row: rowNum, reason: authErr.message }); continue; }

        const userId = authData.user?.id;
        if (!userId) { failed.push({ row: rowNum, reason: 'Auth user creation returned no ID' }); continue; }

        // Upsert profile
        const { error: profErr } = await supabase.from('profiles').upsert({
          user_id: userId, email,
          full_name: row.full_name.toString().trim(),
          role, department: row.department.toString().trim(),
          institution_id: institutionId,
          institution_roll_number: row.roll_number?.toString().trim() || null,
          year_of_study: role === 'student' && row.year ? parseInt(row.year) : null,
          section: role === 'student' ? row.section?.toString().trim() || null : null,
          branch: role === 'student' ? row.branch?.toString().trim() || null : null,
        }, { onConflict: 'user_id' });

        if (profErr) { failed.push({ row: rowNum, reason: `Profile error: ${profErr.message}` }); continue; }
        successCount++;
      }

      setImportResults({ success: successCount, failed });
      if (successCount > 0) fetchUsers();
    } catch (e: any) {
      setImportResults({ success: 0, failed: [{ row: 0, reason: `File parse error: ${e.message}` }] });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const openCreate = () => { setForm(EMPTY_FORM); setError(''); setShowCreate(true); };
  const openEdit = (u: Profile) => { setEditUser({ ...u }); setError(''); };
  const openDelete = (u: Profile) => { setDeleteUser(u); setError(''); };
  const openReset = (u: Profile) => { setResetUser(u); setError(''); };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500">Manage students, teachers, and authorities</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={handleDownloadTemplate} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">
            <Download className="h-4 w-4" /> Template
          </button>
          <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium cursor-pointer">
            <Upload className="h-4 w-4" /> {importing ? 'Importing...' : 'Import Excel'}
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} disabled={importing} />
          </label>
          <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">
            <Download className="h-4 w-4" /> Export
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium text-sm">
            <Plus className="h-4 w-4" /> Add User
          </button>
        </div>
      </div>

      {/* Import Results */}
      {importResults && (
        <div className={`p-4 rounded-lg border ${importResults.failed.length === 0 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <p className="font-medium text-sm mb-1">Import Results: {importResults.success} created successfully</p>
          {importResults.failed.length > 0 && (
            <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
              {importResults.failed.map((f, i) => (
                <p key={i} className="text-xs text-red-600">Row {f.row}: {f.reason}</p>
              ))}
            </div>
          )}
          <button onClick={() => setImportResults(null)} className="mt-2 text-xs text-gray-500 underline">Dismiss</button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-600"><Filter className="h-4 w-4" />Filters</div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="relative col-span-2 md:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search name/email..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
          </div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm">
            <option value="all">All Roles</option>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="authority">Authority</option>
            <option value="institute_admin">Institute Admin</option>
          </select>
          <input type="text" placeholder="Department..." value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
          <select value={yearFilter} onChange={e => setYearFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm">
            <option value="">All Years</option>
            {[1,2,3,4,5].map(y => <option key={y} value={y}>Year {y}</option>)}
          </select>
          <input type="text" placeholder="Section..." value={sectionFilter} onChange={e => setSectionFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
          <input type="text" placeholder="Branch..." value={branchFilter} onChange={e => setBranchFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
        </div>
        <p className="text-xs text-gray-400">{filtered.length} of {users.length} users</p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400"><User className="h-12 w-12 mx-auto mb-3 opacity-40" /><p>No users found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">User</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Department</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Roll / Year</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Joined</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(user => {
                  const RoleIcon = roleIcons[user.role] || User;
                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">{user.full_name?.charAt(0)?.toUpperCase() || '?'}</div>
                          <div><p className="font-medium text-gray-900 text-sm">{user.full_name}</p><p className="text-xs text-gray-400">{user.email}</p></div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${roleColors[user.role] || 'bg-gray-100 text-gray-700'}`}>
                          <RoleIcon className="h-3 w-3" />{user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.department || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <span className="font-mono">{user.institution_roll_number || '—'}</span>
                        {user.year_of_study && <span className="ml-2 text-xs text-gray-400">Yr {user.year_of_study}{user.section ? ` / ${user.section}` : ''}</span>}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">{new Date(user.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(user)} title="Edit" className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><Pencil className="h-4 w-4" /></button>
                          <button onClick={() => openReset(user)} title="Reset Password" className="p-1.5 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded transition-colors"><KeyRound className="h-4 w-4" /></button>
                          <button onClick={() => openDelete(user)} title="Delete" className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 className="h-4 w-4" /></button>
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
            <Field label="Full Name *"><input className={inputCls} placeholder="e.g. Rahul Kumar" value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} /></Field>
            <Field label="Email *"><input type="email" className={inputCls} placeholder="user@domain.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></Field>
            <Field label="Password *">
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} className={inputCls + ' pr-10'} placeholder="Min 6 characters" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
              </div>
            </Field>
            <Field label="Role *">
              <select className={inputCls} value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value as any }))}>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="authority">Authority</option>
                <option value="institute_admin">Institute Admin</option>
              </select>
            </Field>
            <Field label="Department *"><input className={inputCls} placeholder="e.g. Computer Science" value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} /></Field>
            <Field label="Roll Number / ID"><input className={inputCls} placeholder="e.g. 21BCS001" value={form.institution_roll_number} onChange={e => setForm(p => ({ ...p, institution_roll_number: e.target.value }))} /></Field>

            {form.role === 'student' && (
              <>
                <Field label="Year of Study *">
                  <select className={inputCls} value={form.year_of_study} onChange={e => setForm(p => ({ ...p, year_of_study: e.target.value }))}>
                    <option value="">Select year</option>
                    {[1,2,3,4,5].map(y => <option key={y} value={y}>{y}{y===1?'st':y===2?'nd':y===3?'rd':'th'} Year</option>)}
                  </select>
                </Field>
                <Field label="Section"><input className={inputCls} placeholder="e.g. A, B, C" value={form.section} onChange={e => setForm(p => ({ ...p, section: e.target.value }))} /></Field>
                <Field label="Branch"><input className={inputCls} placeholder="e.g. CSE, ECE, ME" value={form.branch} onChange={e => setForm(p => ({ ...p, branch: e.target.value }))} /></Field>
              </>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={handleCreate} disabled={saving} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60 font-medium flex items-center justify-center gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}{saving ? 'Creating...' : 'Create User'}
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
            <Field label="Full Name *"><input className={inputCls} value={editUser.full_name} onChange={e => setEditUser(p => p ? { ...p, full_name: e.target.value } : p)} /></Field>
            <Field label="Email (read-only)"><input className={inputCls + ' bg-gray-50 cursor-not-allowed'} value={editUser.email} readOnly /></Field>
            <Field label="Department *"><input className={inputCls} value={editUser.department} onChange={e => setEditUser(p => p ? { ...p, department: e.target.value } : p)} /></Field>
            <Field label="Role">
              <select className={inputCls} value={editUser.role} onChange={e => setEditUser(p => p ? { ...p, role: e.target.value } : p)}>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="authority">Authority</option>
                <option value="institute_admin">Institute Admin</option>
              </select>
            </Field>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 flex gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              Roll number, year, section, and branch are locked after account creation.
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleEdit} disabled={saving} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60 font-medium">{saving ? 'Saving...' : 'Save Changes'}</button>
              <button onClick={() => setEditUser(null)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── DELETE MODAL ── */}
      {deleteUser && (
        <Modal title="Delete User" onClose={() => setDeleteUser(null)}>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-500 flex-shrink-0" />
              <div><p className="font-medium text-red-800">Are you sure?</p><p className="text-sm text-red-600">This will permanently delete <strong>{deleteUser.full_name}</strong> ({deleteUser.email}).</p></div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleDelete} disabled={saving} className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:opacity-60 font-medium">{saving ? 'Deleting...' : 'Yes, Delete'}</button>
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
            <p className="text-sm text-gray-600">Send a password reset email to <strong>{resetUser.email}</strong>.</p>
            <div className="flex gap-3 pt-2">
              <button onClick={handleResetPassword} disabled={saving} className="flex-1 bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600 disabled:opacity-60 font-medium">{saving ? 'Sending...' : 'Send Reset Email'}</button>
              <button onClick={() => setResetUser(null)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>{children}</div>;
}
function ErrorBox({ msg }: { msg: string }) {
  return <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm mb-2">{msg}</div>;
}
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
