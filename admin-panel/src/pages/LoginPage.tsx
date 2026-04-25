import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface LoginPageProps {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [collegeCode, setCollegeCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'code' | 'login'>('code');
  const [institution, setInstitution] = useState<{ id: string; name: string; code: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Verify college code
  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!collegeCode.trim()) return;
    setLoading(true);
    try {
      const { data, error: instError } = await supabase
        .from('institutions')
        .select('id, name, code, status')
        .eq('code', collegeCode.toUpperCase().trim())
        .single();

      if (instError || !data) {
        setError('Institution not found. Please check the college code.');
        return;
      }
      if (data.status === 'suspended') {
        setError('This institution has been suspended. Contact platform administrator.');
        return;
      }
      if (data.status === 'deleted') {
        setError('Institution not found. Please check the college code.');
        return;
      }
      setInstitution(data);
      setStep('login');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Login with email + password
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (authError) {
        setError('Invalid email or password.');
        return;
      }

      if (!data.user) {
        setError('Login failed. Please try again.');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, institution_id, full_name')
        .eq('user_id', data.user.id)
        .single();

      if (!profile) {
        await supabase.auth.signOut();
        setError('Profile not found. Contact your administrator.');
        return;
      }

      // Super admin - no institution check needed
      if (profile.role === 'super_admin') {
        onLogin();
        return;
      }

      // For institute_admin and authority - must match institution
      const allowedRoles = ['institute_admin', 'authority'];
      if (!allowedRoles.includes(profile.role)) {
        await supabase.auth.signOut();
        setError('Access denied. Only admin accounts can access this panel.');
        return;
      }

      if (profile.institution_id !== institution?.id) {
        await supabase.auth.signOut();
        setError(`Invalid credentials for this institute. This account does not belong to ${institution?.name}.`);
        return;
      }

      onLogin();
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Colugee Admin</h1>
          <p className="text-gray-500 mt-1">College Management Panel</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Step 1: College Code */}
        {step === 'code' && (
          <form onSubmit={handleCodeSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">College Code</label>
              <input
                type="text"
                value={collegeCode}
                onChange={(e) => setCollegeCode(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition uppercase"
                placeholder="e.g. ALLEN505, IITD"
                required
                disabled={loading}
              />
              <p className="text-xs text-gray-400 mt-1">Enter your institution's unique code</p>
            </div>
            <button
              type="submit"
              disabled={loading || !collegeCode.trim()}
              className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Verifying...</>
              ) : 'Continue →'}
            </button>
          </form>
        )}

        {/* Step 2: Email + Password */}
        {step === 'login' && institution && (
          <form onSubmit={handleLoginSubmit} className="space-y-5">
            {/* Institution badge */}
            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div>
                <p className="text-xs text-blue-500 font-medium">Institution</p>
                <p className="text-sm font-semibold text-blue-800">{institution.name}</p>
              </div>
              <span className="font-mono text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{institution.code}</span>
              <button
                type="button"
                onClick={() => { setStep('code'); setError(''); setEmail(''); setPassword(''); }}
                className="text-xs text-blue-500 hover:text-blue-700 underline ml-2"
              >
                Change
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="your.email@institution.com"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Signing in...</>
              ) : 'Sign In'}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-gray-400 mt-6">
          Admin, Institute Admin, and Authority accounts have access
        </p>
      </div>
    </div>
  );
}
