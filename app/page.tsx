'use client';

import { useEffect, useState, useMemo } from 'react';
import {
    isSameDay, format, startOfMonth, endOfMonth,
    startOfWeek, endOfWeek, eachDayOfInterval,
    addMonths, subMonths, isSameMonth, parseISO
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Filter, Check } from 'lucide-react';
import {
    DndContext,
    DragEndEvent,
    DragStartEvent,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
    rectIntersection,
    defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { toast, Toaster } from 'sonner';

import MainLayout from '@/components/layout/MainLayout';
import { useDashboardData } from '@/hooks/useDashboardData';
import CardCarregamento from '@/components/dashboard/CardCarregamento';
import { SheetNovoCarregamento } from '@/components/dashboard/SheetNovoCarregamento';
import { createClient } from '@/lib/supabase/client';
import { DayCell } from '@/components/dashboard/DayCell';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useRole } from '@/hooks/auth/useRole';

// Lista de estados para o filtro
const ESTADOS_BR = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export default function Dashboard() {
    const [currentDate, setCurrentDate] = useState<Date | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [selectedStates, setSelectedStates] = useState<string[]>([]);
    const { role, isLoading: authLoading } = useRole();
    const isAdmin = role === 'admin';
    
    const supabase = createClient();
    const { carregamentos, cargasPendentes, getOcupacaoInfo, loading, refresh } = useDashboardData(currentDate);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 3 } })
    );

    useEffect(() => { setCurrentDate(new Date()); }, []);

    // Lógica de Filtragem
    const carregamentosFiltrados = useMemo(() => {
        if (selectedStates.length === 0) return carregamentos;
        
        return carregamentos.filter(c => {
            const atendidos = c.estados_atendidos || [];
            const destino = c.estado_destino;
            // Verifica se o destino ou algum estado atendido está na lista de filtros
            return selectedStates.includes(destino) || atendidos.some((uf: string) => selectedStates.includes(uf));
        });
    }, [carregamentos, selectedStates]);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (over && active.id !== over.id) {
            const { error } = await supabase
                .from('carregamentos')
                .update({ data_carregamento: over.id as string })
                .eq('id', active.id);

            if (!error) {
                if (isAdmin) {
                    toast.success('Agendamento atualizado');
                    refresh();
                } else {
                    toast.error('Você não tem permissão para atualizar o agendamento');
                }
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
                onDragStart={handleDragStart}
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
                            // Usar a lista filtrada aqui
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
                                                isDraggable={true}
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
                    easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
                    sideEffects: defaultDropAnimationSideEffects({
                        styles: { active: { opacity: '0.4' } }
                    })
                }}>
                    {activeId && activeCarregamento ? (
                        <div className="cursor-grabbing rotate-2 scale-105 transition-transform shadow-2xl">
                            <CardCarregamento
                                carregamento={activeCarregamento}
                                info={getOcupacaoInfo(activeCarregamento)}
                                cargasPendentes={cargasPendentes}
                                isDraggable={true}
                            />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </MainLayout>
    );
}

function HeaderActions({ currentDate, setCurrentDate, refresh, selectedStates, setSelectedStates }: any) {
    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

    const toggleState = (uf: string) => {
        setSelectedStates((prev: string[]) => 
            prev.includes(uf) ? prev.filter(s => s !== uf) : [...prev, uf]
        );
    };
    
    return (
        <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
                <h3 className="text-xl font-black uppercase tracking-tighter italic">
                    {format(currentDate, 'MMMM', { locale: ptBR })}
                    <span className="ml-2 not-italic font-light text-zinc-400">{format(currentDate, 'yyyy')}</span>
                </h3>
                <div className="flex items-center border border-zinc-200 divide-x divide-zinc-200 bg-white shadow-sm">
                    <button onClick={prevMonth} className="p-2 hover:bg-zinc-100 transition-colors"><ChevronLeft size={16} /></button>
                    <button onClick={nextMonth} className="p-2 hover:bg-zinc-100 transition-colors"><ChevronRight size={16} /></button>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {/* FILTRO DE ESTADOS */}
                <Popover>
                    <PopoverTrigger asChild>
                        <button className={`flex items-center gap-2 px-5 py-2.5 text-[12px] border  font-black uppercase tracking-widest transition-all ${selectedStates.length > 0 ? 'bg-black text-white border-black' : 'bg-white text-zinc-900 border-zinc-200 hover:bg-zinc-50'}`}>
                            <Filter size={14} /> 
                            {selectedStates.length > 0 ? `Estados (${selectedStates.length})` : 'Filtros'}
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4 bg-white border-black border-2 rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" align="end">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Filtrar por UF</span>
                            {selectedStates.length > 0 && (
                                <button 
                                    onClick={() => setSelectedStates([])}
                                    className="text-[9px] font-black text-red-500 uppercase hover:underline"
                                >
                                    Limpar
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                            {ESTADOS_BR.map(uf => {
                                const active = selectedStates.includes(uf);
                                return (
                                    <button
                                        key={uf}
                                        onClick={() => toggleState(uf)}
                                        className={`h-8 flex items-center justify-center text-[10px] font-bold border transition-all ${active ? 'bg-black text-white border-black' : 'bg-white text-zinc-400 border-zinc-100 hover:border-zinc-300'}`}
                                    >
                                        {uf}
                                    </button>
                                );
                            })}
                        </div>
                    </PopoverContent>
                </Popover>

                <SheetNovoCarregamento onSucess={refresh} />
            </div>
        </div>
    );
}