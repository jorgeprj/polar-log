'use client';

import React, { useState } from 'react';
import {
    DollarSign,
    Truck,
    Navigation,
    Info,
    Scale,
    ChevronDown,
    Calculator,
    Zap
} from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// --- Mock de Dados ---

const outboundRates = [
    { origem: "SÃO CARLOS", destino: "DUQUE DE CAXIAS", tp: "TP. RJ / ES", veiculo: "CARRETA 28P.", preco: 8432 },
    { origem: "SÃO CARLOS", destino: "DUQUE DE CAXIAS", tp: "TP. RJ / ES", veiculo: "TRUCK 16 P.", preco: 5469 },
    { origem: "SÃO CARLOS", destino: "JABOATÃO DOS GUARARAPES", tp: "TP. PE", veiculo: "CARRETA 28P.", preco: 28342 },
    { origem: "SÃO CARLOS", destino: "SIMÕES FILHO", tp: "TP. BAHIA", veiculo: "CARRETA 28P.", preco: 23702 },
    { origem: "SÃO CARLOS", destino: "ESTÂNCIA", tp: "TP. SE", veiculo: "CARRETA 28P.", preco: 25417 },
    { origem: "SÃO CARLOS", destino: "TERESINA", tp: "TP. PI", veiculo: "CARRETA 28P.", preco: 26898 },
];

const volumeHeaders = [
    "0,00 - 0,16", "0,17 - 0,33", "0,34 - 0,66", "0,67 - 0,99", "1,00 - 1,33", "1,34 - 1,66",
    "1,67 - 2,33", "2,34 - 3,33", "3,34 - 6,66", "6,67 - 9,99", "10,00 - 13,33", "13,34 - 16,66",
    "16,67 - 19,99", "20,00 - 23,33", "23,34 - 26,66", "26,67 - 29,99", "30,00 - 33,33", "33,34+"
];

// Simplificado para exibição na tabela
const lastMileData = [
    { range: "1 - 50 KM", fixo: 99.24, rates: [519, 450, 423, 384, 354, 297, 213, 129, 96, 75, 60, 54, 51, 45, 42, 39, 42] },
    { range: "50 - 100 KM", fixo: 99.24, rates: [519, 450, 423, 384, 354, 297, 213, 129, 96, 75, 60, 54, 51, 45, 42, 39, 42] },
    { range: "101 - 150 KM", fixo: 106.60, rates: [591, 498, 469.5, 426, 382.5, 297, 228, 145.5, 109.5, 85.5, 67.5, 63, 58.5, 54, 51, 46.5, 49.5] },
    { range: "151 - 200 KM", fixo: 113.95, rates: [663, 546, 516, 468, 411, 297, 243, 162, 123, 96, 75, 72, 66, 63, 60, 54, 57] },
    { range: "201 - 250 KM", fixo: 115.78, rates: [682.5, 564, 531, 483, 421.5, 331.5, 252, 165, 126, 99, 76.5, 73.5, 68.5, 63.5, 61, 57, 60] },
    { range: "251 - 300 KM", fixo: 117.62, rates: [702, 582, 546, 498, 432, 366, 261, 168, 129, 102, 78, 75, 71, 64, 62, 60, 63] },
    { range: "301 - 350 KM", fixo: 121.11, rates: [711.54, 584.5, 548.5, 500.5, 438.48, 382.5, 283.59, 188.64, 144.27, 114.66, 88.74, 85.05, 71.25, 64.5, 62.25, 62.28, 68.13] },
    { range: "351 - 400 KM", fixo: 124.61, rates: [721.08, 587, 551, 503, 444.96, 399, 306.18, 209.28, 159.54, 127.32, 99.48, 95.1, 71.5, 65, 62.5, 64.56, 73.26] },
    { range: "401 - 450 KM", fixo: 128.10, rates: [730.62, 589.5, 553.5, 505.5, 451.44, 415.5, 328.77, 229.92, 174.81, 139.98, 110.22, 105.15, 71.75, 65.5, 62.75, 66.84, 78.39] },
    { range: "451 - 500 KM", fixo: 131.59, rates: [740.16, 592, 556, 508, 457.92, 432, 351.36, 250.56, 190.08, 152.64, 120.96, 115.2, 72, 66, 63, 69.12, 83.52] },
    { range: "501 - 550 KM", fixo: 136.76, rates: [770.38, 609.71, 571.83, 520.86, 474.53, 447.38, 388.6, 262.97, 200.08, 160.07, 125.78, 118.64, 92.78, 86.94, 81.18, 81.4, 92.86] },
    { range: "551 - 600 KM", fixo: 141.92, rates: [800.59, 627.41, 587.67, 533.73, 491.14, 462.75, 425.85, 275.38, 210.08, 167.5, 130.59, 122.08, 113.56, 107.88, 99.36, 93.69, 102.2] },
    { range: "601 - 650 KM", fixo: 150.57, rates: [920.65, 719.07, 674.76, 613.29, 564.69, 531.80, 477.41, 294.37, 243.04, 197.31, 155.86, 147.29, 137.28, 130.13, 121.55, 112.97, 121.54] },
    { range: "650 - 700 KM", fixo: 159.21, rates: [1040.71, 810.72, 761.85, 692.85, 638.23, 600.85, 528.98, 313.36, 275.99, 227.12, 181.12, 172.49, 160.99, 152.37, 143.75, 132.25, 140.87] },
    { range: "701 - 750 KM", fixo: 170.62, rates: [1054.44, 822.83, 772.49, 702, 647.33, 609.93, 530.81, 351.02, 286.27, 230.16, 182.69, 174.06, 162.55, 153.92, 146.73, 133.78, 143.85] },
    { range: "751 - 800 KM", fixo: 182.02, rates: [1068.16, 834.95, 783.12, 711.14, 656.44, 619.01, 532.64, 388.68, 296.55, 233.21, 184.26, 175.63, 164.11, 155.47, 149.71, 135.32, 146.84] },
    { range: "801 - 850 KM", fixo: 201.87, rates: [1141.57, 892.84, 839.64, 763.44, 704.49, 662.80, 590.89, 418.38, 319.18, 251.60, 198.41, 188.34, 175.4, 165.34, 156.72, 143.78, 155.28] },
    { range: "851 - 900 KM", fixo: 221.71, rates: [1214.98, 950.73, 896.16, 815.73, 752.54, 706.58, 649.14, 448.08, 341.8, 270, 212.55, 201.06, 186.7, 175.21, 163.72, 152.23, 163.72] },
    { range: "901 - 1000 KM", fixo: 250.33, rates: [1324.58, 1030.23, 966.74, 877.28, 805.14, 758.97, 701.25, 458.84, 369.38, 291.47, 227.98, 216.44, 204.89, 181.81, 170.26, 155.83, 167.38] },
    { range: "1001 - 1500 KM", fixo: 280.82, rates: [1479, 1152, 1080, 984, 903, 852, 666, 543, 411, 321, 255, 243, 231, 216, 204, 192, 207] },
    { range: "1501 - 2000 KM", fixo: 313.91, rates: [1752, 1368, 1284, 1170, 1077, 1011, 930, 645, 489, 387, 306, 288, 273, 255, 237, 243, 264] },
    { range: "2001 - 2500 KM", fixo: 335.22, rates: [1962, 1530, 1437, 1311, 1203, 1134, 945, 720, 546, 432, 339, 321, 300, 285, 267, 276, 297] },
    { range: "2501 - 3000 KM", fixo: 401.39, rates: [1995, 1557, 1464, 1332, 1227, 1164, 1152, 732, 555, 441, 348, 330, 309, 294, 276, 285, 318] },
    { range: "3001 - 4000 KM", fixo: 507.25, rates: [2502, 1950, 1830, 1668, 1536, 1443, 1269, 918, 696, 552, 435, 414, 390, 363, 342, 330, 360] },
];

export default function PaginaPrecosPOL() {
    return (
        <MainLayout title="" headerActions={
            <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black tracking-tighter italic uppercase text-black">
                    TABELA DE PREÇOS
                    <span className="ml-2 not-italic font-light text-zinc-400 text-sm tracking-normal">
                        POL v2026.1
                    </span>
                </h2>
            </div>
        }>
            <div className="max-w-7xl mx-auto space-y-12 pb-20 px-8">

                {/* Banner de Regra de Negócio */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    <div className="p-8 bg-black text-white shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]">
                        <div className="flex items-center gap-3 mb-4">
                            <Zap className="text-yellow-400" fill="currentColor" size={24} />
                            <h3 className="font-black italic uppercase text-xl">Composição da Tarifa</h3>
                        </div>
                        <p className="text-zinc-400 text-sm leading-relaxed">
                            O custo final é a soma do <span className="text-white font-bold italic">Outbound Rateado</span> (dividido por todos os CTEs da carga)
                            mais o <span className="text-white font-bold italic">Last Mile</span> (calculado individualmente por KM e volume em m³).
                        </p>
                    </div>
                    <div className="p-8 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-center">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Fórmula Estimada</span>
                        </div>
                        <div className="text-3xl font-black tracking-tighter">
                            Total = <span className="text-zinc-400">(</span>Out / ΣCTEs<span className="text-zinc-400">)</span> + LM
                        </div>
                    </div>
                </div>

                <Tabs defaultValue="outbound" className="w-full">
                    <TabsList className="bg-zinc-100 p-1 mb-8">
                        <TabsTrigger value="outbound" className="data-[state=active]:bg-black data-[state=active]:text-white font-bold uppercase text-[10px] tracking-widest px-8">
                            Perna 1: Outbound
                        </TabsTrigger>
                        <TabsTrigger value="lastmile" className="data-[state=active]:bg-black data-[state=active]:text-white font-bold uppercase text-[10px] tracking-widest px-8">
                            Perna 2: Last Mile
                        </TabsTrigger>
                    </TabsList>

                    {/* Conteúdo Outbound */}
                    <TabsContent value="outbound" className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h3 className="text-xl font-black uppercase italic">Taxas de Transferência</h3>
                                <p className="text-sm text-zinc-500 italic">Preço fixo por veículo do CD São Carlos até o Transit Point.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {outboundRates.map((item, idx) => (
                                <div key={idx} className="group border-2 border-zinc-100 p-6 hover:border-black transition-all bg-white hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="p-2 bg-zinc-100 group-hover:bg-black group-hover:text-white transition-colors">
                                            <Truck size={20} />
                                        </div>
                                        <span className="text-[10px] font-black bg-zinc-100 px-2 py-1 uppercase">{item.veiculo}</span>
                                    </div>
                                    <div className="space-y-1 mb-6">
                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Destino / TP</p>
                                        <h4 className="font-black text-lg leading-tight uppercase">{item.destino}</h4>
                                        <p className="text-sm font-medium text-zinc-500 italic">{item.tp}</p>
                                    </div>
                                    <div className="pt-4 border-t border-dashed border-zinc-200 flex justify-between items-end">
                                        <span className="text-xs font-bold text-zinc-400 uppercase">Valor Frete</span>
                                        <span className="text-2xl font-black tabular-nums">
                                            {item.preco.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </TabsContent>

                    {/* Conteúdo Last Mile */}
                    <TabsContent value="lastmile" className="space-y-6">
                        <div className="bg-amber-50 border-l-4 border-black p-6 mb-8">
                            <div className="flex gap-4">
                                <Info className="text-black shrink-0" size={20} />
                                <div>
                                    <h4 className="text-sm font-black uppercase">Como ler a tabela de Last Mile</h4>
                                    <p className="text-xs text-zinc-600 mt-1">
                                        Localize a faixa de quilometragem entre o <strong>Transit Point e o Cliente final</strong>.
                                        O valor aplicado será a <span className="font-bold underline">Tarifa Fixa + (Tarifa m³ × cubagem do pedido)</span>.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto border-2 border-black">
                            <table className="w-full border-collapse bg-white">
                                <thead>
                                    <tr className="bg-black text-white">
                                        <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest border-r border-zinc-800">Range KM</th>
                                        <th className="p-4 text-center text-[10px] font-black uppercase tracking-widest border-r border-zinc-800">Tarifa Fixa</th>
                                        {volumeHeaders.slice(1).map((h, i) => (
                                            <th key={i} className="p-4 text-center text-xs font-black uppercase tracking-widest border-r border-zinc-800 last:border-0 text-nowrap">
                                                {h} <span className="block text-[10px] font-light lowercase text-zinc-400">R$/m³</span>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-200">
                                    {lastMileData.map((row, idx) => (
                                        <tr key={idx} className="group hover:bg-zinc-50 transition-colors">
                                            <td className=" bg-white group-hover:bg-zinc-50 p-4 text-xs font-black italic uppercase border-r border-zinc-200 whitespace-nowrap shadow-[2px_0_0_0_#eee]">
                                                {row.range}
                                            </td>
                                            <td className="p-4 text-center font-bold text-sm text-black tabular-nums border-r border-zinc-100 bg-zinc-50 group-hover:bg-zinc-100">
                                                {row.fixo.toLocaleString('pt-br', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            {row.rates.map((rate, rIdx) => (
                                                <td key={rIdx} className="p-4 text-center text-xs tabular-nums border-r border-zinc-100 text-zinc-600 font-medium">
                                                    {rate.toLocaleString('pt-br', { minimumFractionDigits: 2 })}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* FAQ / Notas de Rodapé */}
                <div className="pt-12 border-t border-zinc-200 grid grid-cols-1 md:grid-cols-3 gap-12">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 font-black uppercase italic text-sm">
                            <Scale size={16} /> Regras de Cubagem
                        </div>
                        <p className="text-xs text-zinc-500 leading-relaxed">
                            A tarifação por m³ utiliza o fator de conversão padrão da POL. Pedidos com cubagem superior a 33.3m³ seguem tabela de lotação.
                        </p>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 font-black uppercase italic text-sm">
                            <Navigation size={16} /> Transit Points
                        </div>
                        <p className="text-xs text-zinc-500 leading-relaxed">
                            A quilometragem é calculada partindo da coordenada oficial do TP cadastrado.
                        </p>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 font-black uppercase italic text-sm">
                            <Calculator size={16} /> Impostos
                        </div>
                        <p className="text-xs text-zinc-500 leading-relaxed">
                            Todos os valores apresentados não contemplam ICMS e demais taxas operacionais (Ad Valorem e GRIS).
                        </p>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}