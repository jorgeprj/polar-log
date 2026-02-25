'use client';

import {
    LayoutDashboard, Truck, MapPin, BarChart3,
    Settings, LogOut, ChevronLeft, ChevronRight, Lock, Loader2,
    BookText,
    DollarSign,
    TrendingUp
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarProps {
    isCollapsed: boolean;
    setIsCollapsed: (value: boolean) => void;
}

export default function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();
    
    const { user, role, isLoading: isLoadingUser } = useAuth();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/auth/login');
        router.refresh();
    };

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', href: '/', adminOnly: false },
        { icon: BookText, label: 'Padrão de Op. Logística', href: '/pol', adminOnly: false },
        { icon: TrendingUp, label: 'Performance', href: '/performance', adminOnly: true },
        { icon: Truck, label: 'Carregamentos', href: '/carregamentos', adminOnly: true },
        { icon: DollarSign, label: 'Custos', href: '/custos', adminOnly: true },
        { icon: Settings, label: 'Configurações', href: '/settings', adminOnly: true },
    ];

    return (
        <aside
            className={`h-screen bg-white text-black flex flex-col fixed left-0 top-0 border-r border-zinc-100 
            transition-[width] duration-500 ease-[cubic-bezier(0.65,0,0.35,1)] z-50
            ${isCollapsed ? 'w-[80px]' : 'w-[280px]'}`}
        >
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3.5 top-12 bg-black text-white rounded-none p-1.5 
                hover:scale-110 active:scale-90 transition-all shadow-xl z-[60]"
            >
                {isCollapsed ? <ChevronRight size={14} strokeWidth={3} /> : <ChevronLeft size={14} strokeWidth={3} />}
            </button>

            {/* Logo Area */}
            <div className="h-24 flex items-center px-6 overflow-hidden flex-shrink-0">
                <div className="flex items-center gap-4">
                    <div className="min-w-[32px] flex justify-center">
                        <Image src="/logo.png" width={32} height={32} alt="Logo" className="object-contain shrink-0" />
                    </div>
                    <div className={`flex flex-col transition-all duration-500 ${isCollapsed ? 'opacity-0 translate-x-10' : 'opacity-100 translate-x-0'}`}>
                        <span className="text-xl font-black tracking-tighter uppercase leading-none">
                            Polar <span className="text-zinc-400 font-medium">Log</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* Perfil do Usuário - Agora usando Contexto */}
            <div className={`px-4 mb-6 transition-all duration-500 ${isCollapsed ? 'opacity-0 translate-y-4 pointer-events-none' : 'opacity-100'}`}>
                <div className="bg-zinc-50 p-4 rounded-none border-l-4 border-black min-h-[92px] flex flex-col justify-center">
                    {isLoadingUser ? (
                        <div className="flex items-center gap-3">
                            <Loader2 className="animate-spin text-zinc-400" size={18} />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Autenticando...</span>
                        </div>
                    ) : (
                        <>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Autenticado como</p>
                            <p className="text-sm font-black truncate text-black uppercase tracking-tighter">
                                {user?.user_metadata?.full_name || 'Operador'}
                            </p>
                            <p className="text-[10px] font-medium truncate text-zinc-500 lowercase">{user?.email}</p>
                            <div className="mt-2 inline-flex items-center bg-black text-white text-[8px] px-2 py-0.5 font-black uppercase tracking-widest w-fit">
                                {role}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
                {menuItems.map((item) => {
                    const isLocked = item.adminOnly && role !== 'admin';
                    const isActive = pathname === item.href;

                    const content = (
                        <div className={`flex items-center py-3.5 transition-all duration-300 group relative
                            ${isActive ? 'bg-zinc-100/80 text-black' : 'text-zinc-500'}
                            ${isLocked ? 'cursor-not-allowed opacity-40' : 'hover:bg-zinc-50 hover:text-black'}
                            ${isCollapsed ? 'justify-center rounded-lg mx-1' : 'px-4'}
                        `}>
                            {isActive && !isCollapsed && <div className="absolute left-0 top-0 bottom-0 w-1 bg-black" />}

                            <div className={`flex items-center justify-center ${isCollapsed ? 'min-w-[40px]' : 'min-w-[20px] mr-4'}`}>
                                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                            </div>

                            {!isCollapsed && (
                                <span className="text-[14px] font-bold tracking-tight whitespace-nowrap">
                                    {item.label}
                                </span>
                            )}

                            {isLocked && !isCollapsed && (
                                <Lock size={12} className="absolute right-4 text-zinc-400" />
                            )}
                        </div>
                    );

                    return isLocked ? (
                        <div key={item.label}>{content}</div>
                    ) : (
                        <Link key={item.href} href={item.href}>{content}</Link>
                    );
                })}
            </nav>

            {/* Footer Logout */}
            <div className="p-4 border-t border-zinc-100">
                <button
                    onClick={handleLogout}
                    className={`flex items-center py-4 text-sm font-bold w-full transition-all duration-300 group
                    text-zinc-400 hover:text-red-600 ${isCollapsed ? 'justify-center' : 'px-4'}`}
                >
                    <div className={`flex items-center justify-center ${isCollapsed ? 'min-w-[40px]' : 'mr-4'}`}>
                        <LogOut size={20} className="shrink-0 transition-transform group-hover:-rotate-12" />
                    </div>
                    {!isCollapsed && (
                        <span className="uppercase text-[10px] font-black tracking-widest text-nowrap">Sair do Sistema</span>
                    )}
                </button>
            </div>
        </aside>
    );
}