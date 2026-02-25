'use client';

import { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { X, AlertCircle, BarChart3, Globe, ArrowRight, Truck, Loader2, Package, ArrowUp, ArrowDown } from "lucide-react";
import { useEstadoMetrics } from "@/hooks/useEstadoMetrics";
import MainLayout from '@/components/layout/MainLayout';
import { usePathname } from 'next/navigation';

const MapaBrasil = dynamic(() => import('@/components/maps/map'), {
    ssr: false,
    loading: () => <LoadingSpinner />
});

const GEOJSON_URL = "https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson";

const ufMapper: Record<string, string> = {
    "Acre": "AC", "Alagoas": "AL", "Amapá": "AP", "Amazonas": "AM", "Bahia": "BA",
    "Ceará": "CE", "Distrito Federal": "DF", "Espírito Santo": "ES", "Goiás": "GO",
    "Maranhão": "MA", "Mato Grosso": "MT", "Mato Grosso do Sul": "MS", "Minas Gerais": "MG",
    "Pará": "PA", "Paraíba": "PB", "Paraná": "PR", "Pernambuco": "PE", "Piauí": "PI",
    "Rio de Janeiro": "RJ", "Rio Grande do Norte": "RN", "Rio Grande do Sul": "RS",
    "Rondônia": "RO", "Roraima": "RR", "Santa Catarina": "SC", "São Paulo": "SP",
    "Sergipe": "SE", "Tocantins": "TO"
};

const ESTADO_BASELINES: Record<string, number> = {
    "AL": 0.1212, "AM": 0.2284, "BA": 0.1484, "CE": 0.1277, "DF": 0.0878,
    "ES": 0.1508, "GO": 0.0937, "MA": 0.2372, "MG": 0.0998, "MS": 0.1340,
    "MT": 0.1290, "PA": 0.2305, "PB": 0.1777, "PE": 0.1250, "PI": 0.2165,
    "PR": 0.0917, "RJ": 0.1076, "RN": 0.1645, "RO": 0.4342, "RS": 0.1249,
    "SC": 0.0799, "SE": 0.1158, "SP": 0.0534, "TO": 0.2909
};

const ufToName = Object.fromEntries(Object.entries(ufMapper).map(([k, v]) => [v, k]));

export default function MapaPerformance() {
    const [selectedState, setSelectedState] = useState<string | null>(null);
    const [notServed, setNotServed] = useState<string | null>(null);
    const [geojsonData, setGeojsonData] = useState<any>(null);
    const pathname = usePathname();

    useEffect(() => {
        fetch(GEOJSON_URL)
            .then(res => res.json())
            .then(data => setGeojsonData(data))
            .catch(err => console.error("Erro ao carregar mapa:", err));
    }, []);

    const estadosAtendidos = useMemo(() => [
        'MA', 'PI', 'CE', 'RN', 'PB', 'PE', 'AL', 'SE', 'BA',
        'AM', 'RR', 'AP', 'PA', 'TO', 'RO', 'AC', 'RJ', 'ES'
    ], []);

    const { data, loading } = useEstadoMetrics(selectedState);
    const { resumo, carregamentos } = data;

    const handleStateClick = (uf: string, name: string) => {
        if (uf && estadosAtendidos.includes(uf)) {
            setSelectedState(uf);
            setNotServed(null);
        } else {
            setNotServed(name);
        }
    };

    const currentBaseline = useMemo(() => {
        if (!selectedState) return 0.15;
        return ESTADO_BASELINES[selectedState] ?? 0.15;
    }, [selectedState]);

    return (
        <MainLayout title="Performance Geográfica">
            <div className="flex h-[calc(100vh-64px)] bg-[#F6F6F6] overflow-hidden font-sans">
                <div className="grid grid-cols-12 w-full">

                    {/* MAPA OPERACIONAL */}
                    <section className="col-span-7 relative border-r border-zinc-200 bg-[#F0F0F0]">
                        <div className="absolute top-10 right-10 z-[50] pointer-events-none">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-600" />
                                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Logistics Hub Monitor</span>
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight text-black">Rede Brasil</h1>
                        </div>

                        <div className="absolute inset-0 z-0" key={pathname}>
                            <MapaBrasil
                                geojsonData={geojsonData}
                                selectedState={selectedState}
                                estadosAtendidos={estadosAtendidos}
                                ufMapper={ufMapper}
                                onStateClick={handleStateClick}
                            />
                        </div>

                        <div className="absolute bottom-10 left-10 flex gap-5 bg-white p-4 border border-zinc-100 shadow-sm z-[50]">
                            <LegendItem color="bg-black" label="Ativo" />
                            <LegendItem color="bg-[#276EF1]" label="Selecionado" />
                            <LegendItem color="bg-zinc-200" label="Off-network" />
                        </div>
                    </section>

                    {/* PAINEL DE DADOS */}
                    <section className="col-span-5 flex flex-col bg-white shadow-xl z-[60] overflow-hidden">
                        {!selectedState ? (
                            <EmptyState />
                        ) : (
                            <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-2 duration-400">
                                <header className="p-8 bg-black text-white shrink-0">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-white/10 rounded">
                                                <BarChart3 size={16} />
                                            </div>
                                            <span className="text-[11px] font-medium uppercase tracking-[1px] opacity-70">Performance Consolidada</span>
                                        </div>
                                        <button onClick={() => setSelectedState(null)} className="text-white/40 hover:text-white transition-colors">
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <div className="flex items-end gap-3">
                                        <h2 className="text-5xl font-semibold tracking-tighter leading-none">{selectedState}</h2>
                                        <div className="pb-1">
                                            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest leading-none mb-1">Estado</p>
                                            <p className="text-white font-medium text-sm leading-none">{ufToName[selectedState]}</p>
                                        </div>
                                    </div>
                                </header>

                                <div className="flex-1 overflow-y-auto bg-[#F6F6F6]">
                                    {loading ? <LoadingSkeleton /> : (
                                        <div className="p-8 space-y-6">
                                            {/* CARDS DE RESUMO */}
                                            <div className="space-y-4">
                                                <div className="bg-white p-6 border border-zinc-200 shadow-sm">
                                                    <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Faturamento Total do Estado</span>
                                                    <div className="flex justify-between items-end mt-2">
                                                        <p className="text-3xl font-semibold text-black tracking-tight">{fCurrency(resumo?.fat_bruto_total ?? 0)}</p>
                                                        <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold mb-1">
                                                            <span>{resumo?.qtd_pdvs} PDVs</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    {(() => {
                                                        const eficienciaAtual = resumo?.custo_liq_vs_fat_liq ?? 0;
                                                        const diff = eficienciaAtual - currentBaseline;
                                                        const percentDiff = currentBaseline !== 0 ? (diff / currentBaseline) * 100 : 0;
                                                        const isHigher = diff > 0;

                                                        return (
                                                            <UberStatCard
                                                                label="Eficiência Média"
                                                                value={`${(eficienciaAtual * 100).toFixed(1)}%`}
                                                                status={eficienciaAtual > currentBaseline ? "danger" : "success"}
                                                                subValue={`Base: ${(currentBaseline * 100).toFixed(1)}%`}
                                                                trend={{
                                                                    diff: percentDiff,
                                                                    isHigher: isHigher
                                                                }}
                                                            />
                                                        );
                                                    })()}
                                                    <UberStatCard
                                                        label="Volume Coletado"
                                                        value={`${resumo?.cubagem_total?.toFixed(2) ?? '0.00'} m³`}
                                                        subValue="Volume Total"
                                                    />
                                                </div>
                                            </div>

                                            {/* LISTAGEM DE CARREGAMENTOS */}
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Detalhamento por Carregamento</h3>
                                                    <span className="text-[10px] bg-zinc-200 px-2 py-0.5 rounded font-bold">{carregamentos.length}</span>
                                                </div>

                                                <div className="space-y-2">
                                                    {carregamentos.map((item) => (
                                                        <div key={item.carregamento_id} className="bg-white border border-zinc-200 p-4 hover:border-zinc-400 transition-colors group">
                                                            <div className="flex justify-between items-start mb-3">
                                                                <div>
                                                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">ID Carregamento</p>
                                                                    <p className="font-mono text-sm font-bold text-black">#{item.carregamento_id.toString().padStart(5, '0')} TP-{item.carregamentos?.estado_destino}</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">Faturamento</p>
                                                                    <p className="text-sm font-bold text-black">{fCurrency(item.fat_bruto_total)}</p>
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-zinc-50">
                                                                <div>
                                                                    <p className="text-[9px] uppercase text-zinc-400 font-bold">Volume</p>
                                                                    <p className="text-xs font-medium text-zinc-700">{item.cubagem_total.toFixed(2)} m³</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[9px] uppercase text-zinc-400 font-bold">R$/m³</p>
                                                                    <p className="text-xs font-medium text-zinc-700">{fCurrency(item.real_m3_fat)}</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-[9px] uppercase text-zinc-400 font-bold">Efficiency</p>
                                                                    <p className={`text-xs font-bold ${item.custo_liq_vs_fat_liq > currentBaseline ? 'text-red-500' : 'text-emerald-600'}`}>
                                                                        {(item.custo_liq_vs_fat_liq * 100).toFixed(1)}%
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <footer className="p-6 bg-white border-t border-zinc-200 shrink-0">
                                    <button className="w-full bg-black text-white py-4 text-sm font-semibold hover:bg-zinc-800 transition-all flex items-center justify-center gap-2">
                                        Exportar Dados de {selectedState}
                                    </button>
                                </footer>
                            </div>
                        )}
                    </section>
                </div>

                {/* TOAST DE ALERTA */}
                {notServed && (
                    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[2000] animate-in slide-in-from-bottom-2">
                        <div className="bg-zinc-900 text-white px-5 py-3 rounded shadow-2xl flex items-center gap-4">
                            <AlertCircle size={16} className="text-red-400" />
                            <span className="text-xs font-medium">{notServed} não possui operação ativa na malha.</span>
                            <button onClick={() => setNotServed(null)} className="ml-4 opacity-50 hover:opacity-100">
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}

// --- AUXILIARES (MANTIDOS) ---

function LoadingSpinner() {
    return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-[#F0F0F0] gap-3">
            <Loader2 className="animate-spin text-zinc-400" size={32} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Carregando Mapa...</span>
        </div>
    );
}

function LoadingSkeleton() {
    return (
        <div className="p-8 space-y-4">
            <div className="h-32 w-full bg-white animate-pulse border border-zinc-100" />
            <div className="grid grid-cols-2 gap-4">
                <div className="h-24 bg-white animate-pulse border border-zinc-100" />
                <div className="h-24 bg-white animate-pulse border border-zinc-100" />
            </div>
            <div className="h-64 w-full bg-white animate-pulse border border-zinc-100" />
        </div>
    );
}

function UberStatCard({
    label,
    value,
    subValue,
    status,
    trend
}: {
    label: string,
    value: string,
    subValue?: string,
    status?: 'success' | 'danger',
    trend?: { diff: number, isHigher: boolean }
}) {
    const statusColor = status === 'danger' ? 'text-red-600' : 'text-black';
    return (
        <div className="bg-white p-6 border border-zinc-200 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">{label}</p>
            <div className="flex items-center gap-2">
                <p className={`text-2xl font-semibold tracking-tight ${statusColor}`}>{value}</p>

                {trend && (
                    <span className={`flex items-center gap-0.5 px-1 rounded text-[10px] font-bold ${trend.isHigher ? 'text-red-500 bg-red-50' : 'text-emerald-600 bg-emerald-50'}`}>
                        {trend.isHigher ? <ArrowUp size={10} strokeWidth={3} /> : <ArrowDown size={10} />}
                        {Math.abs(trend.diff).toFixed(1)}%
                    </span>
                )}
            </div>
            {subValue && <p className="text-[10px] text-zinc-400 mt-1 uppercase font-medium">{subValue}</p>}
        </div>
    );
}

function LegendItem({ color, label }: { color: string, label: string }) {
    return (
        <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-none ${color}`} />
            <span className="text-[10px] font-bold uppercase tracking-tight text-zinc-500">{label}</span>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-20 bg-white">
            <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-6 border border-zinc-100">
                <Globe className="text-zinc-300" size={28} />
            </div>
            <h3 className="text-lg font-bold text-black uppercase tracking-tight mb-2">Selecione uma regional</h3>
            <p className="text-zinc-400 text-xs max-w-[200px] leading-relaxed font-medium">Clique em um estado ativo para visualizar os KPIs e lista de carregamentos.</p>
        </div>
    );
}

function fCurrency(v: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}