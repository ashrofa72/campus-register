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
            return 'اليوم';
        }
        if (recordDate.getTime() === yesterday.getTime()) {
            return 'أمس';
        }
        return recordDate.toLocaleDateString('ar-EG', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatTime = (timestamp: Timestamp) => {
        if (!timestamp || typeof timestamp.toDate !== 'function') {
            return 'الوقت غير متاح';
        }
        return timestamp.toDate().toLocaleTimeString('ar-EG', {
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
        <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-10 space-y-8 border border-slate-100">
            <h2 className="text-3xl font-black text-slate-900 text-center tracking-tight">سجل الحضور</h2>
            {history.length === 0 ? (
                <p className="text-slate-500 text-center font-medium">ليس لديك أي سجلات حضور حتى الآن.</p>
            ) : (
                <div className="space-y-8">
                    {sortedDateKeys.map((dateKey) => (
                        <div key={dateKey} className="space-y-4">
                            <h3 className="text-xs font-black text-blue-600 uppercase tracking-[0.2em] pb-2 border-b-2 border-blue-50">
                                {getFormattedDateHeader(dateKey)}
                            </h3>
                            <ul className="divide-y divide-slate-50">
                                {groupedHistory[dateKey].map((record, index) => (
                                    <li key={index} className="py-5 flex items-center gap-4 group hover:bg-slate-50/50 px-2 rounded-2xl transition-all duration-200">
                                        {record.type === 'check-in' ? (
                                            <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center border border-green-100 shadow-sm group-hover:scale-110 transition-transform">
                                                <IconCheckIn className="w-7 h-7 text-green-600" />
                                            </div>
                                        ) : (
                                            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center border border-red-100 shadow-sm group-hover:scale-110 transition-transform">
                                                <IconCheckOut className="w-7 h-7 text-red-600" />
                                            </div>
                                        )}
                                        <div className="flex-grow">
                                            <p className="font-black text-slate-800 text-lg">
                                                {record.type === 'check-in' ? 'تم تسجيل الدخول' : 'تم تسجيل الخروج'}
                                            </p>
                                        </div>
                                        <div className="text-base text-slate-500 font-bold bg-slate-100 px-3 py-1 rounded-lg">
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
