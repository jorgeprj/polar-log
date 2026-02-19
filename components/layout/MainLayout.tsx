'use client';

import { useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";

export default function MainLayout({ children, title, headerActions, sidebarExtra }: any) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className="flex min-h-screen bg-zinc-50 font-sans selection:bg-black selection:text-white">
            <Sidebar
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
            />

            <main className={`flex-1 transition-all duration-300 ease-in-out ${isCollapsed ? 'ml-[80px]' : 'ml-[280px]'}`}>
                <Header title={title} actions={headerActions} />
                <div className="p-0">
                    {children}
                </div>
            </main>
        </div>
    );
}