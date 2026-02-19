import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, Mail, Loader2, AlertCircle, UserPlus, LogIn, User as UserIcon, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const Login: React.FC = () => {
    const { session } = useAuth();
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (session) {
            navigate('/');
        }
    }, [session, navigate]);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (isSignUp) {
                const { error, data } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            name,
                            phone
                        }
                    }
                });
                if (error) throw error;
                if (data.user && data.session) {
                    // Conta criada e logada automaticamente
                } else if (data.user && !data.session) {
                    setMessage("Conta criada! Verifique seu e-mail para confirmar (se necessário) ou faça login.");
                    setIsSignUp(false);
                }
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
            }
        } catch (err: any) {
            let msg = err.message || 'Ocorreu um erro ao tentar autenticar.';
            if (msg.includes('email rate limit exceeded')) {
                msg = 'Limite de e-mails atingido (máximo 3 por hora no plano gratuito). Tente fazer login diretamente pois sua conta já pode ter sido pré-criada ou aguarde um pouco.';
            }
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-fortis-dark flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-fortis-panel border border-fortis-surface rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-white mb-2 italic">FORTIS</h1>
                    <p className="text-fortis-mid font-medium">
                        {isSignUp ? 'Crie sua conta para começar' : 'Acesse sua conta para continuar'}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-start gap-3 text-red-400">
                        <AlertCircle size={20} className="shrink-0 mt-0.5" />
                        <p className="text-sm font-semibold">{error}</p>
                    </div>
                )}

                {message && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6 flex items-start gap-3 text-green-400">
                        <AlertCircle size={20} className="shrink-0 mt-0.5" />
                        <p className="text-sm font-semibold">{message}</p>
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-4">
                    {isSignUp && (
                        <>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-fortis-mid uppercase tracking-widest pl-1">Nome completo</label>
                                <div className="relative">
                                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-fortis-mid" size={18} />
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-fortis-dark border border-fortis-surface rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-fortis-mid/30 focus:border-fortis-brand outline-none transition-all font-semibold"
                                        placeholder="Seu Nome Completo"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-fortis-mid uppercase tracking-widest pl-1">Telefone</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-fortis-mid" size={18} />
                                    <input
                                        type="tel"
                                        required
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full bg-fortis-dark border border-fortis-surface rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-fortis-mid/30 focus:border-fortis-brand outline-none transition-all font-semibold"
                                        placeholder="(00) 00000-0000"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-fortis-mid uppercase tracking-widest pl-1">E-mail</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-fortis-mid" size={18} />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-fortis-dark border border-fortis-surface rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-fortis-mid/30 focus:border-fortis-brand outline-none transition-all font-semibold"
                                placeholder="seu@email.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-2 pb-2">
                        <label className="text-[10px] font-black text-fortis-mid uppercase tracking-widest pl-1">Senha</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-fortis-mid" size={18} />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-fortis-dark border border-fortis-surface rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-fortis-mid/30 focus:border-fortis-brand outline-none transition-all font-semibold"
                                placeholder="••••••••"
                                minLength={6}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-fortis-brand text-white font-bold py-4 rounded-xl shadow-lg shadow-fortis-brand/20 hover:bg-opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <>
                                {isSignUp ? <UserPlus size={20} /> : <LogIn size={20} />}
                                {isSignUp ? 'Criar Conta' : 'Entrar na Plataforma'}
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center space-y-4">
                    <button
                        onClick={() => {
                            setIsSignUp(!isSignUp);
                            setError(null);
                            setMessage(null);
                        }}
                        className="text-xs font-bold text-fortis-mid hover:text-white transition-colors"
                    >
                        {isSignUp ? 'Já tem uma conta? Faça login' : 'Não tem uma conta? Crie agora'}
                    </button>
                </div>
            </div>
        </div>
    );
};
