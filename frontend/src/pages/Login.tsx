import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true);
    try { const { data } = await api.post('/api/auth/login', { email, password }); login(data.token, data.user); navigate('/dashboard'); }
    catch (err: any) { setError(err.response?.data?.error || 'Login failed'); }
    finally { setLoading(false); }
  }

  return (
    <div className="bg-background min-h-screen flex items-center justify-center p-8 antialiased">
      <main className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-16 items-center justify-between">
        {/* Left: Branding */}
        <div className="hidden lg:flex flex-col flex-1 gap-8 h-full justify-center pl-8">
          <div>
            <h1 className="text-[40px] font-bold tracking-tight text-foreground leading-[1.2] mb-4">Welcome back to TaskMe.</h1>
            <p className="text-lg text-muted-foreground max-w-md leading-relaxed">Your calm, focused workspace for managing projects and achieving your goals with clarity.</p>
          </div>
          <div className="relative w-full aspect-video max-w-lg mt-8 rounded-[48px] overflow-hidden"
            style={{ boxShadow: '20px 20px 40px rgba(0,0,0,0.08), -10px -10px 20px rgba(255,255,255,0.6)' }}>
            <div className="w-full h-full bg-gradient-to-br from-primary/10 via-secondary/20 to-accent flex items-center justify-center">
              <span className="material-symbols-outlined fill text-primary" style={{ fontSize: '80px', opacity: 0.3 }}>dashboard</span>
            </div>
          </div>
        </div>

        {/* Right: Form */}
        <div className="w-full max-w-md lg:w-1/2 flex-shrink-0 relative">
          {/* Decorative blurs */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/20 rounded-full blur-2xl opacity-40 animate-pulse" />
          <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-muted rounded-full blur-2xl opacity-60" />

          <div className="clay-card p-16 relative z-10 w-full flex flex-col gap-8"
            style={{ boxShadow: '20px 20px 40px rgba(0,0,0,0.05), -10px -10px 20px rgba(255,255,255,0.8), inset 1px 1px 2px rgba(255,255,255,0.9), inset -1px -1px 2px rgba(0,0,0,0.02)' }}>

            {/* Mobile logo */}
            <div className="lg:hidden text-center mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full clay-pressed mb-4">
                <span className="material-symbols-outlined fill text-primary text-3xl">dashboard</span>
              </div>
              <h2 className="text-[32px] font-semibold tracking-tight text-foreground">TaskMe</h2>
            </div>

            <div className="text-center lg:text-left">
              <h3 className="text-2xl font-semibold text-foreground mb-2">Sign In</h3>
              <p className="text-base text-muted-foreground">Access your workspace to continue.</p>
            </div>

            {error && (
              <div className="clay-pressed !rounded-2xl px-5 py-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-destructive text-[18px]">error</span>
                <span className="text-sm font-semibold text-destructive">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-1">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-muted-foreground tracking-widest uppercase ml-4">Email Address</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">mail</span>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email"
                    placeholder="name@example.com"
                    className="clay-input w-full py-4 pl-12 pr-6 text-base text-foreground placeholder:text-muted-foreground/60" />
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-2">
                <label className="text-xs font-bold text-muted-foreground tracking-widest uppercase ml-4">Password</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">lock</span>
                  <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password"
                    placeholder="••••••••"
                    className="clay-input w-full py-4 pl-12 pr-12 text-base text-foreground placeholder:text-muted-foreground/60" />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    <span className="material-symbols-outlined text-[20px]">{showPw ? 'visibility' : 'visibility_off'}</span>
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="clay-btn w-full py-4 mt-6 font-semibold text-[15px] flex justify-center items-center gap-2 disabled:opacity-50">
                {loading ? (
                  <><span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>Signing in...</>
                ) : (
                  <><span>Sign In</span><span className="material-symbols-outlined text-[18px]">arrow_forward</span></>
                )}
              </button>
            </form>

            <p className="text-center text-base text-muted-foreground mt-2">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary font-semibold hover:underline decoration-primary/40 underline-offset-4">Sign up</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
