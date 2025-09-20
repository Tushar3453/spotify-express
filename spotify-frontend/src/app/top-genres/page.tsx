'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession, signIn } from 'next-auth/react';

// --- TYPESCRIPT INTERFACE ---
interface Genre {
    name: string;
    count: number;
    percentage?: number;
}

export default function TopGenresPage() {
    type TimeRange = 'short_term' | 'medium_term' | 'long_term';

    const { data: session, status } = useSession();
    const [genres, setGenres] = useState<Genre[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeRange, setActiveRange] = useState<TimeRange>('short_term');

    const fetchedRangeRef = useRef<TimeRange | null>(null);

    useEffect(() => {
        if (status === 'authenticated' && session) {

            // Prevent re-fetching if the data for the current range has already been loaded
            if (fetchedRangeRef.current === activeRange) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);

            fetch(`http://127.0.0.1:8000/api/top-genres?time_range=${activeRange}`, {
                headers: {
                    'Authorization': `Bearer ${session.accessToken}`
                }
            })
            .then(res => {
                if (!res.ok) {
                    throw new Error("Failed to fetch top genres");
                }
                return res.json();
            })
            .then(data => {
                if (data && data.length > 0) {
                    const totalCount = data.reduce((sum: number, genre: Genre) => sum + genre.count, 0);
                    const genresWithPercentage = data.map((genre: Genre) => ({
                        ...genre,
                        percentage: totalCount > 0 ? Math.round((genre.count / totalCount) * 100) : 0
                    }));
                    setGenres(genresWithPercentage);
                    // On success, "remember" the range we just fetched
                    fetchedRangeRef.current = activeRange;
                } else {
                    setGenres([]);
                }
            })
            .catch(error => {
                console.error("Error fetching top genres:", error);
                // On error, reset the ref so we can try this range again
                fetchedRangeRef.current = null;
            })
            .finally(() => {
                setIsLoading(false);
            });
        } else if (status === 'unauthenticated') {
            setIsLoading(false);
        }
    }, [status, activeRange, session]);

    const TimeRangeButton = ({ range, label }: { range: TimeRange; label: string }) => (
        <button
            onClick={() => {
                if (activeRange !== range) {
                    setActiveRange(range);
                }
            }}
            className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${activeRange === range
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
        >
            {label}
        </button>
    );

    if (status === 'loading') {
        return <div className="bg-gray-900 min-h-screen flex items-center justify-center text-white">Loading session...</div>;
    }

    if (status === 'unauthenticated') {
        return (
            <div className="bg-gray-900 min-h-screen flex flex-col items-center justify-center text-white text-center px-4">
                <h1 className="text-3xl font-bold mb-4">Login Required</h1>
                <p className="text-gray-400 mb-8 max-w-md">Please login with Spotify to see your top genres.</p>
                <button onClick={() => signIn('spotify')} className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full transition-colors text-lg">
                    Login with Spotify
                </button>
            </div>
        );
    }
    
    const maxPercentage = genres.length > 0 ? Math.max(...genres.map(g => g.percentage || 0)) : 0;

    return (
        <div className="bg-gray-900 min-h-screen">
            <div className="max-w-5xl mx-auto px-4 pt-8 sm:pt-12 pb-12 sm:pb-20">
                <header className="text-center mb-10">
                    <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Your Top Genres</h1>
                    <p className="text-gray-400 mt-2">The genres that shape your unique taste.</p>
                </header>

                <div className="flex justify-center items-center gap-4 mb-8">
                    <TimeRangeButton range="short_term" label="Last 4 Weeks" />
                    <TimeRangeButton range="medium_term" label="Last 6 Months" />
                    <TimeRangeButton range="long_term" label="All Time" />
                </div>

                <main>
                    {isLoading ? (
                        <div className="text-center py-10 text-gray-400">Analyzing your genres...</div>
                    ) : (
                        <div className="bg-gray-800/50 p-4 sm:p-6 rounded-lg">
                            <div className="space-y-4">
                                {genres.length > 0 ? genres.map((genre) => (
                                    <div key={genre.name} className="flex items-center gap-4 animate-fade-in">
                                        <p className="w-1/3 sm:w-1/4 text-right font-semibold text-gray-300 capitalize truncate">
                                            {genre.name}
                                        </p>
                                        <div className="w-2/3 sm:w-3/4 bg-gray-700 rounded-full h-6">
                                            <div
                                                className="bg-gradient-to-r from-green-500 to-green-400 h-6 rounded-full flex items-center justify-end pr-3 transition-all duration-1000 ease-out"
                                                style={{ width: maxPercentage > 0 ? `${((genre.percentage || 0) / maxPercentage) * 100}%` : '0%' }}
                                            >
                                                <span className="text-xs font-bold text-black">{genre.percentage}%</span>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-center text-gray-400">Could not determine your top genres.</p>
                                )}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

