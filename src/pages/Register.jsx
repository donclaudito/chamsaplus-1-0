import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Users, Calendar, LogIn } from 'lucide-react';

export default function Register() {
  const [formData, setFormData] = useState({ nome: '', email: '', senha: '' });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: null, message: '' });
  const [recentUsers, setRecentUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchRecent() {
      try {
        const all = await base44.entities.User.list();
        const sorted = [...all].sort((a, b) => new Date(b.last_login_date || b.created_date || 0) - new Date(a.last_login_date || a.created_date || 0));
        setRecentUsers(sorted.slice(0, 3));
      } catch (_) {}
    }
    fetchRecent();
  }, []);

  const handleQuickLogin = async (user) => {
    localStorage.setItem('authToken', `mock_token_${user.id}`);
    localStorage.setItem('authUser', JSON.stringify({ id: user.id, email: user.email, nome: user.name || user.full_name }));
    await base44.entities.User.create({
      ...user,
      last_login_date: new Date().toISOString()
    });
    setStatus({
      type: 'success',
      message: `Bem-vindo de volta, ${user.name || user.email}! Acessando o sistema...`
    });
    setTimeout(() => window.location.href = '/', 1500);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: null, message: '' });

    try {
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({
          type: 'success',
          message: 'Cadastro realizado com sucesso! Verifique sua caixa de entrada no Gmail. Redirecionando para o login...',
        });
        if (data.token) localStorage.setItem('authToken', data.token);
        const mockUser = { id: `usr_${Date.now()}`, email: formData.email, nome: formData.nome || formData.email.split('@')[0] };
        localStorage.setItem('authUser', JSON.stringify(mockUser));
        await base44.entities.User.create({
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.nome,
          role: 'user',
          is_approved: true,
          is_verified: true,
          last_login_date: new Date().toISOString()
        });
        setFormData({ nome: '', email: '', senha: '' });
        setTimeout(() => window.location.href = '/login', 2500);
      } else {
        setStatus({
          type: 'error',
          message: data.erro || 'Ocorreu um erro ao tentar realizar o cadastro.',
        });
      }
    } catch (error) {
      console.warn('[Register] Backend na porta 3000 indisponível. Ativando fallback autônomo local.');
      // Fallback autônomo local
      const mockUser = { id: `usr_${Date.now()}`, email: formData.email, nome: formData.nome || formData.email.split('@')[0] };
      localStorage.setItem('authUser', JSON.stringify(mockUser));
      await base44.entities.User.create({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.nome,
        role: 'user',
        is_approved: true,
        is_verified: true,
        last_login_date: new Date().toISOString()
      });
      setStatus({
        type: 'success',
        message: `Cadastro local efetuado com sucesso para ${mockUser.nome}! Redirecionando para login...`,
      });
      setTimeout(() => window.location.href = '/login', 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-slate-100 font-sans">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/50 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 h-20 w-20 overflow-hidden rounded-full shadow-lg shadow-indigo-500/20 flex items-center justify-center bg-slate-800">
            <img 
              src="https://media.base44.com/images/public/69fca602fc26c81e3e0767df/2215309d9_orengostei.png" 
              alt="Logo Chamsa Isa" 
              className="h-full w-full object-cover p-2" 
            />
          </div>
          <h2 className="bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
            Cadastre seu e-mail
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Crie sua conta para acessar o Chamsa ISA Plus
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
            <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="nome">
              Nome Completo
            </label>
            <input
              id="nome"
              name="nome"
              type="text"
              required
              value={formData.nome}
              onChange={handleChange}
              placeholder="Digite seu nome completo"
              disabled={loading}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-slate-200 placeholder-slate-500 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="email">
              E-mail do Gmail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="voce@gmail.com"
              disabled={loading}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-slate-200 placeholder-slate-500 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
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
              className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-slate-200 placeholder-slate-500 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-pink-500 py-4 font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-600 hover:to-pink-600 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Processando Cadastro...' : 'Cadastrar e Acessar'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          Já tem uma conta?{' '}
          <button onClick={() => navigate('/login')} className="font-semibold text-indigo-400 hover:underline">
            Faça login
          </button>
        </div>

        {recentUsers.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-800/80 animate-in fade-in-50 duration-300">
            <div className="flex items-center gap-2 mb-4 text-xs font-semibold text-slate-400 uppercase tracking-wider justify-center">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>Contas Logadas Recentemente</span>
            </div>
            <div className="space-y-2.5">
              {recentUsers.map(u => (
                <div 
                  key={u.id}
                  onClick={() => handleQuickLogin(u)}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/40 border border-slate-700/50 hover:border-indigo-500/50 hover:bg-slate-800/80 transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-sm font-bold text-indigo-400 shrink-0 group-hover:scale-105 transition-transform">
                    {(u.name || u.full_name || u.email || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-semibold text-slate-200 truncate group-hover:text-indigo-300 transition-colors">{u.name || u.full_name || '—'}</p>
                    <p className="text-xs text-slate-400 truncate">{u.email}</p>
                    {u.last_login_date && (
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                        <Calendar className="w-2.5 h-2.5" />
                        <span>Acesso: {new Date(u.last_login_date).toLocaleDateString('pt-BR')} às {new Date(u.last_login_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    )}
                  </div>
                  <button className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-all shrink-0" title="Entrar com esta conta">
                    <LogIn className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
