'use client'

import { useState } from 'react'
import { 
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription 
} from "@/components/ui/sheet"
import { Plus, Info, Calendar, Truck, MapPin, Loader2, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from "sonner"
import { useAuth } from '@/contexts/AuthContext'

export function SheetNovoCarregamento({ onSucess }: { onSucess: () => void }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const supabase = createClient()
    
    // Consumindo dados instantâneos do contexto global
    const { role, isLoading: authLoading } = useAuth()
    const isAdmin = role === 'admin'

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        if (!isAdmin) return

        setLoading(true)
        const form = e.currentTarget 
        const formData = new FormData(form)
        
        const payload = {
            perfil: formData.get('perfil'),
            data_carregamento: formData.get('data'),
            transportadora: formData.get('transportadora'),
            estado_destino: formData.get('estado_destino')?.toString().toUpperCase(),
            estados_atendidos: formData.get('estados_atendidos')
                ?.toString()
                .split(',')
                .map(s => s.trim().toUpperCase())
                .filter(s => s !== ""),
            status: 'previsto'
        }

        try {
            const { error } = await supabase
                .from('carregamentos')
                .insert([payload])

            if (error) {
                toast.error("Falha na operação", {
                    description: error.message
                })
            } else {
                toast.success("Carga Agendada", {
                    description: `Operação para ${payload.estado_destino} registrada com sucesso.`
                })
                setOpen(false)
                form.reset() 
                onSucess()
            }
        } catch (err) {
            toast.error("Erro inesperado ao conectar com o servidor.")
        } finally {
            setLoading(false)
        }
    }

    return (
        // O Sheet agora bloqueia a abertura se não for admin ou se ainda estiver carregando a auth
        <Sheet open={open} onOpenChange={(val) => {
            if (isAdmin) setOpen(val)
        }}>
            <SheetTrigger asChild>
                <button 
                    disabled={!isAdmin || authLoading}
                    className={`flex items-center gap-2 px-5 py-2.5 text-[12px] font-bold uppercase tracking-tight transition-all
                        ${isAdmin 
                            ? 'bg-black text-white hover:bg-zinc-800 active:scale-95 shadow-lg' 
                            : 'bg-zinc-100 text-zinc-400 cursor-not-allowed opacity-70 border border-zinc-300'
                        }`}
                >
                    {authLoading ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : isAdmin ? (
                        <Plus size={16} strokeWidth={3} />
                    ) : (
                        <Lock size={14} className="text-zinc-400" />
                    )}
                    {authLoading ? 'Validando...' : 'Novo Carregamento'}
                </button>
            </SheetTrigger>
            
            <SheetContent className="sm:max-w-[480px] p-0 border-none bg-white flex flex-col font-sans">
                <SheetHeader className="p-10 bg-black text-white text-left space-y-2">
                    <div className="flex items-center gap-2 text-white/50 mb-2">
                        <Truck size={18} />
                        <span className="text-[10px] font-bold uppercase tracking-[2px]">Logística Integrada</span>
                    </div>
                    <SheetTitle className="text-3xl font-semibold tracking-tight text-white">
                        Agendar Carga
                    </SheetTitle>
                    <SheetDescription className="text-zinc-400 text-xs font-medium max-w-[280px]">
                        Configure os parâmetros da nova operação para o simulador de viabilidade.
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="p-10 flex-1 flex flex-col bg-white">
                    <div className="space-y-10 flex-1">
                        
                        {/* Tipo de Veículo */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-[11px] font-bold uppercase text-zinc-500 tracking-wider">
                                <Truck size={14} className="text-zinc-400" />
                                Veículo (Modal)
                            </label>
                            <select 
                                name="perfil" 
                                defaultValue="CARRETA28P"
                                className="w-full border-b-2 border-zinc-100 py-3 focus:border-black outline-none font-semibold text-base bg-transparent transition-all cursor-pointer appearance-none"
                            >
                                <option value="CARRETA28P">CARRETA 28P (PADRÃO)</option>
                                <option value="TRUCK14P">TRUCK 14P</option>
                                <option value="TOCO">TOCO</option>
                                <option value="VLC">VLC</option>
                            </select>
                        </div>

                        {/* Data */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-[11px] font-bold uppercase text-zinc-500 tracking-wider">
                                <Calendar size={14} className="text-zinc-400" />
                                Data de Saída
                            </label>
                            <input 
                                name="data" 
                                type="date" 
                                required 
                                className="w-full border-b-2 border-zinc-100 py-3 focus:border-black outline-none font-semibold text-base bg-transparent transition-all" 
                            />
                        </div>

                        {/* Transportadora */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-bold uppercase text-zinc-500 tracking-wider">Transportadora / Operador</label>
                            <input 
                                name="transportadora" 
                                placeholder="NOME DO PARCEIRO" 
                                required
                                className="w-full border-b-2 border-zinc-100 py-3 focus:border-black outline-none font-semibold text-base placeholder:text-zinc-200 uppercase bg-transparent transition-all" 
                            />
                        </div>

                        {/* Destinos */}
                        <div className="grid grid-cols-5 gap-6">
                            <div className="col-span-2 space-y-3">
                                <label className="flex items-center gap-2 text-[11px] font-bold uppercase text-zinc-500 tracking-wider">
                                    <MapPin size={14} className="text-zinc-400" />
                                    UF Base
                                </label>
                                <input 
                                    name="estado_destino" 
                                    maxLength={2} 
                                    required
                                    placeholder="SP" 
                                    className="w-full border-b-2 border-zinc-100 py-3 focus:border-black outline-none font-semibold text-base uppercase placeholder:text-zinc-200 bg-transparent transition-all" 
                                />
                            </div>
                            <div className="col-span-3 space-y-3">
                                <label className="text-[11px] font-bold uppercase text-zinc-500 tracking-wider">Malha de Atendimento</label>
                                <input 
                                    name="estados_atendidos" 
                                    placeholder="SP, RJ, MG..." 
                                    required
                                    className="w-full border-b-2 border-zinc-100 py-3 focus:border-black outline-none font-semibold text-base uppercase placeholder:text-zinc-200 bg-transparent transition-all" 
                                />
                            </div>
                        </div>

                        {/* Aviso Técnico */}
                        <div className="bg-[#F6F6F6] p-5 rounded-none border-l-4 border-black flex gap-4 items-start">
                            <Info size={18} className="text-black mt-0.5 flex-shrink-0" />
                            <p className="text-[11px] leading-relaxed text-zinc-600 font-medium">
                                Operação em modo <span className="font-bold text-black">SIMULAÇÃO</span>. 
                                O sistema calculará automaticamente o faturamento previsto e a ocupação baseada no histórico de frete.
                            </p>
                        </div>
                    </div>

                    <div className="pt-10">
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-black text-white py-5 text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.99] flex justify-center items-center gap-3"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    Processando
                                </>
                            ) : (
                                'Confirmar Agendamento'
                            )}
                        </button>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    )
}