'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import Canvas from '@/components/Canvas';
import QueryBar from '@/components/QueryBar';

export default function CanvasPage() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    useEffect(() => {
        const verifyAuth = async () => {
            try {
                const response = await fetch('/api/auth/verify');

                if (!response.ok) {
                    router.push('/login');
                    return;
                }

                setIsAuthenticated(true);
            } catch (error) {
                console.error('Auth verification error:', error);
                router.push('/login');
            } finally {
                setIsLoading(false);
            }
        };

        verifyAuth();
    }, [router]);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
            });

            if (response.ok) {
                router.push('/login');
            } else {
                console.error('Logout failed');
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setIsLoggingOut(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="relative w-screen h-screen overflow-hidden">
            {/* Logout Button */}
            <div className="absolute top-6 right-6 z-[1000]">
                <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-sm font-bold shadow-lg transition-all disabled:opacity-50 border border-white/10"
                    title="Logout"
                >
                    <LogOut size={16} />
                    <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
                </button>
            </div>

            <Canvas />
            <QueryBar />
        </div>
    );
}
