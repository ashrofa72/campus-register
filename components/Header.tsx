import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
    currentPage: 'checkin' | 'history' | 'profile' | 'admin';
    setCurrentPage: (page: 'checkin' | 'history' | 'profile' | 'admin') => void;
}

export default function Header({ currentPage, setCurrentPage }: HeaderProps) {
    const { user, signOut } = useAuth();
    const displayName = user?.profile?.studentName || user?.displayName;
    const photoURL = user?.profile?.photoURL || user?.photoURL;
    const isAdmin = user?.profile?.role === 'admin';

    const navLinkClasses = (page: 'checkin' | 'history' | 'admin') => 
        `px-4 py-2 text-sm font-bold rounded-lg transition-all duration-200 ${
            currentPage === page 
            ? 'bg-blue-600 text-white shadow-md scale-105' 
            : 'text-slate-600 hover:bg-white hover:text-blue-600 hover:shadow-sm'
        }`;

    return (
        <header className="w-full py-4 px-6 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm z-50 sticky top-0">
            <div className="max-w-6xl mx-auto flex justify-between items-center gap-6">
                <div className="flex items-center gap-8">
                    <div className="text-2xl font-black text-blue-600 tracking-tight">
                       Campus <span className="text-slate-800">Check-In</span>
                    </div>
                     <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200">
                        <button onClick={() => setCurrentPage('checkin')} className={navLinkClasses('checkin')}>
                            تسجيل الحضور
                        </button>
                        <button onClick={() => setCurrentPage('history')} className={navLinkClasses('history')}>
                            السجل
                        </button>
                        {isAdmin && (
                            <button onClick={() => setCurrentPage('admin')} className={navLinkClasses('admin')}>
                                الإدارة
                            </button>
                        )}
                    </nav>
                </div>
                {user && (
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setCurrentPage('profile')}
                            className={`flex items-center gap-3 px-3 py-1.5 rounded-xl transition-all duration-200 ${currentPage === 'profile' ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200' : 'hover:bg-slate-100 text-slate-600'}`}
                            title="تعديل الملف الشخصي"
                        >
                             <img 
                                src={photoURL || `https://ui-avatars.com/api/?name=${displayName}&background=random`} 
                                alt={displayName || 'User Avatar'}
                                className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm bg-slate-200"
                            />
                            <span className="text-sm font-bold hidden lg:block">{displayName}</span>
                        </button>
                        <button
                            onClick={signOut}
                            className="px-4 py-2 text-sm font-bold text-white bg-red-500 rounded-xl shadow-sm hover:bg-red-600 hover:shadow-md active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                            تسجيل الخروج
                        </button>
                    </div>
                )}
            </div>
             <nav className="md:hidden flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200 mt-4 justify-center">
                <button onClick={() => setCurrentPage('checkin')} className={`${navLinkClasses('checkin')} flex-1`}>
                    تسجيل الحضور
                </button>
                <button onClick={() => setCurrentPage('history')} className={`${navLinkClasses('history')} flex-1`}>
                    السجل
                </button>
                {isAdmin && (
                    <button onClick={() => setCurrentPage('admin')} className={`${navLinkClasses('admin')} flex-1`}>
                        الإدارة
                    </button>
                )}
            </nav>
        </header>
    );
}