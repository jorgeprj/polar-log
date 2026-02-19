'use client';

import { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { X, AlertCircle, BarChart3, Globe, ArrowRight, Truck, Loader2 } from "lucide-react";
import { useEstadoMetrics } from "@/hooks/useEstadoMetrics";
import MainLayout from '@/components/layout/MainLayout';
import { usePathname } from 'next/navigation';

// Carregamento dinâmico do mapa para evitar erros de "appendChild" e SSR
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

    // Se o seu hook já foi atualizado para retornar o acumulado conforme conversamos:
    const { data: metrics, loading } = useEstadoMetrics(selectedState);

    const handleStateClick = (uf: string, name: string) => {
        if (uf && estadosAtendidos.includes(uf)) {
            setSelectedState(uf);
            setNotServed(null);
        } else {
            setNotServed(name);
        }
    };

    return (
        <MainLayout title="Performance Geográfica">
            <div className="flex h-[calc(100vh-64px)] bg-[#F6F6F6] overflow-hidden font-sans">
                <div className="grid grid-cols-12 w-full">

                    {/* MAPA OPERACIONAL */}
                    <section className="col-span-7 relative border-r border-zinc-200 bg-[#F0F0F0]">
                        <div className="absolute top-10 left-10 z-[50] pointer-events-none">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 rounded-full bg-blue-600" />
                                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Logistics Hub Monitor</span>
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight text-black">Rede Brasil</h1>
                        </div>

                        <div className="absolute inset-0 z-0" key={pathname}> {/* Container extra de segurança */}
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
                    <section className="col-span-5 flex flex-col bg-white shadow-xl z-[60]">
                        {!selectedState ? (
                            <EmptyState />
                        ) : (
                            <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-2 duration-400">
                                <header className="p-8 bg-black text-white">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-white/10 rounded">
                                                <BarChart3 size={16} />
                                            </div>
                                            <span className="text-[11px] font-medium uppercase tracking-[1px] opacity-70">Performance Acumulada</span>
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

                                <div className="p-8 space-y-4 overflow-y-auto bg-[#F6F6F6] flex-1">
                                    {loading ? <LoadingSkeleton /> : (
                                        <>
                                            <div className="bg-white p-6 border border-zinc-200 shadow-sm">
                                                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Faturamento Bruto Total</span>
                                                <div className="flex justify-between items-end mt-2">
                                                    <p className="text-3xl font-semibold text-black tracking-tight">{fCurrency(metrics?.fat_bruto_total ?? 0)}</p>
                                                    <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold mb-1">
                                                        <ArrowRight size={14} />
                                                        <span>On Track</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <UberStatCard
                                                    label="Eficiência Média"
                                                    value={`${((metrics?.custo_liq_vs_fat_liq ?? 0) * 100).toFixed(1)}%`}
                                                    status={(metrics?.custo_liq_vs_fat_liq ?? 0) > 0.15 ? "danger" : "success"}
                                                />
                                                <UberStatCard
                                                    label="Drop Size Médio"
                                                    value={`${metrics?.drop_size?.toFixed(2) ?? '0.00'} m³`}
                                                    subValue="Consolidado PDVs"
                                                />
                                            </div>
                                            <div className="p-6 bg-white border border-zinc-200 mt-4 flex gap-4">
                                                <div className="p-2 bg-zinc-100 h-fit rounded">
                                                    <Truck size={18} className="text-black" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-black uppercase mb-1">Densidade de Carga</p>
                                                    <p className="text-zinc-500 text-sm leading-relaxed">
                                                        A regional opera com um faturamento médio de <span className="text-black font-semibold">{fCurrency(metrics?.real_m3_fat ?? 0)}/m³</span>.
                                                    </p>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <footer className="p-6 bg-white border-t border-zinc-200">
                                    <button className="w-full bg-black text-white py-4 text-sm font-semibold hover:bg-zinc-800 transition-all">
                                        Ver Relatório Detalhado
                                    </button>
                                </footer>
                            </div>
                        )}
                    </section>
                </div>

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

// --- AUXILIARES ---

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
        <div className="space-y-4">
            <div className="h-24 w-full bg-white animate-pulse border border-zinc-100" />
            <div className="grid grid-cols-2 gap-4">
                <div className="h-24 bg-white animate-pulse border border-zinc-100" />
                <div className="h-24 bg-white animate-pulse border border-zinc-100" />
            </div>
        </div>
    );
}

function UberStatCard({ label, value, subValue, status }: { label: string, value: string, subValue?: string, status?: 'success' | 'danger' }) {
    const statusColor = status === 'danger' ? 'text-red-600' : 'text-black';
    return (
        <div className="bg-white p-6 border border-zinc-200 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">{label}</p>
            <p className={`text-2xl font-semibold tracking-tight ${statusColor}`}>{value}</p>
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
            <p className="text-zinc-400 text-xs max-w-[200px] leading-relaxed font-medium">Clique em um estado ativo para visualizar os KPIs de performance.</p>
        </div>
    );
}

function fCurrency(v: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}