import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { updateUserProfile } from '../firebase/firestoreService';
import Spinner from '../components/Spinner';

export default function ProfilePage() {
    const { user, reloadProfile } = useAuth();
    const [studentName, setStudentName] = useState(user?.displayName || '');
    const [studentCode, setStudentCode] = useState('');
    const [studentClassroom, setStudentClassroom] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (!studentName.trim() || !studentCode.trim() || !studentClassroom.trim()) {
            setError('All fields are required.');
            return;
        }
        setLoading(true);
        setError('');

        if (!navigator.onLine) {
            setError('You seem to be offline. Please check your connection and try again.');
            setLoading(false);
            return;
        }

        try {
            await updateUserProfile(user.uid, { 
                studentName: studentName.trim(),
                studentCode: studentCode.trim(),
                studentClassroom: studentClassroom.trim(),
            });
            reloadProfile(); // This will trigger a re-render in App.tsx and show the CheckInPage
        } catch (err) {
            console.error("Failed to update profile", err);
            setError('Failed to save profile. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-100 p-4 font-sans">
             <header className="text-center mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-800">Campus Check-In</h1>
                <p className="text-slate-500 mt-1">Smart Attendance System</p>
            </header>
            <main className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 text-center">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2 text-left">
                        <h2 className="text-2xl font-bold text-slate-800 text-center">Complete Your Profile</h2>
                        <p className="text-slate-500 text-center pb-4">
                            Welcome, {user?.displayName}! Please enter your details to finish setting up your account.
                        </p>
                    </div>
                    
                    <div className="text-left">
                        <label htmlFor="studentName" className="block text-sm font-medium text-slate-700 mb-1">Student Name</label>
                        <input
                            type="text"
                            id="studentName"
                            value={studentName}
                            onChange={(e) => setStudentName(e.target.value)}
                            placeholder="Enter your full name"
                            className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                    
                    <div className="text-left">
                        <label htmlFor="studentCode" className="block text-sm font-medium text-slate-700 mb-1">Student Code</label>
                        <input
                            type="text"
                            id="studentCode"
                            value={studentCode}
                            onChange={(e) => setStudentCode(e.target.value)}
                            placeholder="Enter your student code"
                            className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>

                    <div className="text-left">
                        <label htmlFor="studentClassroom" className="block text-sm font-medium text-slate-700 mb-1">Classroom</label>
                        <input
                            type="text"
                            id="studentClassroom"
                            value={studentClassroom}
                            onChange={(e) => setStudentClassroom(e.target.value)}
                            placeholder="e.g., Class 5B"
                            className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>

                    {error && <p className="text-red-500 text-xs text-left">{error}</p>}
                    
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center items-center py-3 px-6 rounded-lg font-semibold text-white bg-blue-500 hover:bg-blue-600 shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-150 disabled:bg-blue-300 disabled:cursor-not-allowed !mt-6"
                    >
                        {loading ? <Spinner className="w-5 h-5" /> : 'Save and Continue'}
                    </button>
                </form>
            </main>
             <footer className="text-center mt-8 text-sm text-slate-400">
                <p>&copy; {new Date().getFullYear()} Campus Check-In. All rights reserved.</p>
            </footer>
        </div>
    );
}