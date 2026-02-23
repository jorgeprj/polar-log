'use client';

import React, { useEffect, useState } from 'react';
import {
    Truck,
    MapPin,
    Phone,
    AlertTriangle,
    Calendar,
    CheckCircle2,
    ArrowRight,
    Users,
    Info,
    LifeBuoy,
    User
} from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { createClient } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

export function PolHeaderActions() {
    return (
        <div className="flex items-center">
            <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black tracking-tighter italic uppercase text-black">
                    POL
                    <span className="ml-2 not-italic font-light text-zinc-400 text-sm tracking-normal">
                        Padrão de Operação Logística
                    </span>
                </h2>
            </div>
        </div>
    );
}

interface TransitPoint {
    id: number;
    local: string;
    estados_atendidos: string[];
}

export default function PaginaPOL() {
    const [tps, setTps] = useState<TransitPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function fetchTPs() {
            const { data } = await supabase.from('transit_points').select('*').order('id');
            if (data) setTps(data);
            setLoading(false);
        }
        fetchTPs();
    }, []);

    return (
        <MainLayout title="" headerActions={<PolHeaderActions />}>
            <div className="max-w-7xl mx-auto space-y-12 pb-20 px-8">

                <hr className="border-zinc-200" />

                {/* Grid Principal */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                    {/* Coluna Esquerda: O Modelo e Contatos */}
                    <div className="space-y-10">
                        <section className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">O Modelo</h3>
                            <div className="p-6 bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 bg-zinc-100 flex items-center justify-center rounded-full font-bold">01</div>
                                    <span className="font-bold">Outbound</span>
                                </div>
                                <div className="ml-5 h-8 border-l-2 border-dashed border-zinc-200" />
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 bg-black text-white flex items-center justify-center rounded-full font-bold">TP</div>
                                    <span className="font-bold text-lg">Transit Point</span>
                                </div>
                                <div className="ml-5 h-8 border-l-2 border-dashed border-zinc-200" />
                                <div className="flex items-center gap-4 text-zinc-400">
                                    <div className="h-10 w-10 bg-zinc-100 flex items-center justify-center rounded-full font-bold text-zinc-400">02</div>
                                    <span className="font-bold">Last Mile (Cliente)</span>
                                </div>
                                <p className="text-xs text-zinc-500 pt-4 leading-relaxed">
                                    Consolidação em veículos de grande porte até o TP, seguida de desconsolidação para veículos menores para entrega final.
                                </p>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Stakeholders</h3>
                            <div className="bg-zinc-50 p-6 space-y-6 border border-zinc-200">
                                <div className="flex items-center gap-4">
                                    <Truck className="text-zinc-400" size={20} />
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-zinc-400">Operador Logístico</p>
                                        <p className="font-bold">LZN - Luizinho Transporte</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Users className="text-zinc-400" size={20} />
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-zinc-400">Responsável Interno</p>
                                        <div className='flex flex-col gap-0'>
                                            <p className="font-bold">Jorge Pires </p>
                                            <span className='text-zinc-400 font-medium text-xs'>jorge.pires@ambar.tech</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 bg-amber-50 border border-amber-200 flex items-start gap-3">
                                    <AlertTriangle className="text-amber-600" size={18} />
                                    <p className="text-[11px] text-amber-900 leading-tight">
                                        <strong>ATENÇÃO:</strong> Qualquer divergência ou problema deve ser relatado via <strong>SAC</strong>.
                                    </p>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Coluna Central/Direita: Fluxo de Funcionamento (3 Passos) */}
                    <div className="lg:col-span-2 space-y-8">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Fluxo de Funcionamento</h3>

                        <div className="relative space-y-6">

                            {/* Passo 1 */}
                            <div className="flex gap-6 group">
                                <div className="flex flex-col items-center">
                                    <div className="h-12 w-12 bg-black text-white flex items-center justify-center text-xl font-black italic">1</div>
                                    <div className="flex-1 w-0.5 bg-zinc-200 my-2" />
                                </div>
                                <div className="pb-8">
                                    <h4 className="text-xl font-black uppercase italic mb-2">Janela de Faturamento</h4>
                                    <p className="text-zinc-600 leading-relaxed">
                                        Faturamento aberto <strong>7 dias antes</strong> da coleta.
                                        O limite máximo para faturamento de pedidos é até <strong>D-1</strong> da data programada.
                                    </p>
                                </div>
                            </div>

                            {/* Passo 2 */}
                            <div className="flex gap-6 group">
                                <div className="flex flex-col items-center">
                                    <div className="h-12 w-12 bg-black text-white flex items-center justify-center text-xl font-black italic">2</div>
                                    <div className="flex-1 w-0.5 bg-zinc-200 my-2" />
                                </div>
                                <div className="pb-8">
                                    <h4 className="text-xl font-black uppercase italic mb-2">Check de Potencial Diario</h4>
                                    <p className="text-zinc-600 leading-relaxed mb-4">
                                        Análise diária do volume faturado + volume em carteira por <strong>UF / Transit Point</strong>.
                                    </p>
                                    <div className="bg-white border-l-4 border-black p-4 shadow-sm">
                                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-tighter">
                                            <ArrowRight size={14} /> Tomada de Decisão
                                        </div>
                                        <p className="text-sm text-zinc-500 mt-1 italic">
                                            Definição entre antecipar uma janela existente ou criar uma janela extra.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Passo 3 */}
                            <div className="flex gap-6 group">
                                <div className="flex flex-col items-center">
                                    <div className="h-12 w-12 bg-black text-white flex items-center justify-center text-xl font-black italic">3</div>
                                </div>
                                <div>
                                    <h4 className="text-xl font-black uppercase italic mb-2">Análise D+1 (Pós-Coleta)</h4>
                                    <p className="text-zinc-600 leading-relaxed mb-6">
                                        No dia seguinte à coleta, analisamos o que <strong>"ficou para trás"</strong> (pedidos faturados mas não expedidos).
                                    </p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {[
                                            'Antecipar próxima janela',
                                            'Criar janela extra',
                                            'Atendimento via TP alternativo',
                                            'Analise e comunicação customizada'
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center gap-3 p-3 border border-zinc-100 bg-white group-hover:border-zinc-300 transition-all">
                                                <CheckCircle2 size={16} className="text-zinc-300" />
                                                <span className="text-sm font-medium">{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Tabela de Transit Points */}
                        <div className="mt-12 space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Nossos Transit Points</h3>
                            <div className="bg-white border border-zinc-200 overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-zinc-50 text-[10px] font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-200">
                                        <tr>
                                            <th className="px-6 py-4">Localidade</th>
                                            <th className="px-6 py-4">Estados Atendidos</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100">
                                        {loading ? (
                                            <tr><td colSpan={2} className="p-6"><Skeleton className="h-4 w-full" /></td></tr>
                                        ) : tps.map(tp => (
                                            <tr key={tp.id} className="hover:bg-zinc-50/50 transition-colors">
                                                <td className="px-6 py-4 font-bold flex items-center gap-2">
                                                    <MapPin size={14} className="text-zinc-400" />
                                                    TP-{tp.id} - {tp.local}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-2 flex-wrap">
                                                        {tp.estados_atendidos?.map(uf => (
                                                            <span key={uf} className="px-2 py-0.5 bg-zinc-100 text-[10px] font-bold rounded">
                                                                {uf}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}