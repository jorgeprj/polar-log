'use client';

import React, { useEffect, useState } from 'react';
import {
    Truck,
    MapPin,
    AlertTriangle,
    CheckCircle2,
    ArrowRight,
    Users,
    Timer,
    Calculator,
    TrendingDown,
    Map as MapIcon,
    Info
} from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { createClient } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/contexts/AuthContext';

// --- Tipagens e Mocks para o Estudo ---

interface EstudoCustos {
    uf: string;
    custosPorTP: Record<string, number>;
    inviaveis?: string[];
}

const TPS_NORDESTE = ['BA', 'SE', 'PE', 'RN', 'CE', 'PI'];

const DADOS_ESTUDO: EstudoCustos[] = [
    { uf: 'AL', custosPorTP: { 'BA': 1565, 'SE': 904, 'PE': 904, 'RN': 1565, 'CE': 2566, 'PI': 2921 }, inviaveis: ['PE'] },
    { uf: 'BA', custosPorTP: { 'BA': 633, 'SE': 1281, 'PE': 1428, 'RN': 2665, 'CE': 2665, 'PI': 2665 } },
    { uf: 'CE', custosPorTP: { 'BA': 2138, 'SE': 2138, 'PE': 1782, 'RN': 1445, 'CE': 684, 'PI': 1445 } },
    { uf: 'MA', custosPorTP: { 'BA': 3708, 'SE': 3122, 'PE': 3708, 'RN': 3122, 'CE': 2690, 'PI': 1621 } },
    { uf: 'PB', custosPorTP: { 'BA': 2144, 'SE': 1470, 'PE': 728, 'RN': 728, 'CE': 1470, 'PI': 2440 } },
    { uf: 'PE', custosPorTP: { 'BA': 1797, 'SE': 1117, 'PE': 495, 'RN': 645, 'CE': 1555, 'PI': 2085 } },
    { uf: 'PI', custosPorTP: { 'BA': 2846, 'SE': 2846, 'PE': 2846, 'RN': 2846, 'CE': 1525, 'PI': 676 } },
    { uf: 'RN', custosPorTP: { 'BA': 2928, 'SE': 2184, 'PE': 906, 'RN': 696, 'CE': 1569, 'PI': 2928 } },
    { uf: 'SE', custosPorTP: { 'BA': 1476, 'SE': 730, 'PE': 1595, 'RN': 2290, 'CE': 3071, 'PI': 3071 } },
];

export function PolHeaderActions() {
    return (
        <div className="flex items-center">
            <h2 className="text-2xl font-black tracking-tighter italic uppercase text-black">
                POL
                <span className="ml-2 not-italic font-light text-zinc-400 text-sm tracking-normal">
                    Padrão de Operação Logística
                </span>
            </h2>
        </div>
    );
}

interface TransitPoint {
    id: number;
    local: string;
    estados_atendidos: string[];
    frequency: string;
}

export default function PaginaPOL() {
    const { role, isLoading: authLoading } = useAuth();
    const isAdmin = role === 'admin';
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
            <div className="max-w-7xl mx-auto pb-20 px-8 pt-4">

                <Tabs defaultValue="padrao" className="space-y-8">
                    <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
                        <TabsList className="bg-transparent h-auto p-0 gap-10 rounded-none border-b border-zinc-100 w-full justify-start overflow-visible">
                            <TabsTrigger
                                value="padrao"
                                className="
                                    group relative rounded-none border-none bg-transparent px-0 pb-4 pt-2
                                    text-[13px] font-medium tracking-tight text-zinc-500 
                                    data-[state=active]:text-black transition-all duration-300
                                    hover:text-black shadow-none
                                "
                            >
                                <span className="relative z-10">Manual de Operação</span>

                                {/* Indicador Estilo Uber: Linha que cresce do centro ou desliza */}
                                <div className="absolute bottom-0 left-0 h-[3px] w-full scale-x-0 bg-black transition-transform duration-300 group-data-[state=active]:scale-x-100" />
                            </TabsTrigger>

                            {isAdmin && (
                                <TabsTrigger
                                    value="nordeste"
                                    className="group relative rounded-none border-none bg-transparent px-0 pb-4 pt-2 text-[13px] font-medium tracking-tight text-zinc-500 data-[state=active]:text-black transition-all duration-300 hover:text-black shadow-none"
                                >
                                    <span className="relative z-10">Estudo Nordeste</span>
                                    <div className="absolute bottom-0 left-0 h-[3px] w-full scale-x-0 bg-black transition-transform duration-300 group-data-[state=active]:scale-x-100" />
                                </TabsTrigger>
                            )}
                        </TabsList>
                    </div>

                    {/* CONTEÚDO: MANUAL DE OPERAÇÃO */}
                    <TabsContent value="padrao" className="space-y-12 animate-in fade-in duration-500">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                            {/* Coluna Esquerda: O Modelo */}
                            <div className="space-y-10">
                                <section className="space-y-4">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">O Modelo</h3>
                                    <div className="p-6 bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 bg-zinc-100 flex items-center justify-center rounded-full font-bold text-sm">01</div>
                                            <span className="font-bold">Outbound</span>
                                        </div>
                                        <div className="ml-5 h-8 border-l-2 border-dashed border-zinc-200" />
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 bg-black text-white flex items-center justify-center rounded-full font-bold text-sm">TP</div>
                                            <span className="font-bold text-lg tracking-tight italic uppercase">Transit Point</span>
                                        </div>
                                        <div className="ml-5 h-8 border-l-2 border-dashed border-zinc-200" />
                                        <div className="flex items-center gap-4 text-zinc-400">
                                            <div className="h-10 w-10 bg-zinc-100 flex items-center justify-center rounded-full font-bold text-sm text-zinc-400">02</div>
                                            <span className="font-bold italic">Last Mile (Cliente)</span>
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
                                                <p className="font-bold">Jorge Pires</p>
                                                <span className='text-zinc-400 font-medium text-xs underline'>jorge.pires@ambar.tech</span>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-amber-50 border border-amber-200 flex items-start gap-3">
                                            <AlertTriangle className="text-amber-600" size={18} />
                                            <p className="text-[11px] text-amber-900 leading-tight">
                                                <strong>ATENÇÃO:</strong> Qualquer divergência deve ser relatada via <strong>SAC</strong>.
                                            </p>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {/* Coluna Central/Direita */}
                            <div className="lg:col-span-2 space-y-8">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Fluxo de Funcionamento</h3>
                                <div className="relative space-y-6">
                                    <Step number="1" title="Janela de Faturamento">
                                        Faturamento aberto <strong>7 dias antes</strong> da coleta. Limite máximo até <strong>D-1</strong> da data programada.
                                    </Step>
                                    <Step number="2" title="Check de Potencial Diario">
                                        Análise diária do volume faturado + carteira por <strong>UF / TP</strong>. Definição entre antecipar janela ou criar extra.
                                    </Step>
                                    <Step number="3" title="Análise D+1 (Pós-Coleta)" isLast>
                                        Análise do que ficou para trás. Ações: Antecipar próxima, criar extra ou TP alternativo.
                                    </Step>
                                </div>

                                {/* Tabela de TPs */}
                                <div className="mt-12 space-y-4">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Nossos Transit Points</h3>
                                    <div className="bg-white border border-zinc-200 overflow-hidden">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="bg-zinc-50 text-[10px] font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-200">
                                                <tr>
                                                    <th className="px-6 py-4">Localidade</th>
                                                    <th className="px-6 py-4">Estados Atendidos</th>
                                                    <th className="px-6 py-4">Frequência</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-100">
                                                {loading ? (
                                                    <tr><td colSpan={3} className="p-6"><Skeleton className="h-4 w-full" /></td></tr>
                                                ) : tps.map(tp => (
                                                    <tr key={tp.id} className="hover:bg-zinc-50/50 transition-colors">
                                                        <td className="px-6 py-4 font-bold flex items-center gap-2 text-sm uppercase">
                                                            <MapPin size={14} className="text-zinc-400" />
                                                            TP-{tp.id} - {tp.local}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex gap-1 flex-wrap">
                                                                {tp.estados_atendidos?.map(uf => (
                                                                    <span key={uf} className="px-2 py-0.5 bg-zinc-100 text-[9px] font-black rounded border border-zinc-200">{uf}</span>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="flex items-center gap-2 text-[11px] font-bold text-zinc-600">
                                                                <Timer size={12} /> {tp.frequency || 'Manual'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* CONTEÚDO: ESTUDO NORDESTE */}
                    <TabsContent value="nordeste" className="space-y-8 animate-in slide-in-from-bottom-2 duration-500">
                        <section className="bg-black text-white p-8 border-2 border-black shadow-[8px_8px_0px_0px_rgba(228,228,231,1)]">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black italic uppercase tracking-tighter">Matriz de Viabilidade Nordeste</h3>
                                    <p className="text-zinc-400 text-sm">
                                        Comparativo de custo estimado (Last Mile Médio + Volume Histórico) cruzando a UF de destino com os principais Transit Points operacionais.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <div className="bg-white border-2 border-black overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-zinc-50 border-b-2 border-black">
                                        <th className="px-6 py-4 border-r-2 border-black">
                                            <div className="flex items-center gap-2">
                                                <MapIcon size={16} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Origem x Destino</span>
                                            </div>
                                        </th>
                                        {TPS_NORDESTE.map(tp => (
                                            <th key={tp} className="px-4 py-4 border-r border-zinc-200 text-center">
                                                <span className="text-[9px] font-black uppercase block text-zinc-400">TP Atendimento</span>
                                                <span className="text-xs font-black italic">{tp}</span>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y-2 divide-zinc-100">
                                    {DADOS_ESTUDO.map((linha) => {
                                        const custosValidos = Object.entries(linha.custosPorTP)
                                            .filter(([tp]) => !linha.inviaveis?.includes(tp))
                                            .map(([_, valor]) => valor);
                                        const menorValorValido = Math.min(...custosValidos);

                                        return (
                                            <tr key={linha.uf} className="hover:bg-zinc-50/50 transition-colors group">
                                                <td className="px-6 py-4 border-r-2 border-black bg-zinc-50/30 group-hover:bg-zinc-50 font-black text-lg italic">
                                                    {linha.uf}
                                                </td>
                                                {TPS_NORDESTE.map(tp => {
                                                    const valor = linha.custosPorTP[tp];
                                                    const isInviavel = linha.inviaveis?.includes(tp);
                                                    const isMenor = !isInviavel && valor === menorValorValido;

                                                    return (
                                                        <td
                                                            key={tp}
                                                            className={`px-4 py-4 text-center border-r border-zinc-100 transition-all ${isInviavel
                                                                ? 'bg-red-50/50' // Fundo vermelho bem clarinho
                                                                : isMenor
                                                                    ? 'bg-emerald-50 font-black'
                                                                    : 'text-zinc-400'
                                                                }`}
                                                        >
                                                            <div className="flex flex-col items-center">
                                                                {/* O valor sempre aparece */}
                                                                <span className={`text-sm ${isInviavel
                                                                    ? 'text-red-900/60 font-medium' // Valor em vermelho escuro/opaco se inviável
                                                                    : isMenor
                                                                        ? 'text-emerald-700'
                                                                        : 'text-zinc-600'
                                                                    }`}>
                                                                    R$ {valor?.toFixed(2)}
                                                                </span>

                                                                {/* Etiquetas condicionais */}
                                                                {isInviavel ? (
                                                                    <span className="text-[8px] bg-red-600 text-white px-1 mt-1 rounded uppercase font-black tracking-tighter">
                                                                        Opção Inválida
                                                                    </span>
                                                                ) : isMenor ? (
                                                                    <span className="text-[8px] bg-emerald-600 text-white px-1 mt-1 rounded uppercase tracking-tighter">
                                                                        Melhor Opção
                                                                    </span>
                                                                ) : null}
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Legenda e Notas */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-4 border border-zinc-200 bg-zinc-50 flex gap-4 items-start">
                                <Calculator className="text-zinc-400 shrink-0" size={20} />
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase">Cálculo de Estimativa</p>
                                    <p className="text-xs text-zinc-500 leading-tight">Baseado no frete peso médio + distância do TP até o cluster principal da UF.</p>
                                </div>
                            </div>
                            <div className="p-4 border border-zinc-200 bg-zinc-50 flex gap-4 items-start">
                                <TrendingDown className="text-zinc-400 shrink-0" size={20} />
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase">Otimização de Rotas</p>
                                    <p className="text-xs text-zinc-500 leading-tight">Valores destacados em verde representam o ponto de menor custo para a operação.</p>
                                </div>
                            </div>
                            <div className="p-4 border border-zinc-200 bg-zinc-50 flex gap-4 items-start">
                                <Info className="text-zinc-400 shrink-0" size={20} />
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase">Período de Análise</p>
                                    <p className="text-xs text-zinc-500 leading-tight">Para o estudo foi utilizado o período de outubro de 2024 até maio de 2025..</p>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </MainLayout>
    );
}

// --- Componentes Internos ---

function Step({ number, title, children, isLast = false }: { number: string; title: string; children: React.ReactNode; isLast?: boolean }) {
    return (
        <div className="flex gap-6 group">
            <div className="flex flex-col items-center">
                <div className="h-12 w-12 bg-black text-white flex items-center justify-center text-xl font-black italic border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] group-hover:shadow-none transition-all">
                    {number}
                </div>
                {!isLast && <div className="flex-1 w-0.5 bg-zinc-200 my-2" />}
            </div>
            <div className={!isLast ? "pb-8" : ""}>
                <h4 className="text-xl font-black uppercase italic mb-2 tracking-tighter">{title}</h4>
                <p className="text-zinc-600 leading-relaxed text-sm">
                    {children}
                </p>
            </div>
        </div>
    );
}