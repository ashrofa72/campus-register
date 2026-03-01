import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getAllAttendanceHistory, getAllStudentProfiles } from '../firebase/firestoreService';
import type { AttendanceRecord, StudentProfile } from '../types';
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

export default function AdminHistoryPage() {
    const { user } = useAuth();
    const [history, setHistory] = useState<AttendanceRecord[]>([]);
    const [profiles, setProfiles] = useState<Record<string, StudentProfile>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!user || user.profile?.role !== 'admin') return;

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [records, studentProfiles] = await Promise.all([
                    getAllAttendanceHistory(),
                    getAllStudentProfiles()
                ]);
                
                // Create a map of profiles for quick lookup
                const profileMap = studentProfiles.reduce((acc, p) => {
                    acc[p.uid] = p;
                    return acc;
                }, {} as Record<string, StudentProfile>);
                
                setProfiles(profileMap);
                setHistory(records);
            } catch (err) {
                console.error("Failed to fetch admin data:", err);
                setError("Could not load attendance history. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const enrichedHistory = useMemo(() => {
        return history.map(record => {
            const profile = profiles[record.uid];
            return {
                ...record,
                studentName: record.studentName || profile?.studentName || profile?.displayName || 'Unknown Student',
                studentEmail: record.studentEmail || profile?.email || 'No Email'
            };
        });
    }, [history, profiles]);

    const filteredHistory = useMemo(() => {
        if (!searchTerm) return enrichedHistory;
        const term = searchTerm.toLowerCase();
        return enrichedHistory.filter(record => 
            record.studentName?.toLowerCase().includes(term) || 
            record.studentEmail?.toLowerCase().includes(term) ||
            record.uid.toLowerCase().includes(term)
        );
    }, [enrichedHistory, searchTerm]);

    const groupedHistory = useMemo(() => {
        return filteredHistory.reduce((acc, record) => {
            if (!record.timestamp || typeof record.timestamp.toDate !== 'function') {
                return acc;
            }
            const date = record.timestamp.toDate();
            const dateKey = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();

            if (!acc[dateKey]) {
                acc[dateKey] = [];
            }
            acc[dateKey].push(record);
            return acc;
        }, {} as GroupedHistory);
    }, [filteredHistory]);

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
            <div className="w-full max-w-4xl flex justify-center items-center p-12">
                 <Spinner className="w-16 h-16 text-blue-500" />
            </div>
        );
    }

    if (error) {
        return <div className="w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl p-10 border border-slate-100"><p className="text-center text-red-500 font-bold">{error}</p></div>;
    }

    const sortedDateKeys = Object.keys(groupedHistory).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    return (
        <div className="w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-12 space-y-8 border border-slate-100">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">سجل حضور الطلاب (الإدارة)</h2>
                <p className="text-slate-500 font-medium">مراقبة وإدارة سجلات الحضور لجميع الطلاب</p>
            </div>
            
            <div className="relative group">
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                </div>
                <input
                    type="text"
                    placeholder="البحث بالاسم أو البريد الإلكتروني..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pr-12 pl-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium placeholder:text-slate-400"
                />
            </div>

            {filteredHistory.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <p className="text-slate-500 font-bold">لم يتم العثور على أي سجلات حضور.</p>
                </div>
            ) : (
                <div className="space-y-10">
                    {sortedDateKeys.map((dateKey) => (
                        <div key={dateKey} className="space-y-4">
                            <h3 className="text-xs font-black text-blue-600 uppercase tracking-[0.2em] pb-2 border-b-2 border-blue-50">
                                {getFormattedDateHeader(dateKey)}
                            </h3>
                            <ul className="divide-y divide-slate-50">
                                {groupedHistory[dateKey].map((record, index) => (
                                    <li key={index} className="py-6 flex items-center gap-5 group hover:bg-slate-50/50 px-3 rounded-3xl transition-all duration-200">
                                        {record.type === 'check-in' ? (
                                            <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center border border-green-100 shadow-sm group-hover:scale-110 transition-transform flex-shrink-0">
                                                <IconCheckIn className="w-8 h-8 text-green-600" />
                                            </div>
                                        ) : (
                                            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center border border-red-100 shadow-sm group-hover:scale-110 transition-transform flex-shrink-0">
                                                <IconCheckOut className="w-8 h-8 text-red-600" />
                                            </div>
                                        )}
                                        <div className="flex-grow min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <p className="font-black text-slate-900 text-lg truncate">
                                                    {record.studentName || 'طالب غير معروف'}
                                                </p>
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${record.type === 'check-in' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {record.type === 'check-in' ? 'دخول' : 'خروج'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-500 font-bold truncate">
                                                {record.studentEmail || record.uid}
                                            </p>
                                        </div>
                                        <div className="text-base text-slate-600 font-black bg-white border border-slate-100 shadow-sm px-4 py-2 rounded-xl whitespace-nowrap">
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
