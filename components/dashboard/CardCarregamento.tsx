'use client';

import { useState, useMemo } from 'react';
import { 
    MapPin, AlertTriangle, GripVertical, FileSearch, 
    Lock, Truck, Loader2, History, ArrowRight 
} from 'lucide-react';
import { ModalDetalhes } from './ModalDetalhes';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useAuth } from '@/contexts/AuthContext';
import { isBefore, parseISO, format } from 'date-fns';

interface CardProps {
    carregamento?: any;
    info?: { cubagem: number; capacidade: number; percentual: number; fatLiq?: number; custoLiq?: number; };
    cargasPendentes: any[];
    isLoading?: boolean;
    isDraggable?: boolean;
}

const STATUS_MAP: Record<string, any> = {
    confirmado: { border: 'border-l-emerald-500', dot: 'bg-emerald-500', label: 'Confirmado', pulse: true },
    previsto: { border: 'border-l-zinc-900', dot: 'bg-zinc-300', label: 'Agendado' },
    coletado: { border: 'border-l-blue-600', dot: 'bg-blue-600', label: 'Realizado' },
    cancelado: { border: 'border-l-zinc-300', dot: 'bg-zinc-200', label: 'Cancelado' }
};

export default function CardCarregamento({ carregamento, info, cargasPendentes, isLoading, isDraggable = true }: CardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const { role, isLoading: authLoading } = useAuth();
    const isAdmin = role === 'admin';

    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: carregamento?.id || 'skeleton',
        disabled: isLoading || carregamento?.status === 'cancelado' || !isDraggable
    });

    const styleDraggable = useMemo(() => ({
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 50 : 1,
    }), [transform, isDragging]);

    // Lógica de Comparação de Datas
    const alteracaoData = useMemo(() => {
        if (!carregamento?.data_original || !carregamento?.data_carregamento) return null;
        
        const original = parseISO(carregamento.data_original);
        const atual = parseISO(carregamento.data_carregamento);
        
        if (format(original, 'yyyy-MM-dd') === format(atual, 'yyyy-MM-dd')) return null;

        const adiantado = isBefore(atual, original);
        return {
            tipo: adiantado ? 'Adiantado' : 'Reagendado',
            cor: adiantado ? 'text-blue-600 bg-blue-50 border-blue-100' : 'text-amber-600 bg-amber-50 border-amber-100',
            dataOriginal: format(original, 'dd/MM')
        };
    }, [carregamento?.data_original, carregamento?.data_carregamento]);

    if (isLoading) return <SkeletonCard />;
    if (!carregamento || !info) return null;

    const { status, transportadora, estado_destino, perfil, estados_atendidos, id } = carregamento;
    const isOverloaded = info.percentual > 100;
    const isFinalizado = ['coletado', 'cancelado'].includes(status);
    const config = STATUS_MAP[status] || STATUS_MAP.previsto;

    const handleCardClick = (e: React.MouseEvent) => {
        if (isDragging || authLoading) return;
        if (isAdmin) setIsModalOpen(true);
    };

    return (
        <>
            <div
                ref={setNodeRef}
                style={styleDraggable}
                className={`
                    group relative flex flex-col p-3 mb-2 border border-zinc-200 border-l-[4px] rounded-r-lg min-h-[145px] transition-all duration-200
                    ${config.border} ${status === 'coletado' ? 'bg-zinc-50/50' : 'bg-white'} 
                    ${status === 'cancelado' ? 'opacity-50' : 'shadow-sm hover:border-zinc-300 hover:shadow-md'}
                    ${authLoading ? 'cursor-wait' : (isAdmin && !isFinalizado ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer')}
                    ${isDragging ? 'shadow-2xl ring-2 ring-black/5' : ''}
                `}
                {...(!isFinalizado && isDraggable ? { ...listeners, ...attributes } : {})}
                onClick={handleCardClick}
            >
                {/* Badge de Data Alterada */}
                {alteracaoData && !isFinalizado && (
                    <div 
                        className={`absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 border rounded text-[10px] font-black uppercase tracking-tighter shadow-sm z-20 ${alteracaoData.cor}`}
                        title={`Data original: ${alteracaoData.dataOriginal}`}
                    >
                        <History size={10} />
                        {alteracaoData.tipo}
                    </div>
                )}

                {authLoading && (
                    <div className="absolute top-2 right-2 animate-spin text-zinc-300">
                        <Loader2 size={12} />
                    </div>
                )}

                {!isAdmin && !authLoading && (
                    <div className="absolute top-2 right-2 text-zinc-300">
                        <Lock size={12} />
                    </div>
                )}
                
                {!isFinalizado && isDraggable && (
                    <GripVertical size={14} className="absolute top-1/2 -right-1 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-zinc-300 transition-opacity" />
                )}

                <HeaderSection config={config} isOverloaded={isOverloaded} isFinalizado={isFinalizado} />

                <div className="flex-1 mb-2">
                    <h4 className="text-[13px] font-bold text-zinc-900 leading-tight uppercase truncate tracking-tighter">
                        {transportadora || 'Frota Própria'}
                    </h4>
                    <div className="flex items-center gap-1 mt-0.5 text-zinc-500">
                        <MapPin size={10} className="shrink-0" />
                        <span className="text-[10px] font-medium uppercase truncate">{estado_destino} | {perfil}</span>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-2">
                        {estados_atendidos?.map((uf: string) => (
                            <span key={uf} className="text-[8px] font-black bg-white text-zinc-500 px-1 py-0.5 rounded border border-zinc-200 uppercase">{uf}</span>
                        ))}
                    </div>
                </div>

                <div className="mt-auto pt-2 border-t border-zinc-100">
                    <FooterStatus info={info} isColetado={status === 'coletado'} isOverloaded={isOverloaded} />
                </div>

                {status === 'cancelado' && (
                    <div className="absolute inset-0 bg-white/40 flex items-center justify-center rounded-r-lg z-10 backdrop-blur-[1px]">
                        <span className="text-[9px] font-black text-zinc-500 border border-zinc-200 px-2 py-0.5 bg-white uppercase tracking-widest shadow-sm">Cancelado</span>
                    </div>
                )}
            </div>

            {isModalOpen && isAdmin && (
                <ModalDetalhes
                    id={id} status={status} transitPointId={carregamento.transit_point_id} perfil={perfil}
                    estadosAtendidos={estados_atendidos || []} cargasPendentes={cargasPendentes}
                    capacidadeVeiculo={info.capacidade} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
                />
            )}
        </>
    );
}

// Sub-componentes auxiliares permanecem os mesmos...
function HeaderSection({ config, isOverloaded, isFinalizado }: any) {
    return (
        <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${config.dot} ${config.pulse && !isFinalizado ? 'animate-pulse' : ''}`} />
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{config.label}</span>
            </div>
            {isOverloaded && !isFinalizado && (
                <div className="text-red-600 font-black text-[9px] animate-pulse flex items-center gap-1">
                    <AlertTriangle size={10} /> EXCESSO
                </div>
            )}
        </div>
    );
}

function FooterStatus({ info, isColetado, isOverloaded }: any) {
    if (isColetado && info.fatLiq === 0) {
        return (
            <div className="flex items-center gap-2 py-1 text-amber-600">
                <FileSearch size={12} />
                <span className="text-[9px] font-black uppercase italic tracking-tighter">CTEs não disponibilizados</span>
            </div>
        );
    }

    if (info.cubagem <= 0 && isColetado) {
        return (
            <div className="flex items-center gap-2 py-1 text-red-600">
                <Truck size={12} />
                <span className="text-[9px] font-black uppercase italic tracking-tighter">Carga Batida</span>
            </div>
        );
    }

    return (
        <div className="space-y-1.5">
            <div className="flex justify-between items-end text-[11px] font-black">
                <span className="text-[9px] text-zinc-400 uppercase tracking-tighter">Ocupação</span>
                <span className={isOverloaded ? "text-red-600" : "text-zinc-900"}>{info.percentual.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-zinc-100 h-1 rounded-full overflow-hidden">
                <div 
                    className={`h-full transition-all duration-700 ${isOverloaded ? "bg-red-600" : "bg-black"}`} 
                    style={{ width: `${Math.min(info.percentual, 100)}%` }} 
                />
            </div>
        </div>
    );
}

function SkeletonCard() {
    return (
        <div className="flex flex-col p-3 mb-2 border border-zinc-200 border-l-[4px] border-l-zinc-100 bg-white rounded-r-lg min-h-[140px] animate-pulse">
            <div className="h-2 w-16 bg-zinc-100 rounded mb-4" />
            <div className="flex-1 space-y-3">
                <div className="h-4 w-3/4 bg-zinc-100 rounded" />
                <div className="h-2 w-1/2 bg-zinc-50 rounded" />
            </div>
        </div>
    );
}