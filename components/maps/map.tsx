'use client';

import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';

export default function MapaBrasil({ 
    geojsonData, 
    selectedState, 
    estadosAtendidos, 
    ufMapper, 
    onStateClick 
}: any) {
    // 1. Garante que o código só execute no CLIENTE
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Corrige bug de ícones do Leaflet no Next.js
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });
    }, []);

    if (!mounted) return null;

    const mapStyle = (feature: any) => {
        const uf = ufMapper[feature.properties.name];
        const isSelected = selectedState === uf;
        const isServed = estadosAtendidos.includes(uf);

        return {
            fillColor: isSelected ? '#276EF1' : isServed ? '#000000' : '#E4E4E7',
            weight: 1,
            opacity: 1,
            color: 'white',
            fillOpacity: isSelected ? 0.9 : 1,
        };
    };

    const onEachState = (feature: any, layer: any) => {
        layer.on({
            click: () => {
                const uf = ufMapper[feature.properties.name];
                onStateClick(uf, feature.properties.name);
            },
            mouseover: (e: any) => {
                const layer = e.target;
                layer.setStyle({ fillOpacity: 0.7 });
            },
            mouseout: (e: any) => {
                const layer = e.target;
                layer.setStyle({ fillOpacity: 1 });
            }
        });
    };

    return (
        <div className="absolute inset-0 w-full h-full">
            <MapContainer 
                // A key garante que o Leaflet destrua a instância antiga 
                // se qualquer coisa crítica mudar, evitando o erro de appendChild
                key={mounted ? "map-ready" : "map-loading"}
                center={[-15.78, -47.92]} 
                zoom={4} 
                className="h-full w-full outline-none"
                style={{ background: '#F0F0F0' }}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; CARTO'
                />
                {geojsonData && (
                    <GeoJSON 
                        data={geojsonData} 
                        style={mapStyle} 
                        onEachFeature={onEachState} 
                    />
                )}
            </MapContainer>
        </div>
    );
}