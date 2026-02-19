'use client';

import Link from 'next/link';
import { MapPinOff, MoveRight } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 font-sans text-white">
            <div className="text-center space-y-8">
                {/* Ilustração Abstrata de Rota Perdida */}
                <div className="relative inline-block">
                    <div className="text-[180px] font-black leading-none tracking-tighter opacity-10 select-none">
                        404
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white p-4 rounded-full text-black shadow-[0_0_50px_rgba(255,255,255,0.2)]">
                            <MapPinOff size={40} strokeWidth={2.5} />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <h2 className="text-2xl font-bold uppercase tracking-tight">Rota não encontrada</h2>
                    <p className="text-zinc-500 text-sm font-medium max-w-xs mx-auto">
                        O endereço que você tentou acessar não existe ou foi movido para uma nova doca.
                    </p>
                </div>

                <div className="pt-6">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-4 bg-white text-black pl-8 pr-4 py-4 text-sm font-black uppercase tracking-widest hover:bg-zinc-200 transition-all group"
                    >
                        Recalcular Caminho
                        <div className="bg-black text-white p-1 group-hover:translate-x-1 transition-transform">
                            <MoveRight size={18} />
                        </div>
                    </Link>
                </div>
            </div>

            {/* Grid de fundo sutil (estilo mapa) */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] overflow-hidden">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }} />
            </div>
        </div>
    );
}