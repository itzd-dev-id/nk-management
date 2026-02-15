'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapProps {
    lat: number;
    lon: number;
    address?: string;
}

const MapComponent: React.FC<MapProps> = ({ lat, lon, address }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<L.Map | null>(null);
    const markerInstance = useRef<L.Marker | null>(null);

    useEffect(() => {
        if (!mapRef.current) return;

        if (!mapInstance.current) {
            // Initialize map based on maucoding.com guide
            const osmUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
            const osmAttrib = 'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors';

            mapInstance.current = L.map(mapRef.current).setView([lat, lon], 15);

            L.tileLayer(osmUrl, {
                attribution: osmAttrib,
                maxZoom: 19,
            }).addTo(mapInstance.current);

            // Fix default marker icon issue in Next.js using CDN assets
            const icon = L.icon({
                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
            });

            markerInstance.current = L.marker([lat, lon], { icon }).addTo(mapInstance.current);
            if (address) {
                markerInstance.current.bindPopup(`<b>Lokasi Anda</b><br>${address}`).openPopup();
            }
        } else {
            // Update existing map
            mapInstance.current.setView([lat, lon], 15);
            if (markerInstance.current) {
                markerInstance.current.setLatLng([lat, lon]);
                if (address) {
                    markerInstance.current.setPopupContent(`<b>Lokasi Anda</b><br>${address}`).openPopup();
                }
            }
        }

        // Handle window resize to ensure map renders correctly
        const resizeObserver = new ResizeObserver(() => {
            mapInstance.current?.invalidateSize();
        });
        resizeObserver.observe(mapRef.current);

        return () => {
            resizeObserver.disconnect();
        };
    }, [lat, lon, address]);

    return (
        <div
            ref={mapRef}
            className="h-[200px] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner mt-3"
            style={{ zIndex: 0 }}
        />
    );
};

export default MapComponent;
