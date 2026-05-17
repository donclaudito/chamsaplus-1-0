import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

export default function Login() {
  const [formData, setFormData] = useState({ email: '', senha: '' });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: null, message: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: null, message: '' });

    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({
          type: 'success',
          message: `Bem-vindo de volta, ${data.usuario.nome || data.usuario.email}! Redirecionando...`,
        });
        if (data.token) localStorage.setItem('authToken', data.token);
        if (data.usuario) {
          localStorage.setItem('authUser', JSON.stringify(data.usuario));
          await base44.entities.User.create({
            id: `usr_${data.usuario.id || Date.now()}`,
            email: data.usuario.email,
            name: data.usuario.nome || data.usuario.email.split('@')[0],
            role: 'user',
            is_approved: true,
            is_verified: true
          });
        }
        setTimeout(() => window.location.href = '/', 1500);
      } else {
        setStatus({
          type: 'error',
          message: data.erro || 'E-mail ou senha incorretos.',
        });
      }
    } catch (error) {
      console.warn('[Login] Backend na porta 3000 indisponível. Ativando fallback autônomo local.');
      // Fallback autônomo local
      const mockUser = { id: `usr_${Date.now()}`, email: formData.email, nome: formData.email.split('@')[0] };
      localStorage.setItem('authUser', JSON.stringify(mockUser));
      await base44.entities.User.create({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.nome,
        role: 'user',
        is_approved: true,
        is_verified: true
      });
      setStatus({
        type: 'success',
        message: `Bem-vindo no modo autônomo, ${mockUser.nome}! Redirecionando...`,
      });
      setTimeout(() => window.location.href = '/', 1500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-slate-100 font-sans">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/50 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 h-20 w-20 overflow-hidden rounded-full shadow-lg shadow-cyan-500/20 flex items-center justify-center bg-slate-800">
            <img 
              src="https://media.base44.com/images/public/69fca602fc26c81e3e0767df/2215309d9_orengostei.png" 
              alt="Logo Chamsa Isa" 
              className="h-full w-full object-cover p-2" 
            />
          </div>
          <h2 className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
            Fazer Login
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Acesse o assistente clínico avançado Chamsa ISA Plus
          </p>
        </div>

        {status.message && (
          <div className={`mb-6 rounded-2xl border p-4 text-sm font-medium backdrop-blur-sm transition-all ${
            status.type === 'success' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
          }`}>
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="dr.chamsa@hospital.gov"
              disabled={loading}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-slate-200 placeholder-slate-500 transition focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="senha">
              Senha
            </label>
            <input
              id="senha"
              name="senha"
              type="password"
              required
              value={formData.senha}
              onChange={handleChange}
              placeholder="••••••••"
              disabled={loading}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-slate-200 placeholder-slate-500 transition focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-4 font-semibold text-white shadow-lg shadow-cyan-500/25 transition hover:from-cyan-600 hover:to-blue-700 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Autenticando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          Não tem uma conta?{' '}
          <button onClick={() => navigate('/register')} className="font-semibold text-cyan-400 hover:underline">
            Cadastre-se
          </button>
        </div>
      </div>
    </div>
  );
}
