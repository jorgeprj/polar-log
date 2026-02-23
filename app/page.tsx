'use client';

import { useEffect, useState, useMemo } from 'react';
import {
    isSameDay, format, startOfMonth, endOfMonth,
    startOfWeek, endOfWeek, eachDayOfInterval,
    addMonths, subMonths, isSameMonth, parseISO
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import {
    DndContext, DragEndEvent, DragStartEvent, DragOverlay,
    PointerSensor, useSensor, useSensors, rectIntersection,
    defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { toast, Toaster } from 'sonner';

import MainLayout from '@/components/layout/MainLayout';
import { useDashboardData } from '@/hooks/useDashboardData';
import CardCarregamento from '@/components/dashboard/CardCarregamento';
import { SheetNovoCarregamento } from '@/components/dashboard/SheetNovoCarregamento';
import { createClient } from '@/lib/supabase/client';
import { DayCell } from '@/components/dashboard/DayCell';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from '@/contexts/AuthContext';

const ESTADOS_BR = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export default function Dashboard() {
    const [currentDate, setCurrentDate] = useState<Date | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [selectedStates, setSelectedStates] = useState<string[]>([]);
    
    // Pegando role e loading do contexto global para máxima performance
    const { role, isLoading: authLoading } = useAuth();
    const isAdmin = role === 'admin';
    
    const supabase = createClient();
    const { carregamentos, cargasPendentes, getOcupacaoInfo, loading, refresh } = useDashboardData(currentDate);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 3 } })
    );

    useEffect(() => { setCurrentDate(new Date()); }, []);

    const carregamentosFiltrados = useMemo(() => {
        if (selectedStates.length === 0) return carregamentos;
        return carregamentos.filter(c => 
            selectedStates.includes(c.estado_destino) || 
            (c.estados_atendidos || []).some((uf: string) => selectedStates.includes(uf))
        );
    }, [carregamentos, selectedStates]);

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (over && active.id !== over.id) {
            // Se não for admin ou ainda estiver carregando a auth, bloqueia
            if (!isAdmin || authLoading) {
                return toast.error('Operação não permitida', {
                    description: 'Apenas administradores podem redefinir datas.'
                });
            }

            const { error } = await supabase
                .from('carregamentos')
                .update({ data_carregamento: over.id as string })
                .eq('id', active.id);

            if (!error) {
                toast.success('Agendamento atualizado');
                refresh();
            } else {
                toast.error('Erro ao atualizar agendamento');
            }
        }
    };

    if (!currentDate) return null;

    const days = eachDayOfInterval({
        start: startOfWeek(startOfMonth(currentDate)),
        end: endOfWeek(endOfMonth(currentDate))
    });

    const activeCarregamento = carregamentos.find(c => c.id === activeId);

    return (
        <MainLayout 
            title="" 
            headerActions={
                <HeaderActions 
                    currentDate={currentDate} 
                    setCurrentDate={setCurrentDate} 
                    refresh={refresh}
                    selectedStates={selectedStates}
                    setSelectedStates={setSelectedStates}
                />
            }
        >
            <Toaster position="bottom-right" richColors />

            <DndContext
                sensors={sensors}
                onDragStart={(e) => {
                    // Impede o início do drag se não for admin
                    if (!isAdmin) return;
                    setActiveId(e.active.id as string);
                }}
                onDragEnd={handleDragEnd}
                collisionDetection={rectIntersection}
            >
                <div className="bg-white border border-zinc-200 shadow-sm flex flex-col select-none">
                    <div className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50/50">
                        {['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'].map(d => (
                            <div key={d} className="py-2 text-center text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 border-r border-zinc-100 last:border-r-0">{d}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 auto-rows-fr min-h-[700px]">
                        {days.map((day, idx) => {
                            const dateKey = format(day, 'yyyy-MM-dd');
                            const noDia = carregamentosFiltrados.filter(c => isSameDay(parseISO(c.data_carregamento), day));

                            return (
                                <DayCell 
                                    key={dateKey} 
                                    dateKey={dateKey} 
                                    day={day} 
                                    idx={idx}
                                    isToday={isSameDay(day, new Date())}
                                    isMonth={isSameMonth(day, currentDate)}
                                    loading={loading}
                                >
                                    {noDia.map(c => (
                                        <div key={c.id} style={{ opacity: activeId === c.id ? 0.3 : 1 }}>
                                            <CardCarregamento
                                                carregamento={c}
                                                info={getOcupacaoInfo(c)}
                                                cargasPendentes={cargasPendentes}
                                                // Só permite o visual de "arrastável" se for admin
                                                isDraggable={isAdmin}
                                            />
                                        </div>
                                    ))}
                                </DayCell>
                            );
                        })}
                    </div>
                </div>

                <DragOverlay dropAnimation={{
                    duration: 300,
                    sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } })
                }}>
                    {activeCarregamento && isAdmin && (
                        <div className="cursor-grabbing rotate-2 scale-105 shadow-2xl">
                            <CardCarregamento
                                carregamento={activeCarregamento}
                                info={getOcupacaoInfo(activeCarregamento)}
                                cargasPendentes={cargasPendentes}
                                isDraggable={true}
                            />
                        </div>
                    )}
                </DragOverlay>
            </DndContext>
        </MainLayout>
    );
}

// ... Resto do componente HeaderActions permanece o mesmo ...

interface HeaderActionsProps {
    currentDate: Date;
    setCurrentDate: (d: Date) => void;
    refresh: () => void;
    selectedStates: string[];
    setSelectedStates: React.Dispatch<React.SetStateAction<string[]>>;
}

function HeaderActions({ currentDate, setCurrentDate, refresh, selectedStates, setSelectedStates }: HeaderActionsProps) {
    const toggleState = (uf: string) => {
        setSelectedStates(prev => prev.includes(uf) ? prev.filter(s => s !== uf) : [...prev, uf]);
    };
    
    return (
        <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
                <h3 className="text-xl font-black uppercase tracking-tighter italic">
                    {format(currentDate, 'MMMM', { locale: ptBR })}
                    <span className="ml-2 not-italic font-light text-zinc-400">{format(currentDate, 'yyyy')}</span>
                </h3>
                <div className="flex items-center border border-zinc-200 divide-x divide-zinc-200 bg-white shadow-sm">
                    <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 hover:bg-zinc-100 transition-colors"><ChevronLeft size={16} /></button>
                    <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 hover:bg-zinc-100 transition-colors"><ChevronRight size={16} /></button>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Popover>
                    <PopoverTrigger asChild>
                        <button className={`flex items-center gap-2 px-5 py-2.5 text-[12px] border font-black uppercase tracking-widest transition-all ${selectedStates.length > 0 ? 'bg-black text-white border-black' : 'bg-white text-zinc-900 border-zinc-200 hover:bg-zinc-50'}`}>
                            <Filter size={14} /> 
                            {selectedStates.length > 0 ? `Estados (${selectedStates.length})` : 'Filtros'}
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4 bg-white border-black border-2 rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" align="end">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Filtrar por UF</span>
                            {selectedStates.length > 0 && (
                                <button onClick={() => setSelectedStates([])} className="text-[9px] font-black text-red-500 uppercase hover:underline">Limpar</button>
                            )}
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                            {ESTADOS_BR.map(uf => (
                                <button
                                    key={uf}
                                    onClick={() => toggleState(uf)}
                                    className={`h-8 flex items-center justify-center text-[10px] font-bold border transition-all ${selectedStates.includes(uf) ? 'bg-black text-white border-black' : 'bg-white text-zinc-400 border-zinc-100 hover:border-zinc-300'}`}
                                >
                                    {uf}
                                </button>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>
                <SheetNovoCarregamento onSucess={refresh} />
            </div>
        </div>
    );
}