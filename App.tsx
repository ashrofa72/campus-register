import React, { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import CheckInPage from './pages/CheckInPage';
import ProfilePage from './pages/ProfilePage';
import Header from './components/Header';
import Spinner from './components/Spinner';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import OfflineBanner from './components/OfflineBanner';
import AttendanceHistoryPage from './pages/AttendanceHistoryPage';


export default function App() {
    const { user, loading, profileLoading } = useAuth();
    const isOnline = useOnlineStatus();
    const [currentPage, setCurrentPage] = useState<'checkin' | 'history'>('checkin');

    const renderContent = () => {
        if (loading || profileLoading) {
            return (
                <div className="min-h-screen w-full flex items-center justify-center bg-slate-100">
                    <Spinner className="w-16 h-16 text-blue-500" />
                </div>
            );
        }
        
        if (!user) {
            return <LoginPage />;
        }

        // A user needs to complete their profile if the studentCode is missing.
        // When offline, an existing user's profile might not load, making it seem incomplete.
        const needsProfileCompletion = !user.profile?.studentCode;

        // We only redirect to the profile page if the user is ONLINE and their profile is incomplete.
        // This is a critical check to prevent two scenarios:
        // 1. An existing user with a complete profile is not blocked or redirected just because they are temporarily offline.
        // 2. A new user is not sent to a non-functional profile page while they are offline.
        if (needsProfileCompletion && isOnline) {
            return <ProfilePage />;
        }

        return (
             <div className="min-h-screen w-full flex flex-col bg-slate-100 font-sans">
                <Header currentPage={currentPage} setCurrentPage={setCurrentPage} />
                <main className="flex-grow w-full flex flex-col items-center justify-center p-4">
                    {currentPage === 'checkin' && <CheckInPage />}
                    {currentPage === 'history' && <AttendanceHistoryPage />}
                    <footer className="text-center mt-8 text-sm text-slate-400">
                        <p>&copy; {new Date().getFullYear()} Campus Check-In. All rights reserved.</p>
                    </footer>
                </main>
            </div>
        );
    }

    return (
        <>
            {!isOnline && <OfflineBanner />}
            {renderContent()}
        </>
    );
}