import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';

export default function NotPermission() {
    return (
        <div className="min-h-screen bg-[#F6F6F6] flex flex-col items-center justify-center p-6 font-sans">
            <div className="w-full max-w-[480px] bg-white p-12 shadow-2xl rounded-sm text-center">
                {/* Ícone de Cadeado Estilizado */}
                <div className="relative inline-flex items-center justify-center mb-8">
                    <div className="absolute inset-0 bg-black/5 rounded-full scale-[1.8] animate-pulse" />
                    <div className="relative bg-black p-5 rounded-full text-white">
                        <Lock size={32} strokeWidth={2.5} />
                    </div>
                </div>

                <h1 className="text-[32px] font-bold text-zinc-900 leading-tight tracking-tight uppercase mb-4">
                    Acesso Restrito
                </h1>

                <p className="text-zinc-500 text-sm leading-relaxed mb-10 max-w-[300px] mx-auto">
                    Você não possui as permissões necessárias para visualizar estas métricas operacionais.
                </p>

                <div className="space-y-3">
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 w-full bg-black text-white py-4 text-sm font-bold hover:bg-zinc-800 transition-all active:scale-[0.98]"
                    >
                        <ArrowLeft size={16} />
                        Voltar ao Dashboard
                    </Link>

                    <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-[2px] pt-4">
                        PolarLog v1.0.0 - Desenvolvido por Jorge Pires
                    </p>
                </div>
            </div>
        </div>
    );
}