'use client';

import { useState } from 'react';
import { MapPin, AlertTriangle, GripVertical, FileSearch, Lock } from 'lucide-react'; // Adicionado Lock
import { ModalDetalhes } from './ModalDetalhes';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useRole } from "@/hooks/auth/useRole"; // Importando o hook de permissão

interface CardProps {
    carregamento?: any;
    info?: {
        cubagem: number;
        capacidade: number;
        percentual: number;
        fatLiq?: number;
        custoLiq?: number;
    };
    cargasPendentes: any[];
    isLoading?: boolean;
    isDraggable?: boolean;
}

export default function CardCarregamento({
    carregamento,
    info,
    cargasPendentes,
    isLoading,
    isDraggable = true,
}: CardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // VALIDACÃO DE PERMISSÃO
    const { role, isLoading: authLoading } = useRole();
    const isAdmin = role === 'admin';

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        isDragging
    } = useDraggable({
        id: carregamento?.id || 'skeleton',
        disabled: isLoading || carregamento?.status === 'cancelado' || !isDraggable
    });

    const styleDraggable = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 50 : 1,
    };

    if (isLoading) {
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

    if (!carregamento || !info) return null;

    const isOverloaded = info.percentual > 100;
    const isColetado = carregamento.status === 'coletado';
    const isCancelado = carregamento.status === 'cancelado';
    const isFinalizado = isColetado || isCancelado;
    const canMove = isDraggable && !isFinalizado;
    const showCTEMessage = isColetado && info.fatLiq === 0;

    const statusConfig: any = {
        confirmado: { border: 'border-l-emerald-500', dot: 'bg-emerald-500', label: 'Confirmado' },
        previsto: { border: 'border-l-zinc-900', dot: 'bg-zinc-300', label: 'Agendado' },
        coletado: { border: 'border-l-blue-600', dot: 'bg-blue-600', label: 'Realizado' },
        cancelado: { border: 'border-l-zinc-300', dot: 'bg-zinc-200', label: 'Cancelado' }
    };

    const style = statusConfig[carregamento.status] || statusConfig.previsto;

    return (
        <>
            <div
                ref={setNodeRef}
                style={styleDraggable}
                className={`
                    group relative flex flex-col p-3 mb-2 border border-zinc-200 border-l-[4px]
                    ${style.border} ${isColetado ? 'bg-zinc-50/50' : 'bg-white'} 
                    ${isCancelado ? 'opacity-50 cursor-not-allowed' : 'shadow-sm'}
                    ${canMove ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
                    ${!isAdmin && !authLoading ? 'cursor-pointer' : 'hover:border-zinc-300 hover:shadow-md'}
                    rounded-r-lg min-h-[145px] transition-all duration-200 
                    ${isDragging ? 'shadow-2xl ring-2 ring-black/5' : ''}
                `}
                {...(canMove ? listeners : {})}
                {...(canMove ? attributes : {})}
                onClick={() => {
                    // SÓ ABRE O MODAL SE FOR ADMIN E NÃO ESTIVER CARREGANDO A ROLE
                    if (!isDragging && isAdmin && !authLoading) {
                        setIsModalOpen(true);
                    }
                }}
            >
                {/* ÍCONE DE CADEADO PARA NÃO-ADMINS (OPCIONAL) */}
                {!isAdmin && !authLoading && (
                    <div className="absolute top-2 right-2 opacity-20">
                        <Lock size={12} />
                    </div>
                )}

                {!isFinalizado && isDraggable && (
                    <div className="absolute top-1/2 -right-1 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical size={14} className="text-zinc-300" />
                    </div>
                )}

                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${style.dot} ${carregamento.status === 'confirmado' ? 'animate-pulse' : ''}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{style.label}</span>
                    </div>
                    {isOverloaded && !isFinalizado && (
                        <div className="text-red-600 font-black text-[9px] animate-pulse flex items-center gap-1">
                            <AlertTriangle size={10} /> EXCESSO
                        </div>
                    )}
                </div>

                <div className="flex-1 mb-2">
                    <h4 className="text-[13px] font-bold text-zinc-900 leading-tight uppercase truncate tracking-tighter">
                        {carregamento.transportadora || 'Frota Própria'}
                    </h4>
                    <div className="flex items-center gap-1 mt-0.5 text-zinc-500">
                        <MapPin size={10} className="shrink-0" />
                        <span className="text-[10px] font-medium uppercase truncate">
                            {carregamento.estado_destino} | {carregamento.perfil}
                        </span>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-2">
                        {carregamento.estados_atendidos?.map((uf: string) => (
                            <span key={uf} className="text-[8px] font-black bg-white text-zinc-500 px-1 py-0.5 rounded border border-zinc-200 uppercase">
                                {uf}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="mt-auto pt-2 border-t border-zinc-100">
                    {showCTEMessage ? (
                        <div className="flex items-center gap-2 py-1">
                            <FileSearch size={12} className="text-amber-500" />
                            <span className="text-[9px] font-black text-amber-600 uppercase italic tracking-tighter">
                                CTEs ainda não disponibilizados
                            </span>
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-end text-[11px] font-black">
                                <span className="text-[9px] text-zinc-400 uppercase tracking-tighter">Ocupação</span>
                                <span className={isOverloaded ? 'text-red-600' : 'text-zinc-900'}>{info.percentual.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-zinc-100 h-1 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-700 ${isOverloaded ? 'bg-red-600' : 'bg-black'}`}
                                    style={{ width: `${Math.min(info.percentual, 100)}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {isCancelado && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-r-lg z-10">
                        <span className="text-[9px] font-black text-zinc-400 border border-zinc-200 px-2 py-0.5 bg-white uppercase tracking-widest">
                            Cancelado
                        </span>
                    </div>
                )}
            </div>

            {/* SÓ RENDERIZA O COMPONENTE DO MODAL SE PASSAR NA VALIDAÇÃO */}
            {isModalOpen && isAdmin && carregamento && (
                <ModalDetalhes
                    id={carregamento.id}
                    status={carregamento.status}
                    estadosAtendidos={carregamento.estados_atendidos || []}
                    cargasPendentes={cargasPendentes}
                    capacidadeVeiculo={info.capacidade}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    transitPointId={carregamento.transit_point_id}
                    perfil={carregamento.perfil}
                />
            )}
        </>
    );
}