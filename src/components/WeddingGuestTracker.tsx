'use client';

import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Guest {
    name: string;
    allowed: number;
    reserved: number;
    attending: string;
    message: string;
}

// Helper component for stat cards
const StatCard = ({ title, value, icon, titleClassName }: { title: string; value: number; icon: React.ReactNode, titleClassName?: string }) => (
    <div className="bg-gray-900/50 p-6 rounded-xl border border-yellow-500/30 shadow-lg flex items-center space-x-4">
        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-yellow-900/50 text-gold-texture">
            {icon}
        </div>
        <div>
            <p className={`text-sm font-medium ${titleClassName || 'text-yellow-300/70'}`}>{title}</p>
            <p className="text-3xl font-bold text-gold-texture">{value}</p>
        </div>
    </div>
);

// The main dashboard component
export function WeddingGuestTracker() {
    const [chartData, setChartData] = useState<{ name: string; value: number; }[]>([]);
    const [totals, setTotals] = useState({ coming: 0, notComing: 0, potential: 0 });
    const [specialMessages, setSpecialMessages] = useState<{ name: string; message: string; }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchGuestData = async () => {
            const sheetUrl = `https://corsproxy.io/?https://docs.google.com/spreadsheets/d/1qmH94UaJRNijT3QW97AgUT5Kc7m7Q-q5OZRlhFKziLs/export?format=csv`;

            try {
                const response = await fetch(sheetUrl);
                if (!response.ok) {
                    throw new Error(`Network response was not ok: ${response.statusText}`);
                }
                const csvText = await response.text();

                const rows = csvText.split('\n').filter(row => row.trim() !== '').slice(1);

                const guestList: Guest[] = rows
                    .map(row => {
                        const columns = row.split(',');

                        const cleanCell = (cellData: string) => (cellData || '').trim().replace(/\r/g, '').replace(/^"|"$/g, '');

                        const name = cleanCell(columns[0]);
                        if (!name) return null;

                        const guestsAllowedStr = cleanCell(columns[1]);
                        const rsvpStatusRaw = cleanCell(columns[2]);
                        const guestsReservedStr = cleanCell(columns[3]);
                        const specialMessage = cleanCell(columns[5]);

                        const allowed = parseInt(guestsAllowedStr, 10);
                        const reserved = parseInt(guestsReservedStr, 10);

                        const attendingStatus = rsvpStatusRaw === '' ? 'Potential' : rsvpStatusRaw;

                        return {
                            name: name,
                            allowed: !isNaN(allowed) ? allowed : 0,
                            reserved: !isNaN(reserved) ? reserved : 0,
                            attending: attendingStatus,
                            message: specialMessage,
                        };
                    })
                    .filter((guest): guest is Guest => guest !== null);

                processData(guestList);
                setError(null);

            } catch (err) {
                console.error('Error fetching guest list:', err);
                setError((err as Error).message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchGuestData();
        const interval = setInterval(fetchGuestData, 5000);

        return () => clearInterval(interval);
    }, []);

    const processData = (guestList: Guest[]) => {
        let comingCount = 0;
        let notComingCount = 0;
        let potentialCount = 0;

        const messages = guestList
            .filter(guest => guest.message && guest.message.trim() !== '')
            .map(guest => ({ name: guest.name, message: guest.message }))
            .reverse();
        setSpecialMessages(messages);

        guestList.forEach(guest => {
            if (guest.attending === "Yes") {
                comingCount += guest.reserved;
                const difference = guest.allowed - guest.reserved;
                if (difference > 0) {
                    notComingCount += difference;
                }
            } else if (guest.attending === "No") {
                notComingCount += guest.allowed;
            } else if (guest.attending === "Potential") {
                potentialCount += guest.allowed;
            }
        });

        setTotals({ coming: comingCount, notComing: notComingCount, potential: potentialCount });

        setChartData([
            { name: 'Confirmed Attending', value: comingCount },
            { name: 'Not Attending', value: notComingCount },
        ]);
    };

    const NOT_ATTENDING_COLOR = '#a0522d'; // Sienna color

    const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-black/80 p-3 rounded-lg shadow-lg border border-yellow-500/50">
                    <p className="font-bold text-gold-texture">{`${payload[0].name}`}</p>
                    <p className="text-white">{`Guests: ${payload[0].value}`}</p>
                </div>
            );
        }
        return null;
    };

    if (isLoading) {
        return (
            <div className="bg-black min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-semibold text-gold-texture">Loading Guest Data...</h2>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-black min-h-screen flex items-center justify-center p-4">
                <div className="text-center bg-red-900/50 p-8 rounded-lg shadow-md border border-red-500">
                    <h2 className="text-2xl font-semibold text-red-300">Failed to Load Data</h2>
                    <p className="text-red-400 mt-2">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-black min-h-screen flex flex-col items-center p-4 sm:p-6 md:p-8 font-sans">
            <div className="w-full max-w-5xl mx-auto">
                <header className="mb-8 text-center">
                    <h1 className="text-4xl font-bold text-gold-texture">Wedding Guest Attendance</h1>
                    <p className="text-lg text-yellow-300/70 mt-2">A summary of your RSVP responses.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <StatCard title="Confirmed Attending" value={totals.coming} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
                    <StatCard title="Not Attending" value={totals.notComing} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
                    <StatCard title="Potential Guests" value={totals.potential} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
                </div>

                <div className="bg-gray-900/50 p-6 rounded-xl border border-yellow-500/30 shadow-lg">
                    <h2 className="text-xl font-semibold text-gold-texture mb-4 text-center">RSVP Breakdown</h2>
                    <div style={{ width: '100%', height: 400 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <defs>
                                    <pattern id="goldTexture" patternUnits="objectBoundingBox" width="1" height="1">
                                        <image href="/goldtext.jpeg" x="0" y="0" width="1000" height="1000" preserveAspectRatio="xMidYMid slice" />
                                    </pattern>
                                </defs>
                                <Pie data={chartData} cx="50%" cy="50%" labelLine={false} outerRadius={150} fill="#8884d8" dataKey="value" label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => { const radius = innerRadius + (outerRadius - innerRadius) * 0.5; const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180)); const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180)); return (<text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontWeight="bold">{`${(percent * 100).toFixed(0)}%`}</text>);}}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.name === 'Confirmed Attending' ? 'url(#goldTexture)' : NOT_ATTENDING_COLOR} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ color: 'white' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {specialMessages.length > 0 && (
                    <div className="bg-gray-900/50 p-6 mt-8 rounded-xl border border-yellow-500/30 shadow-lg">
                        <h2 className="text-xl font-semibold text-gold-texture mb-6 text-center">Special Messages</h2>
                        <div className="space-y-4 max-h-80 overflow-y-auto p-2">
                            {specialMessages.map((msg, index) => (
                                <div key={index} className="bg-yellow-900/30 border-l-4 border-yellow-500 p-4 rounded-r-lg shadow-sm">
                                    <p className="italic text-white">"{msg.message}"</p>
                                    <p className="text-right text-sm font-medium text-gold-texture mt-2">- {msg.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}