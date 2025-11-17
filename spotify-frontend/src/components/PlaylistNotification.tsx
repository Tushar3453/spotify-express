'use client';

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export default function PlaylistNotification() {
    const [notification, setNotification] = useState<{message: string, link: string} | null>(null);

    useEffect(() => {
        const socket = io('http://localhost:8000'); 

        socket.on('playlist_created', (data) => {
            console.log("Notification received:", data);
            setNotification(data);
            setTimeout(() => setNotification(null), 5000);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    if (!notification) return null;

    return (
        <div className="fixed top-24 right-5 z-50 animate-bounce">
            <div className="bg-gray-800 border-l-4 border-green-500 text-white p-4 rounded shadow-xl max-w-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-bold text-sm">Activity Alert</p>
                        <p className="text-xs text-gray-300">{notification.message}</p>
                    </div>
                    {notification.link && (
                         <a href={notification.link} target="_blank" rel="noopener noreferrer" className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded-full ml-3 transition-colors">
                            View
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}