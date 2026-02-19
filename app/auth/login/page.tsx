'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Loader2, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    const router = useRouter();
    const supabase = createClient();

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) {
                throw new Error('Credenciais inválidas ou acesso negado.');
            }

            // Sucesso! Redireciona para o dashboard
            router.refresh();
            router.push('/');
            
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#F6F6F6] flex flex-col md:flex-row font-sans">
            
            {/* Lado Esquerdo: Identidade Visual */}
            <div className="hidden md:flex md:w-[60%] bg-black p-16 flex-col justify-between relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-12">
                        <Image src="/logo.png" width={32} height={32} alt="Logo" className='invert' />
                        <span className="text-2xl font-bold tracking-tighter uppercase text-white italic">
                            Polar <span className="text-zinc-500 font-medium not-italic">Log</span>
                        </span>
                    </div>

                    <h1 className="text-6xl font-black text-white leading-[1.1] tracking-tighter max-w-xl">
                        GESTÃO E <br />
                        <span className="italic text-zinc-500 underline decoration-zinc-800">VISIBILIDADE</span> <br />
                        DE TRANSPORTE <br />
                    </h1>
                </div>

                <div className="relative z-10 flex items-center gap-6 text-zinc-500">
                    <div className="flex flex-col">
                        <span className="text-white font-black text-sm uppercase tracking-widest">SLA 99.9%</span>
                        <span className="text-[10px] uppercase font-bold tracking-wider">Uptime Garantido</span>
                    </div>
                    <div className="w-[1px] h-8 bg-zinc-800" />
                    <div className="flex flex-col">
                        <span className="text-white font-black text-sm uppercase tracking-widest">17</span>
                        <span className="text-[10px] uppercase font-bold tracking-wider">Estados Atendidos</span>
                    </div>
                </div>
            </div>

            {/* Lado Direito: Formulário */}
            <div className="flex-1 bg-white flex flex-col justify-center p-8 md:p-20 relative">
                <div className="max-w-sm w-full mx-auto space-y-10">
                    
                    <header className="space-y-3">
                        <h2 className="text-3xl font-black tracking-tighter uppercase italic text-black">Acesse sua conta</h2>
                        <p className="text-zinc-400 text-sm font-medium">Insira suas credenciais de operador para gerenciar carregamentos.</p>
                    </header>

                    <form onSubmit={handleLogin} className="space-y-6">
                        {/* Alerta de Erro */}
                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-600 p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
                                <AlertCircle className="text-red-600 shrink-0" size={18} />
                                <span className="text-red-800 text-xs font-bold uppercase tracking-tight">{error}</span>
                            </div>
                        )}

                        <div className="group space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-focus-within:text-black transition-colors">
                                Identificação (E-mail)
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-0 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-black transition-colors" size={18} />
                                <input 
                                    type="email" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="exemplo@polarlog.com"
                                    className="w-full border-b-2 border-zinc-100 py-3 pl-8 focus:border-black outline-none font-semibold text-base placeholder:text-zinc-200 transition-all bg-transparent text-black"
                                />
                            </div>
                        </div>

                        <div className="group space-y-2">
                            <div className="flex justify-between items-end">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-focus-within:text-black transition-colors">
                                    Senha de Acesso
                                </label>
                                <a href="#" className="text-[10px] font-bold text-zinc-400 hover:text-black uppercase tracking-tighter underline">Esqueci a senha</a>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-0 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-black transition-colors" size={18} />
                                <input 
                                    type="password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    className="w-full border-b-2 border-zinc-100 py-3 pl-8 focus:border-black outline-none font-semibold text-base placeholder:text-zinc-200 transition-all bg-transparent text-black"
                                />
                            </div>
                        </div>

                        <div className="pt-6">
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full bg-black text-white py-5 text-xs font-black uppercase tracking-[0.2em] hover:bg-zinc-800 disabled:bg-zinc-200 transition-all active:scale-[0.98] flex justify-center items-center gap-3 group"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <>
                                        Entrar no Sistema
                                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    <footer className="pt-10 flex items-center gap-3 border-t border-zinc-50">
                        <div className="bg-zinc-100 p-2 rounded-full text-zinc-400">
                            <ShieldCheck size={16} />
                        </div>
                        <p className="text-[10px] leading-relaxed text-zinc-400 font-medium uppercase tracking-tighter">
                            Conexão segura. Acesso monitorado para fins de segurança operacional (LGPD).
                        </p>
                    </footer>
                </div>
            </div>
        </div>
    );
}