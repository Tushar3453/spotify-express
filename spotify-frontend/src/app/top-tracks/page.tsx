'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Image from 'next/image';

interface Track {
  rank: number;
  id: string;
  name: string;
  artist: string;
  albumArt: string;
  spotifyUrl: string;
  rankChange: 'up' | 'down' | 'same' | 'new';
}

interface HistoryItem {
  _id: string;
  lastUpdated: string;
}

type TimeRange = 'short_term' | 'medium_term' | 'long_term';

export default function TopTracksPage() {
  const { data: session, status } = useSession();

  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeRange, setActiveRange] = useState<TimeRange>('short_term');
  const [historyDates, setHistoryDates] = useState<HistoryItem[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);

  /* Fetch history dates */
  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken) {
      setSelectedHistoryId('');

      fetch(
        `http://127.0.0.1:8000/api/top-tracks/history-dates?time_range=${activeRange}`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      )
        .then(res => res.json())
        .then(data => Array.isArray(data) && setHistoryDates(data))
        .catch(console.error);
    }
  }, [activeRange, status, session]);

  /* Fetch tracks */
  useEffect(() => {
    if (status !== 'authenticated' || !session?.accessToken) return;

    setIsLoading(true);

    let url = `http://127.0.0.1:8000/api/top-tracks?time_range=${activeRange}`;
    if (selectedHistoryId) url += `&historyId=${selectedHistoryId}`;

    fetch(url, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    })
      .then(res => res.json())
      .then(setTracks)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [activeRange, selectedHistoryId, status, session]);

  const getDropdownLabel = () => {
    if (!selectedHistoryId) return 'Current Top Tracks';
    const item = historyDates.find(h => h._id === selectedHistoryId);
    return item
      ? `${new Date(item.lastUpdated).toLocaleDateString()} • ${new Date(
          item.lastUpdated
        ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      : 'Select History';
  };

  if (status === 'loading') {
    return <div className="text-white text-center">Loading session...</div>;
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <button
          onClick={() => signIn('spotify')}
          className="bg-green-500 px-6 py-3 rounded-full text-white font-bold"
        >
          Login with Spotify
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen text-white p-6">
      <h1 className="text-4xl font-bold text-center mb-6">Your Top Tracks</h1>

      {/* Dropdown */}
      <div className="relative w-72 mx-auto mb-6">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full flex justify-between bg-gray-800 px-4 py-2 rounded-full"
        >
          <span className="truncate">{getDropdownLabel()}</span>
          <svg
            className={`w-4 h-4 transition-transform ${
              isDropdownOpen ? 'rotate-180' : ''
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isDropdownOpen && (
          <div className="absolute top-full mt-2 w-full bg-gray-800 rounded-xl z-10">
            <button
              onClick={() => {
                setSelectedHistoryId('');
                setIsDropdownOpen(false);
              }}
              className="w-full px-4 py-2 text-left hover:bg-gray-700"
            >
              Current Live Tracks
            </button>

            {historyDates.map(item => (
              <button
                key={item._id}
                onClick={() => {
                  setSelectedHistoryId(item._id);
                  setIsDropdownOpen(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-700"
              >
                {new Date(item.lastUpdated).toLocaleString()}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Track List */}
      {isLoading ? (
        <p className="text-center">Loading tracks...</p>
      ) : (
        tracks.map(track => (
          <div
            key={track.id}
            className="flex items-center bg-gray-800 p-3 rounded-lg mb-2"
          >
            <span className="w-8 text-center">{track.rank}</span>
            <Image
              src={track.albumArt}
              alt={`${track.name} album art`}
              width={48}
              height={48}
              className="rounded mx-4"
            />
            <div className="flex-grow">
              <p className="font-semibold">{track.name}</p>
              <p className="text-sm text-gray-400">{track.artist}</p>
            </div>
            <a href={track.spotifyUrl} target="_blank">🔗</a>
          </div>
        ))
      )}
    </div>
  );
}
