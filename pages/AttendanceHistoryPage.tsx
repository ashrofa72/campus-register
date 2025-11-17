import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getAttendanceHistory } from '../firebase/firestoreService';
import type { AttendanceRecord } from '../types';
import Spinner from '../components/Spinner';
import type { Timestamp } from 'firebase/firestore';

// Icon for check-in
const IconCheckIn = ({ className = '' }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0 3-3m0 0-3 3m3-3H15" />
    </svg>
);

// Icon for check-out
const IconCheckOut = ({ className = '' }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0-3-3m0 0-3 3m3-3H9" />
    </svg>
);

type GroupedHistory = {
    [date: string]: AttendanceRecord[];
};

export default function AttendanceHistoryPage() {
    const { user } = useAuth();
    const [history, setHistory] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;

        const fetchHistory = async () => {
            setLoading(true);
            setError(null);
            try {
                const records = await getAttendanceHistory(user.uid);
                setHistory(records);
            } catch (err) {
                console.error("Failed to fetch attendance history:", err);
                setError("Could not load your attendance history. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [user]);

    const groupedHistory = useMemo(() => {
        return history.reduce((acc, record) => {
            if (!record.timestamp || typeof record.timestamp.toDate !== 'function') {
                return acc;
            }
            const date = record.timestamp.toDate();
            // Use a consistent, time-zone-independent key for grouping
            const dateKey = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();

            if (!acc[dateKey]) {
                acc[dateKey] = [];
            }
            acc[dateKey].push(record);
            return acc;
        }, {} as GroupedHistory);
    }, [history]);

    const getFormattedDateHeader = (dateKey: string): string => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const recordDate = new Date(dateKey);

        if (recordDate.getTime() === today.getTime()) {
            return 'Today';
        }
        if (recordDate.getTime() === yesterday.getTime()) {
            return 'Yesterday';
        }
        return recordDate.toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatTime = (timestamp: Timestamp) => {
        if (!timestamp || typeof timestamp.toDate !== 'function') {
            return 'Time unavailable';
        }
        return timestamp.toDate().toLocaleTimeString(undefined, {
            hour: 'numeric',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="w-full max-w-lg flex justify-center items-center p-8">
                 <Spinner className="w-12 h-12 text-blue-500" />
            </div>
        );
    }

    if (error) {
        return <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 md:p-8 space-y-6"><p className="text-center text-red-500">{error}</p></div>;
    }

    const sortedDateKeys = Object.keys(groupedHistory).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    return (
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 md:p-8 space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 text-center">Attendance History</h2>
            {history.length === 0 ? (
                <p className="text-slate-500 text-center">You have no attendance records yet.</p>
            ) : (
                <div className="space-y-6">
                    {sortedDateKeys.map((dateKey) => (
                        <div key={dateKey}>
                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider pb-2 border-b border-slate-200">
                                {getFormattedDateHeader(dateKey)}
                            </h3>
                            <ul className="divide-y divide-slate-100">
                                {groupedHistory[dateKey].map((record, index) => (
                                    <li key={index} className="py-4 flex items-center space-x-4">
                                        {record.type === 'check-in' ? (
                                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                                <IconCheckIn className="w-6 h-6 text-green-600" />
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                                <IconCheckOut className="w-6 h-6 text-red-600" />
                                            </div>
                                        )}
                                        <div className="flex-grow">
                                            <p className="font-semibold text-slate-700 capitalize">
                                                {record.type === 'check-in' ? 'Checked In' : 'Checked Out'}
                                            </p>
                                        </div>
                                        <div className="text-sm text-slate-500 font-medium">
                                            {formatTime(record.timestamp as Timestamp)}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
