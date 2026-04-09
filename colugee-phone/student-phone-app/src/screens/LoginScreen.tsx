import { useState } from 'react';
import { supabase } from '../supabase';
import { GraduationCap, Loader2, Building2 } from 'lucide-react';

type Step = 'institution' | 'login';

interface Institution {
  id: string;
  code: string;
  name: string;
}

export default function LoginScreen() {
  const [step, setStep] = useState<Step>('institution');
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFindInstitution = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('institutions')
        .select('id, code, name')
        .eq('code', code.toUpperCase())
        .single();

      if (error || !data) {
        setError('Institution not found. Check your code.');
        return;
      }
      setInstitution(data);
      setStep('login');
    } catch {
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) { setError(authError.message); return; }

      if (institution && data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('institution_id')
          .eq('user_id', data.user.id)
          .single();

        if (profile?.institution_id !== institution.id) {
          await supabase.auth.signOut();
          setError('You are not registered with this institution.');
        }
      }
    } catch {
      setError('Login failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-600 to-indigo-800 flex flex-col">
      {/* Header */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-12 pb-6">
        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-4 shadow-lg">
          <GraduationCap className="h-10 w-10 text-indigo-600" />
        </div>
        <h1 className="text-3xl font-bold text-white">Colugee</h1>
        <p className="text-indigo-200 mt-1 text-sm">Your college community app</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-t-3xl px-6 pt-8 pb-10 shadow-2xl">
        {step === 'institution' ? (
          <form onSubmit={handleFindInstitution} className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Find Your Institution</h2>
              <p className="text-sm text-gray-500 mt-1">Enter your institution code to get started</p>
            </div>

            {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-xl">{error}</p>}

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Institution Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. IITD, MIT, NITK"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-base"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-semibold text-base disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Building2 className="h-5 w-5" />}
              Find Institution
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <button type="button" onClick={() => { setStep('institution'); setError(''); }} className="text-indigo-600 text-sm">← Back</button>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Sign In</h2>
                <p className="text-xs text-indigo-600 font-medium">{institution?.name}</p>
              </div>
            </div>

            {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-xl">{error}</p>}

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@domain.com"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-base"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-base"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-semibold text-base disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-5 w-5 animate-spin" />}
              Sign In
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
