
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { updateUserProfile, createUserProfile } from '../firebase/firestoreService';
import Spinner from '../components/Spinner';
import type { User } from 'firebase/auth';

interface ProfilePageProps {
    isEditing?: boolean;
    onCancel?: () => void;
}

export default function ProfilePage({ isEditing = false, onCancel }: ProfilePageProps) {
    const { user, reloadProfile } = useAuth();
    
    // Initialize state
    const [studentName, setStudentName] = useState('');
    const [studentCode, setStudentCode] = useState('');
    const [studentClassroom, setStudentClassroom] = useState('');
    
    // Avatar state
    const [previewUrl, setPreviewUrl] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            setStudentName(user.profile?.studentName || user.displayName || '');
            setStudentCode(user.profile?.studentCode || '');
            setStudentClassroom(user.profile?.studentClassroom || '');
            setPreviewUrl(user.profile?.photoURL || user.photoURL || '');
        }
    }, [user]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            
            // Validate file size
            // Firestore documents are limited to 1MB. Base64 encoding adds ~33% overhead.
            // We limit input files to 750KB to ensure the entire profile document fits safely.
            if (file.size > 750 * 1024) {
                setError("Image size too large. For direct storage, please use an image under 750KB.");
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    setPreviewUrl(event.target.result as string);
                    setError(''); // Clear errors
                }
            };
            reader.onerror = () => {
                setError("Failed to read image file.");
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (!studentName.trim() || !studentCode.trim() || !studentClassroom.trim()) {
            setError('Name, Code, and Classroom are required.');
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
            // Use the previewUrl directly. It now contains either the existing URL 
            // or the new Base64 Data URI string.
            const photoURL = previewUrl || user.profile?.photoURL || user.photoURL || null;

            const profileData = {
                studentName: studentName.trim(),
                displayName: studentName.trim(), // Ensure displayName matches studentName
                email: user.email || "", // Ensure email is preserved/set
                studentCode: studentCode.trim(),
                studentClassroom: studentClassroom.trim(),
                photoURL: photoURL
            };

            // Determine if we are creating a new profile or updating
            const isNewProfile = !user.profile || !user.profile.createdAt;

            if (isNewProfile) {
                await createUserProfile(user as User, profileData);
            } else {
                await updateUserProfile(user.uid, profileData);
            }
            
            await reloadProfile(); 
            
            if (isEditing) {
                alert('Profile updated successfully!');
                if (onCancel) onCancel();
            }
        } catch (err: any) {
            console.error("Failed to update profile", err);
            setError(err.message || 'Failed to save profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const containerClasses = isEditing 
        ? "w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 md:p-8" 
        : "min-h-screen w-full flex flex-col items-center justify-center bg-slate-100 p-4 font-sans";

    const formContent = (
        <main className={isEditing ? "" : "w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 text-center"}>
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
                <div className="space-y-2 text-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-800">
                        {isEditing ? 'Edit Profile' : 'Complete Your Profile'}
                    </h2>
                    {!isEditing && (
                        <p className="text-slate-500 pb-2">
                            Welcome, {user?.displayName}! Please enter your details to finish setting up your account.
                        </p>
                    )}
                </div>

                {/* Avatar Upload Section */}
                <div className="flex flex-col items-center mb-6 space-y-3">
                    <div className="relative group cursor-pointer" onClick={triggerFileInput}>
                        <img 
                            src={previewUrl || `https://ui-avatars.com/api/?name=${studentName || 'User'}&background=random`} 
                            alt="Avatar Preview"
                            className="w-24 h-24 rounded-full object-cover border-4 border-slate-100 shadow-md bg-slate-200 transition-opacity group-hover:opacity-75"
                        />
                        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all">
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                            </svg>
                        </div>
                    </div>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept="image/*" 
                        className="hidden" 
                    />
                    <button 
                        type="button"
                        onClick={triggerFileInput}
                        className="text-sm text-blue-600 font-medium hover:text-blue-500"
                    >
                        Change Profile Picture
                    </button>
                </div>
                
                <div>
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
                
                <div>
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

                <div>
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
                
                <div className="flex space-x-3 pt-4">
                    {isEditing && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 py-3 px-4 rounded-lg font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 flex justify-center items-center py-3 px-4 rounded-lg font-semibold text-white bg-blue-500 hover:bg-blue-600 shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-150 disabled:bg-blue-300 disabled:cursor-not-allowed"
                    >
                        {loading ? <Spinner className="w-5 h-5" /> : 'Save Profile'}
                    </button>
                </div>
            </form>
        </main>
    );

    if (isEditing) {
        return <div className={containerClasses}>{formContent}</div>;
    }

    return (
        <div className={containerClasses}>
             <header className="text-center mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-800">Campus Check-In</h1>
                <p className="text-slate-500 mt-1">Smart Attendance System</p>
            </header>
            {formContent}
             <footer className="text-center mt-8 text-sm text-slate-400">
                <p>&copy; {new Date().getFullYear()} Campus Check-In. All rights reserved.</p>
            </footer>
        </div>
    );
}
