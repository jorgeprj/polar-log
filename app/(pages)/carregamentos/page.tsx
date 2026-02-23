'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Truck, Filter, Map, AlertTriangle, Package, BoxSelect, X, Info, CheckCircle2, Search } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { createClient } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// --- Interfaces ---
interface Carga {
    uf: string;
    cubagem: number;
    faturamento: number;
    volume_caixas: number;
}

interface Modal {
    codigo: string;
    capacidade_m3: number;
}

interface TransitPoint {
    id: number;
    local: string;
    estados_atendidos: string[];
}

interface CustoTP {
    transit_point: string;
    modal: string;
    media_custo_liq: number;
    media_percentual_liq_bruto: number;
}

// Interface para a View de Performance solicitada
interface PerformanceEstado {
    estado: string;
    modal: string;
    custo_liq_vs_fat_liq: number;
}

const REGIOES = {
    'SUL': ['PR', 'SC', 'RS'],
    'SUDESTE': ['SP', 'RJ', 'MG', 'ES'],
    'CENTRO-OESTE': ['MS', 'MT', 'GO', 'DF'],
    'NORDESTE': ['BA', 'PE', 'CE', 'RN', 'PB', 'AL', 'SE', 'MA', 'PI'],
    'NORTE': ['AM', 'PA', 'RO', 'RR', 'AC', 'TO', 'AP']
};

export default function SimuladorOperacionalAvancado() {
    const supabase = createClient();

    const [loading, setLoading] = useState(true);
    const [cargas, setCargas] = useState<Carga[]>([]);
    const [tps, setTps] = useState<TransitPoint[]>([]);
    const [modais, setModais] = useState<Modal[]>([]);
    const [custosRef, setCustosRef] = useState<CustoTP[]>([]);
    const [performanceRef, setPerformanceRef] = useState<PerformanceEstado[]>([]);

    const [selectedModalCode, setSelectedModalCode] = useState<string>('');
    const [selectedUfs, setSelectedUfs] = useState<string[]>([]);

    useEffect(() => {
        async function fetchData() {
            const [cargasRes, tpsRes, custosRes, modaisRes, perfRes] = await Promise.all([
                supabase.from('cargas').select('uf, cubagem, faturamento, volume_caixas').order('uf'),
                supabase.from('transit_points').select('id, local, estados_atendidos').order('id'),
                supabase.from('view_custos_por_tp').select('*'),
                supabase.from('modais').select('codigo, capacidade_m3'),
                // Buscamos a eficiência real da view solicitada
                supabase.from('view_desempenho_estado_carregamento').select('estado, modal, custo_liq_vs_fat_liq')
            ]);

            if (cargasRes.data) setCargas(cargasRes.data);
            if (tpsRes.data) setTps(tpsRes.data);
            if (custosRes.data) setCustosRef(custosRes.data);
            if (perfRes.data) setPerformanceRef(perfRes.data);
            if (modaisRes.data) {
                setModais(modaisRes.data);
                if (modaisRes.data.length > 0) setSelectedModalCode(modaisRes.data[0].codigo);
            }
            setLoading(false);
        }
        fetchData();
    }, []);

    // --- Lógica de Simulação Inteligente ---
    const simulacao = useMemo(() => {
        const selecionadas = cargas.filter(c => selectedUfs.includes(c.uf));
        const modalAtual = modais.find(m => m.codigo === selectedModalCode) || { capacidade_m3: 0 };

        // 1. Encontrar TPs que atendem TODOS os estados selecionados
        const tpsCandidatos = tps.filter(tp => 
            selectedUfs.every(uf => tp.estados_atendidos.includes(uf))
        );

        // 2. Buscar o melhor custo de frete (Frete Peso/Valor do TP)
        let melhorTpCusto: CustoTP | null = null;
        if (tpsCandidatos.length > 0 && selectedUfs.length > 0) {
            const nomesCandidatos = tpsCandidatos.map(t => t.local);
            const custosCandidatos = custosRef
                .filter(c => nomesCandidatos.includes(c.transit_point) && c.modal === selectedModalCode)
                .sort((a, b) => a.media_custo_liq - b.media_custo_liq);

            melhorTpCusto = custosCandidatos[0] || null;
        }

        // 3. Cálculo de Eficiência Real (Média ponderada ou simples dos estados selecionados)
        const perfEstadosSelecionados = performanceRef.filter(p => 
            selectedUfs.includes(p.estado) && p.modal === selectedModalCode
        );

        // Se houver dados históricos, usamos a média da coluna custo_liq_vs_fat_liq
        const eficienciaRealMedia = perfEstadosSelecionados.length > 0
            ? perfEstadosSelecionados.reduce((acc, curr) => acc + curr.custo_liq_vs_fat_liq, 0) / perfEstadosSelecionados.length
            : 0;

        // 4. Cálculos de Volumes e Valores
        const cubagemTotal = selecionadas.reduce((acc, curr) => acc + (Number(curr.cubagem) || 0), 0);
        const caixasTotal = selecionadas.reduce((acc, curr) => acc + (Number(curr.volume_caixas) || 0), 0);
        const fatBrutoTotal = selecionadas.reduce((acc, curr) => acc + (Number(curr.faturamento) || 0), 0);

        // Cálculo do Faturamento Líquido (Simulado com base no histórico se disponível)
        const fatLiquidoTotal = fatBrutoTotal * 0.85; // Mantemos o padrão de 15% impostos/deduções

        return {
            cubagemTotal,
            caixasTotal,
            faturamentoLiquido: fatLiquidoTotal,
            custoEsperado: melhorTpCusto?.media_custo_liq || 0,
            nomeTp: melhorTpCusto?.transit_point || null,
            // A eficiência agora prioriza o dado da view_desempenho_estado_carregamento
            performanceReal: eficienciaRealMedia * 100, 
            capacidadeModal: modalAtual.capacidade_m3,
            isOverloaded: modalAtual.capacidade_m3 > 0 && cubagemTotal > modalAtual.capacidade_m3,
            hasRoute: !!melhorTpCusto,
            multiplesTps: tpsCandidatos.length > 1
        };
    }, [cargas, selectedUfs, selectedModalCode, custosRef, performanceRef, tps, modais]);

    if (loading) return <div className="p-20"><Skeleton className="h-96 w-full" /></div>;

    return (
        <MainLayout title="">
            <div className="min-h-screen bg-[#F6F6F6] text-black pb-20">
                <div className="max-w-7xl mx-auto px-6 pt-12 space-y-10">

                    {/* Header */}
                    <div className="flex justify-between items-end border-b border-zinc-200 pb-8">
                        <header className="space-y-2">
                            <div className="flex items-center gap-2 text-zinc-400">
                                <BoxSelect size={16} />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Polar Log</span>
                            </div>
                            <h1 className="text-6xl font-bold tracking-tighter">Carga.</h1>
                        </header>
                        
                        <div className="flex gap-4">
                            <div className="bg-white border border-zinc-200 p-6 shadow-sm min-w-[200px]">
                                <span className="text-[10px] font-black uppercase text-zinc-400 block mb-1 tracking-widest">TP Otimizado</span>
                                <div className="text-xl font-bold tracking-tighter flex items-center gap-2">
                                    {simulacao.nomeTp ? (
                                        <><CheckCircle2 size={18} className="text-green-500" /> {simulacao.nomeTp}</>
                                    ) : (
                                        <span className="text-zinc-300">Aguardando...</span>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white border border-zinc-200 p-6 shadow-sm min-w-[240px]">
                                <span className="text-[10px] font-black uppercase text-zinc-400 block mb-1 tracking-widest">Modal Ativo</span>
                                <div className="text-3xl font-bold tracking-tighter">{selectedModalCode}</div>
                                <div className="text-[10px] font-bold text-zinc-500 uppercase mt-2 flex items-center gap-2">
                                    <div className="h-2 flex-1 bg-zinc-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all ${simulacao.isOverloaded ? 'bg-red-500' : 'bg-black'}`}
                                            style={{ width: `${Math.min((simulacao.cubagemTotal / (simulacao.capacidadeModal || 1)) * 100, 100)}%` }}
                                        />
                                    </div>
                                    <span>{simulacao.capacidadeModal}m³</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filtros e Controles */}
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-[1px] bg-zinc-200 border border-zinc-200 shadow-sm">
                        <FilterBox label="Modal Operacional" icon={<Filter size={14} />}>
                            <Select value={selectedModalCode} onValueChange={setSelectedModalCode}>
                                <SelectTrigger className="w-full border-none bg-transparent p-0 h-auto font-bold text-base focus:ring-0 shadow-none">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {modais.map(m => (
                                        <SelectItem key={m.codigo} value={m.codigo}>
                                            {m.codigo} ({m.capacidade_m3}m³)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FilterBox>

                        <FilterBox
                            label="Atalhos de Região"
                            icon={<Map size={14} />}
                            onClear={selectedUfs.length > 0 ? () => setSelectedUfs([]) : undefined}
                        >
                            <div className="flex flex-wrap gap-1">
                                {Object.keys(REGIOES).map(reg => (
                                    <button
                                        key={reg}
                                        onClick={() => {
                                            const ufs = REGIOES[reg as keyof typeof REGIOES];
                                            setSelectedUfs(prev => Array.from(new Set([...prev, ...ufs])));
                                        }}
                                        className="text-[9px] font-black px-2 py-1 border border-zinc-200 hover:bg-black hover:text-white transition-all uppercase rounded-sm"
                                    >
                                        {reg}
                                    </button>
                                ))}
                            </div>
                        </FilterBox>
                    </section>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-4">
                            <h3 className="text-[11px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                                <Package size={14} /> Inventário de Carga ({selectedUfs.length} UFs)
                            </h3>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {cargas.map(c => {
                                    const isSelected = selectedUfs.includes(c.uf);
                                    return (
                                        <button
                                            key={c.uf}
                                            onClick={() => setSelectedUfs(prev =>
                                                isSelected ? prev.filter(u => u !== c.uf) : [...prev, c.uf]
                                            )}
                                            className={`p-4 border text-left transition-all relative ${isSelected
                                                    ? 'bg-black border-black text-white shadow-xl z-10'
                                                    : 'bg-white border-zinc-200 text-zinc-900 hover:border-zinc-400 opacity-60 hover:opacity-100'
                                                }`}
                                        >
                                            <div className="text-xs font-black mb-3 flex justify-between items-center">
                                                {c.uf}
                                                {isSelected && <CheckCircle2 size={12} className="text-white" />}
                                            </div>
                                            <div className="space-y-1">
                                                <MetricLine label="VOL" value={`${Number(c.cubagem).toFixed(1)}m³`} />
                                                <MetricLine label="FAT" value={fCurrencyShort(Number(c.faturamento))} />
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Coluna de Métricas com Eficiência da View */}
                        <div className="space-y-[1px] bg-zinc-200 border border-zinc-200 shadow-2xl self-start sticky top-6">
                            <SummaryItem
                                label="Cubagem Planejada"
                                value={`${simulacao.cubagemTotal.toFixed(2)} m³`}
                                alert={simulacao.isOverloaded}
                            />

                            {selectedUfs.length === 0 ? (
                                <div className="p-6 bg-white text-zinc-400 text-[10px] font-bold uppercase">
                                    Selecione os estados para simular
                                </div>
                            ) : (
                                <>
                                    <SummaryItem
                                        label="Custo de Frete (Simulado)"
                                        value={fCurrency(simulacao.custoEsperado)}
                                        sublabel={`Base: Transit Point ${simulacao.nomeTp || 'Não definido'}`}
                                    />
                                    
                                    <SummaryItem 
                                        label="Eficiência Real (Histórico)" 
                                        value={simulacao.performanceReal > 0 ? `${simulacao.performanceReal.toFixed(2)}%` : "S/ Dados"} 
                                        sublabel="Coluna: custo_liq_vs_fat_liq"
                                        dark 
                                    />
                                    
                                    <div className="p-6 bg-zinc-50 border-t border-zinc-100">
                                        <div className="flex items-start gap-3">
                                            <Info size={14} className="text-zinc-400 mt-0.5" />
                                            <p className="text-[9px] font-medium text-zinc-500 leading-relaxed uppercase">
                                                A eficiência real é baseada na média histórica da View para os estados e modal selecionados.
                                            </p>
                                        </div>
                                    </div>
                                </>
                            )}

                            <SummaryItem label="Total de Volumes (CX)" value={simulacao.caixasTotal.toLocaleString()} light />
                        </div>
                    </div>

                    {/* Alerta de Excesso */}
                    {simulacao.isOverloaded && (
                        <div className="p-6 bg-red-600 text-white flex items-center justify-between shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
                            <div className="flex items-center gap-4">
                                <AlertTriangle size={24} />
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">Excesso de Carga</p>
                                    <p className="text-sm font-bold opacity-90">O volume selecionado excede a capacidade do {selectedModalCode}.</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-black">+{(simulacao.cubagemTotal - simulacao.capacidadeModal).toFixed(1)}m³</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}

// --- Componentes Auxiliares ---

function MetricLine({ label, value }: { label: string, value: string | number }) {
    return (
        <div className="flex justify-between text-[10px] font-bold opacity-70 uppercase tracking-tighter">
            <span>{label}</span>
            <span>{value}</span>
        </div>
    );
}

function FilterBox({ label, icon, children, onClear }: { label: string, icon: React.ReactNode, children: React.ReactNode, onClear?: () => void }) {
    return (
        <div className="bg-white p-6 space-y-2 relative group transition-colors hover:bg-zinc-50/50">
            <div className="flex justify-between items-center">
                <label className="text-[9px] font-black uppercase text-zinc-400 tracking-widest flex items-center gap-2">
                    {icon} {label}
                </label>
                {onClear && (
                    <button
                        onClick={onClear}
                        className="text-[9px] font-black text-red-500 hover:text-red-700 flex items-center gap-1 uppercase transition-all"
                    >
                        <X size={10} /> Limpar
                    </button>
                )}
            </div>
            {children}
        </div>
    );
}

function SummaryItem({ label, value, sublabel, alert, dark, light }: any) {
    let bgColor = "bg-white text-black";
    if (dark) bgColor = "bg-black text-white";
    if (light) bgColor = "bg-zinc-50 text-zinc-500";

    return (
        <div className={`p-6 transition-all ${bgColor}`}>
            <span className={`text-[9px] font-black uppercase tracking-widest ${dark ? 'text-zinc-500' : 'text-zinc-400'}`}>{label}</span>
            <div className={`text-3xl font-bold tracking-tighter mt-1 ${alert ? 'text-red-600' : ''}`}>{value}</div>
            {sublabel && <div className="text-[9px] font-bold opacity-40 uppercase mt-1">{sublabel}</div>}
        </div>
    );
}

const fCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const fCurrencyShort = (v: number) => v >= 1000 ? `R$ ${(v / 1000).toFixed(1)}k` : `R$ ${v.toFixed(0)}`;