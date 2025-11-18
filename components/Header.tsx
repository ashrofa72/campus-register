import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
    currentPage: 'checkin' | 'history' | 'profile';
    setCurrentPage: (page: 'checkin' | 'history' | 'profile') => void;
}

export default function Header({ currentPage, setCurrentPage }: HeaderProps) {
    const { user, signOut } = useAuth();
    const displayName = user?.profile?.studentName || user?.displayName;
    const photoURL = user?.profile?.photoURL || user?.photoURL;

    const navLinkClasses = (page: 'checkin' | 'history') => 
        `px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
            currentPage === page 
            ? 'bg-blue-500 text-white shadow-sm' 
            : 'text-slate-600 hover:bg-slate-200'
        }`;

    return (
        <header className="w-full p-4 bg-white/80 backdrop-blur-sm shadow-sm z-10 sticky top-0">
            <div className="max-w-4xl mx-auto flex justify-between items-center">
                <div className="flex items-center space-x-4">
                    <div className="text-xl font-bold text-slate-800">
                       Campus Check-In
                    </div>
                     <nav className="hidden sm:flex items-center space-x-2 bg-slate-100 p-1 rounded-lg">
                        <button onClick={() => setCurrentPage('checkin')} className={navLinkClasses('checkin')}>
                            Check-In
                        </button>
                        <button onClick={() => setCurrentPage('history')} className={navLinkClasses('history')}>
                            History
                        </button>
                    </nav>
                </div>
                {user && (
                    <div className="flex items-center space-x-4">
                        <button 
                            onClick={() => setCurrentPage('profile')}
                            className={`flex items-center space-x-2 p-1.5 rounded-lg transition-colors ${currentPage === 'profile' ? 'bg-slate-100 ring-2 ring-blue-500' : 'hover:bg-slate-100'}`}
                            title="Edit Profile"
                        >
                             <img 
                                src={photoURL || `https://ui-avatars.com/api/?name=${displayName}&background=random`} 
                                alt={displayName || 'User Avatar'}
                                className="w-8 h-8 rounded-full object-cover bg-slate-200"
                            />
                            <span className="text-sm font-medium text-slate-600 hidden sm:block">{displayName}</span>
                        </button>
                        <button
                            onClick={signOut}
                            className="px-3 py-1.5 text-sm font-semibold text-white bg-red-500 rounded-md shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                        >
                            Sign Out
                        </button>
                    </div>
                )}
            </div>
             <nav className="sm:hidden flex items-center space-x-2 bg-slate-100 p-1 rounded-lg mt-4 justify-center">
                <button onClick={() => setCurrentPage('checkin')} className={`${navLinkClasses('checkin')} flex-1`}>
                    Check-In
                </button>
                <button onClick={() => setCurrentPage('history')} className={`${navLinkClasses('history')} flex-1`}>
                    History
                </button>
            </nav>
        </header>
    );
}