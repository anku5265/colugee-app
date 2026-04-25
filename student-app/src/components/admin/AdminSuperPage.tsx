import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Plus, Pencil, Trash2, X, AlertTriangle, Loader2,
  Building2, Users, CheckCircle, XCircle, BarChart3,
  Eye, EyeOff, RefreshCw
} from 'lucide-react';

interface Institution {
  id: string;
  name: string;
  code: string;
  address: string | null;
  contact_email: string | null;
  phone: string | null;
  status: 'active' | 'suspended' | 'deleted';
  plan: string | null;
  max_users: number | null;
  created_at: string;
  _userCount?: number;
}

interface CreateTenantForm {
  name: string;
  code: string;
  address: string;
  contact_email: string;
  phone: string;
  plan: string;
  max_users: string;
  // Institute Admin
  admin_name: string;
  admin_email: string;
  admin_password: string;
}

const EMPTY_FORM: CreateTenantForm = {
  name: '', code: '', address: '', contact_email: '', phone: '',
  plan: 'free', max_users: '500',
  admin_name: '', admin_email: '', admin_password: '',
};

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm';

export default function SuperAdminPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, suspended: 0, totalUsers: 0 });

  const [showCreate, setShowCreate] = useState(false);
  const [editInst, setEditInst] = useState<Institution | null>(null);
  const [deleteInst, setDeleteInst] = useState<Institution | null>(null);

  const [form, setForm] = useState<CreateTenantForm>(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const { data: insts, error: instErr } = await supabase
        .from('institutions')
        .select('*')
        .neq('status', 'deleted')
        .order('created_at', { ascending: false });

      if (instErr) throw instErr;

      // Get user counts per institution
      const { data: profiles } = await supabase
        .from('profiles')
        .select('institution_id')
        .in('role', ['student', 'teacher', 'authority', 'institute_admin']);

      const countMap: Record<string, number> = {};
      (profiles || []).forEach(p => {
        if (p.institution_id) countMap[p.institution_id] = (countMap[p.institution_id] || 0) + 1;
      });

      const enriched = (insts || []).map(i => ({ ...i, _userCount: countMap[i.id] || 0 }));
      setInstitutions(enriched);

      const active = enriched.filter(i => i.status === 'active').length;
      const suspended = enriched.filter(i => i.status === 'suspended').length;
      const totalUsers = Object.values(countMap).reduce((a, b) => a + b, 0);
      setStats({ total: enriched.length, active, suspended, totalUsers });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── CREATE TENANT ────────────────────────────────────────────
  const handleCreate = async () => {
    setError(''); setSuccess('');
    if (!form.name || !form.code || !form.admin_email || !form.admin_password || !form.admin_name) {
      setError('Institute name, code, admin name, email and password are required.');
      return;
    }
    if (form.code.length < 2) { setError('Code must be at least 2 characters.'); return; }
    if (form.admin_password.length < 6) { setError('Admin password must be at least 6 characters.'); return; }

    setSaving(true);
    try {
      // 1. Check code uniqueness
      const { data: existing } = await supabase
        .from('institutions')
        .select('id')
        .eq('code', form.code.toUpperCase())
        .maybeSingle();
      if (existing) { setError('Institution code already exists.'); return; }

      // 2. Create institution
      const { data: inst, error: instErr } = await supabase
        .from('institutions')
        .insert({
          name: form.name.trim(),
          code: form.code.toUpperCase().trim(),
          address: form.address || null,
          contact_email: form.contact_email || null,
          phone: form.phone || null,
          plan: form.plan,
          max_users: parseInt(form.max_users) || 500,
          status: 'active',
        })
        .select()
        .single();

      if (instErr) throw instErr;

      // 3. Create institute admin auth user
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: form.admin_email,
        password: form.admin_password,
        options: {
          data: {
            full_name: form.admin_name,
            role: 'institute_admin',
            institution_id: inst.id,
            department: 'Administration',
          },
        },
      });

      if (authErr) {
        // Rollback institution
        await supabase.from('institutions').delete().eq('id', inst.id);
        throw authErr;
      }

      const adminUserId = authData.user?.id;
      if (adminUserId) {
        await supabase.from('profiles').upsert({
          user_id: adminUserId,
          email: form.admin_email,
          full_name: form.admin_name,
          role: 'institute_admin',
          institution_id: inst.id,
          department: 'Administration',
        }, { onConflict: 'user_id' });
      }

      // 4. Audit log
      const { data: { user: actor } } = await supabase.auth.getUser();
      if (actor) {
        await supabase.from('tenant_audit_log').insert({
          actor_user_id: actor.id,
          actor_role: 'super_admin',
          target_type: 'institution',
          target_id: inst.id,
          action: 'create',
          details: { name: inst.name, code: inst.code, admin_email: form.admin_email },
        });
      }

      setSuccess(`Tenant "${inst.name}" created successfully with admin ${form.admin_email}`);
      setShowCreate(false);
      setForm(EMPTY_FORM);
      fetchAll();
    } catch (e: any) {
      setError(e.message || 'Failed to create tenant.');
    } finally {
      setSaving(false);
    }
  };

  // ── TOGGLE STATUS ────────────────────────────────────────────
  const handleToggleStatus = async (inst: Institution) => {
    const newStatus = inst.status === 'active' ? 'suspended' : 'active';
    try {
      const { error } = await supabase
        .from('institutions')
        .update({ status: newStatus })
        .eq('id', inst.id);
      if (error) throw error;

      const { data: { user: actor } } = await supabase.auth.getUser();
      if (actor) {
        await supabase.from('tenant_audit_log').insert({
          actor_user_id: actor.id,
          actor_role: 'super_admin',
          target_type: 'institution',
          target_id: inst.id,
          action: newStatus === 'suspended' ? 'suspend' : 'activate',
          details: { name: inst.name },
        });
      }
      fetchAll();
    } catch (e: any) {
      setError(e.message);
    }
  };

  // ── SOFT DELETE ──────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteInst) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('institutions')
        .update({ status: 'deleted', deleted_at: new Date().toISOString() })
        .eq('id', deleteInst.id);
      if (error) throw error;

      const { data: { user: actor } } = await supabase.auth.getUser();
      if (actor) {
        await supabase.from('tenant_audit_log').insert({
          actor_user_id: actor.id,
          actor_role: 'super_admin',
          target_type: 'institution',
          target_id: deleteInst.id,
          action: 'delete',
          details: { name: deleteInst.name },
        });
      }
      setDeleteInst(null);
      fetchAll();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  // ── EDIT TENANT ──────────────────────────────────────────────
  const handleEdit = async () => {
    if (!editInst) return;
    setSaving(true);
    setError('');
    try {
      const { error } = await supabase
        .from('institutions')
        .update({
          name: editInst.name,
          address: editInst.address,
          contact_email: editInst.contact_email,
          phone: editInst.phone,
          plan: editInst.plan,
          max_users: editInst.max_users,
        })
        .eq('id', editInst.id);
      if (error) throw error;
      setEditInst(null);
      fetchAll();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const statusBadge = (status: string) => {
    if (status === 'active') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700"><CheckCircle className="h-3 w-3" />Active</span>;
    if (status === 'suspended') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700"><XCircle className="h-3 w-3" />Suspended</span>;
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Deleted</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Super Admin — Tenant Management</h1>
          <p className="text-gray-500">Manage all institutes on the Colugee platform</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchAll} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button
            onClick={() => { setForm(EMPTY_FORM); setError(''); setSuccess(''); setShowCreate(true); }}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 font-medium text-sm"
          >
            <Plus className="h-4 w-4" /> New Tenant
          </button>
        </div>
      </div>

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{success}</div>
      )}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Tenants', value: stats.total, icon: Building2, color: 'purple' },
          { label: 'Active', value: stats.active, icon: CheckCircle, color: 'green' },
          { label: 'Suspended', value: stats.suspended, icon: XCircle, color: 'yellow' },
          { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'blue' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <div className={`w-10 h-10 bg-${s.color}-100 rounded-lg flex items-center justify-center mb-3`}>
                <Icon className={`h-5 w-5 text-${s.color}-600`} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              <div className="text-sm text-gray-500">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Tenants Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : institutions.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Building2 className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>No tenants yet. Create your first institute.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Institute</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Code</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Plan</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Users</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Created</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {institutions.map(inst => (
                  <tr key={inst.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 font-bold text-sm">
                          {inst.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{inst.name}</p>
                          <p className="text-xs text-gray-400">{inst.contact_email || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">{inst.code}</span>
                    </td>
                    <td className="px-6 py-4">{statusBadge(inst.status)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 capitalize">{inst.plan || 'free'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {inst._userCount} / {inst.max_users || '∞'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(inst.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setEditInst({ ...inst }); setError(''); }}
                          title="Edit"
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(inst)}
                          title={inst.status === 'active' ? 'Suspend' : 'Activate'}
                          className={`p-1.5 rounded transition-colors ${inst.status === 'active' ? 'text-gray-500 hover:text-yellow-600 hover:bg-yellow-50' : 'text-gray-500 hover:text-green-600 hover:bg-green-50'}`}
                        >
                          {inst.status === 'active' ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => setDeleteInst(inst)}
                          title="Delete"
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── CREATE TENANT MODAL ── */}
      {showCreate && (
        <Modal title="Create New Tenant (Institute)" onClose={() => setShowCreate(false)}>
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm mb-3">{error}</div>}
          <div className="space-y-4">
            <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">Fill institute details and create its first admin account.</p>

            <div className="border-b pb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Institute Details</p>
              <div className="space-y-3">
                <Field label="Institute Name *">
                  <input className={inputCls} placeholder="e.g. IIT Delhi" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                </Field>
                <Field label="Unique Code (Tenant ID) *">
                  <input className={inputCls} placeholder="e.g. IITD" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Plan">
                    <select className={inputCls} value={form.plan} onChange={e => setForm(p => ({ ...p, plan: e.target.value }))}>
                      <option value="free">Free</option>
                      <option value="basic">Basic</option>
                      <option value="pro">Pro</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </Field>
                  <Field label="Max Users">
                    <input type="number" className={inputCls} value={form.max_users} onChange={e => setForm(p => ({ ...p, max_users: e.target.value }))} />
                  </Field>
                </div>
                <Field label="Contact Email">
                  <input type="email" className={inputCls} placeholder="admin@institute.edu" value={form.contact_email} onChange={e => setForm(p => ({ ...p, contact_email: e.target.value }))} />
                </Field>
                <Field label="Phone">
                  <input className={inputCls} placeholder="+91-XXXXXXXXXX" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                </Field>
                <Field label="Address">
                  <input className={inputCls} placeholder="City, State, Country" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
                </Field>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Institute Admin Account</p>
              <div className="space-y-3">
                <Field label="Admin Full Name *">
                  <input className={inputCls} placeholder="e.g. Dr. Rajesh Kumar" value={form.admin_name} onChange={e => setForm(p => ({ ...p, admin_name: e.target.value }))} />
                </Field>
                <Field label="Admin Email *">
                  <input type="email" className={inputCls} placeholder="admin@institute.edu" value={form.admin_email} onChange={e => setForm(p => ({ ...p, admin_email: e.target.value }))} />
                </Field>
                <Field label="Admin Password *">
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} className={inputCls + ' pr-10'} placeholder="Min 6 characters" value={form.admin_password} onChange={e => setForm(p => ({ ...p, admin_password: e.target.value }))} />
                    <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </Field>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={handleCreate} disabled={saving} className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 disabled:opacity-60 font-medium">
                {saving ? 'Creating...' : 'Create Tenant'}
              </button>
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── EDIT TENANT MODAL ── */}
      {editInst && (
        <Modal title="Edit Tenant" onClose={() => setEditInst(null)}>
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm mb-3">{error}</div>}
          <div className="space-y-4">
            <Field label="Institute Name">
              <input className={inputCls} value={editInst.name} onChange={e => setEditInst(p => p ? { ...p, name: e.target.value } : p)} />
            </Field>
            <Field label="Code (read-only)">
              <input className={inputCls + ' bg-gray-50 cursor-not-allowed'} value={editInst.code} readOnly />
            </Field>
            <Field label="Contact Email">
              <input type="email" className={inputCls} value={editInst.contact_email || ''} onChange={e => setEditInst(p => p ? { ...p, contact_email: e.target.value } : p)} />
            </Field>
            <Field label="Phone">
              <input className={inputCls} value={editInst.phone || ''} onChange={e => setEditInst(p => p ? { ...p, phone: e.target.value } : p)} />
            </Field>
            <Field label="Address">
              <input className={inputCls} value={editInst.address || ''} onChange={e => setEditInst(p => p ? { ...p, address: e.target.value } : p)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Plan">
                <select className={inputCls} value={editInst.plan || 'free'} onChange={e => setEditInst(p => p ? { ...p, plan: e.target.value } : p)}>
                  <option value="free">Free</option>
                  <option value="basic">Basic</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </Field>
              <Field label="Max Users">
                <input type="number" className={inputCls} value={editInst.max_users || 500} onChange={e => setEditInst(p => p ? { ...p, max_users: parseInt(e.target.value) } : p)} />
              </Field>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleEdit} disabled={saving} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60 font-medium">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={() => setEditInst(null)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── DELETE CONFIRM MODAL ── */}
      {deleteInst && (
        <Modal title="Delete Tenant" onClose={() => setDeleteInst(null)}>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Soft delete — are you sure?</p>
                <p className="text-sm text-red-600 mt-1">
                  <strong>{deleteInst.name}</strong> ({deleteInst.code}) will be marked as deleted.
                  All data is preserved but the institute will be inaccessible.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleDelete} disabled={saving} className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:opacity-60 font-medium">
                {saving ? 'Deleting...' : 'Yes, Delete Tenant'}
              </button>
              <button onClick={() => setDeleteInst(null)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
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

