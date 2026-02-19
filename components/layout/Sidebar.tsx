'use client';

import { 
    LayoutDashboard, Truck, MapPin, BarChart3, 
    Settings, LogOut, ChevronLeft, ChevronRight 
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
    pageCustomContent?: React.ReactNode;
    isCollapsed: boolean;
    setIsCollapsed: (value: boolean) => void;
}

export default function Sidebar({ pageCustomContent, isCollapsed, setIsCollapsed }: SidebarProps) {
    const pathname = usePathname();

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
        { icon: Truck, label: 'Carregamentos', href: '/carregamentos' },
        { icon: MapPin, label: 'Transit Points', href: '/tp' },
        { icon: BarChart3, label: 'Custos & BI', href: '/custos' },
        { icon: Settings, label: 'Configurações', href: '/settings' },
    ];

    return (
        <aside 
            className={`h-screen bg-white text-black flex flex-col fixed left-0 top-0 border-r border-zinc-100 
            transition-[width] duration-500 ease-[cubic-bezier(0.65,0,0.35,1)] z-50
            ${isCollapsed ? 'w-[80px]' : 'w-[280px]'}`}
        >
            {/* Toggle Button */}
            <button 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3.5 top-12 bg-black text-white rounded-none p-1.5 
                hover:scale-110 active:scale-90 transition-all shadow-xl z-[60]"
            >
                {isCollapsed ? <ChevronRight size={14} strokeWidth={3} /> : <ChevronLeft size={14} strokeWidth={3} />}
            </button>

            {/* Logo Area */}
            <div className="h-24 flex items-center px-6 overflow-hidden flex-shrink-0">
                <div className={`flex items-center gap-4 transition-all duration-500 ${isCollapsed ? 'translate-x-0' : ''}`}>
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

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-1 mt-2 overflow-y-auto overflow-x-hidden custom-scrollbar">
                
                {menuItems.map((item, index) => {
                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center py-3.5 transition-all duration-300 group relative
                                ${isActive 
                                    ? 'text-black bg-zinc-100/80' 
                                    : 'text-zinc-500 hover:text-black hover:bg-zinc-50'
                                } ${isCollapsed ? 'justify-center rounded-lg mx-1' : 'px-4 rounded-none'}`}
                        >
                            {/* Indicador Ativo */}
                            {isActive && !isCollapsed && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-black animate-in fade-in duration-300" />
                            )}
                            
                            {/* Icon Container: Garante centralização perfeita no modo colapsado */}
                            <div className={`flex items-center justify-center transition-all duration-300 
                                ${isCollapsed ? 'min-w-[40px]' : 'min-w-[20px] mr-4'}`}>
                                <item.icon 
                                    size={20} 
                                    className={`shrink-0 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}
                                    strokeWidth={isActive ? 2.5 : 2} 
                                />
                            </div>
                            
                            {/* Label: Oculta com segurança no modo colapsado */}
                            <span className={`text-[14px] font-bold tracking-tight whitespace-nowrap transition-all duration-500 absolute left-14
                                ${isCollapsed ? 'opacity-0 translate-x-10 pointer-events-none' : 'opacity-100 translate-x-0'}
                                ${isActive ? 'text-black' : 'text-zinc-500 group-hover:text-black'}`}
                            >
                                {item.label}
                            </span>

                            {/* Tooltip */}
                            {isCollapsed && (
                                <div className="absolute left-full ml-6 px-4 py-2 bg-black text-white text-[10px] font-black uppercase tracking-widest 
                                    opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 pointer-events-none 
                                    transition-all duration-200 whitespace-nowrap z-[100] shadow-2xl">
                                    {item.label}
                                    <div className="absolute top-1/2 -left-1 w-2 h-2 bg-black rotate-45 -translate-y-1/2" />
                                </div>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer Logout */}
            <div className="p-4 border-t border-zinc-100">
                <button className={`flex items-center py-4 text-sm font-bold w-full transition-all duration-300 group
                    text-zinc-400 hover:text-red-600 ${isCollapsed ? 'justify-center' : 'px-4'}`}>
                    <div className={`flex items-center justify-center ${isCollapsed ? 'min-w-[40px]' : 'mr-4'}`}>
                        <LogOut size={20} className="shrink-0 transition-transform group-hover:-rotate-12" />
                    </div>
                    {!isCollapsed && (
                        <span className="uppercase text-[10px] font-black tracking-widest whitespace-nowrap">
                            Sair do Sistema
                        </span>
                    )}
                </button>
            </div>
        </aside>
    );
}