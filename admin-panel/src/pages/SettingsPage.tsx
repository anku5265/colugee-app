import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, Save, Building2 } from 'lucide-react';

interface Institution {
  id: string;
  name: string;
  code: string;
  address: string | null;
  contact_email: string | null;
  phone: string | null;
}

export default function SettingsPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, Partial<Institution>>>({});

  useEffect(() => {
    fetchInstitutions();
  }, []);

  const fetchInstitutions = async () => {
    try {
      const { data, error } = await supabase
        .from('institutions')
        .select('*')
        .order('name');

      if (error) throw error;
      setInstitutions(data || []);
    } catch (error) {
      console.error('Error fetching institutions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id: string, field: string, value: string) => {
    setEditData(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  const handleSave = async (institution: Institution) => {
    setSaving(institution.id);
    try {
      const updates = editData[institution.id] || {};
      const { error } = await supabase
        .from('institutions')
        .update(updates)
        .eq('id', institution.id);

      if (error) throw error;
      await fetchInstitutions();
      setEditData(prev => { const n = { ...prev }; delete n[institution.id]; return n; });
      alert('Institution updated successfully!');
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save changes.');
    } finally {
      setSaving(null);
    }
  };

  const getValue = (institution: Institution, field: keyof Institution) => {
    return editData[institution.id]?.[field] ?? institution[field] ?? '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Manage institution settings</p>
      </div>

      {institutions.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
          <Building2 className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>No institutions found</p>
        </div>
      ) : (
        institutions.map((institution) => (
          <div key={institution.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">{institution.name}</h2>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-mono">{institution.code}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { field: 'name', label: 'Institution Name' },
                { field: 'address', label: 'Address' },
                { field: 'contact_email', label: 'Contact Email' },
                { field: 'phone', label: 'Phone' },
              ].map(({ field, label }) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    type="text"
                    value={getValue(institution, field as keyof Institution) as string}
                    onChange={(e) => handleEdit(institution.id, field, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                  />
                </div>
              ))}
            </div>

            {editData[institution.id] && Object.keys(editData[institution.id]).length > 0 && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => handleSave(institution)}
                  disabled={saving === institution.id}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 text-sm font-medium"
                >
                  {saving === institution.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Changes
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
