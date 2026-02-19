'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

interface DayCellProps {
  dateKey: string;
  day: Date;
  isToday: boolean;
  isMonth: boolean;
  idx: number;
  children: React.ReactNode;
  loading: boolean;
}

export function DayCell({ dateKey, day, isToday, isMonth, idx, children, loading }: DayCellProps) {
    const { setNodeRef, isOver } = useDroppable({ id: dateKey });

    return (
        <div
            ref={setNodeRef}
            className={`h-400 p-2 border-r border-b border-zinc-100 flex flex-col transition-colors duration-300 relative
                ${!isMonth ? 'bg-zinc-50/30 opacity-40' : 'bg-white'}
                ${isOver ? 'bg-blue-50/80 ring-2 ring-inset ring-blue-500/20 z-10' : ''}
                ${idx % 7 === 6 ? 'border-r-0' : ''}
            `}
        >
            <div className="flex justify-between items-center mb-2 select-none">
                <span className={`text-[11px] font-black w-6 h-6 flex items-center justify-center rounded-full
                    ${isToday ? 'bg-blue-600 text-white shadow-md' : 'text-zinc-400'}`}>
                    {format(day, 'd')}
                </span>
                {isToday && <span className="text-[8px] font-black text-blue-600 uppercase tracking-tighter">Hoje</span>}
            </div>
            
            <div className="flex-1 flex flex-col gap-1.5 overflow-hidden">
                {loading ? (
                    <div className="flex-1 flex items-center justify-center"><Loader2 className="w-5 h-5 text-zinc-200 animate-spin" /></div>
                ) : (
                    <div className="space-y-1.5">
                        {children}
                    </div>
                )}
            </div>
        </div>
    );
}
