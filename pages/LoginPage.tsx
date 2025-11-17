import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Spinner from '../components/Spinner';

export default function LoginPage() {
    const { signIn, signUp } = useAuth();
    const [isLoginView, setIsLoginView] = useState(true);
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState(''); // For sign up

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!navigator.onLine) {
            setError('You seem to be offline. Please check your connection and try again.');
            setLoading(false);
            return;
        }

        try {
            if (isLoginView) {
                if (!email || !password) {
                    setError('Please enter both email and password.');
                    setLoading(false);
                    return;
                }
                await signIn(email, password);
            } else {
                if (!displayName || !email || !password) {
                    setError('Please fill in all fields.');
                    setLoading(false);
                    return;
                }
                await signUp(displayName, email, password);
            }
        } catch (err: any) {
            switch (err.code) {
                case 'auth/invalid-email':
                    setError('Please enter a valid email address.');
                    break;
                case 'auth/user-not-found':
                case 'auth/invalid-credential':
                case 'auth/wrong-password':
                     setError('Invalid email or password.');
                     break;
                case 'auth/email-already-in-use':
                    setError('An account with this email already exists.');
                    break;
                case 'auth/weak-password':
                    setError('Password should be at least 6 characters long.');
                    break;
                default:
                    setError('An unexpected error occurred. Please try again.');
                    break;
            }
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    
    const toggleView = () => {
        setIsLoginView(!isLoginView);
        setError('');
        setEmail('');
        setPassword('');
        setDisplayName('');
    };

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-100 p-4 font-sans">
            <header className="text-center mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-800">Campus Check-In</h1>
                <p className="text-slate-500 mt-1">Smart Attendance System</p>
            </header>
            <main className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-slate-800">{isLoginView ? 'Welcome Back!' : 'Create an Account'}</h2>
                        <p className="text-slate-500">{isLoginView ? 'Please sign in to continue.' : 'Fill in the details to sign up.'}</p>
                    </div>
                    
                    {!isLoginView && (
                        <div>
                            <label htmlFor="displayName" className="sr-only">Full Name</label>
                            <input
                                type="text"
                                id="displayName"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="Full Name"
                                className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required={!isLoginView}
                            />
                        </div>
                    )}

                    <div>
                        <label htmlFor="email" className="sr-only">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email Address"
                            autoComplete="email"
                            className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="sr-only">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            autoComplete={isLoginView ? "current-password" : "new-password"}
                            className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                     
                    {error && <p className="text-red-500 text-xs text-left">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center items-center py-3 px-6 rounded-lg font-semibold text-white bg-blue-500 hover:bg-blue-600 shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-150 disabled:bg-blue-300 disabled:cursor-not-allowed"
                    >
                        {loading ? <Spinner className="w-5 h-5" /> : (isLoginView ? 'Sign In' : 'Sign Up')}
                    </button>
                </form>
                <div className="mt-6 text-sm text-center">
                    <button onClick={toggleView} className="font-medium text-blue-600 hover:text-blue-500">
                        {isLoginView ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                    </button>
                </div>
            </main>
             <footer className="text-center mt-8 text-sm text-slate-400">
                <p>&copy; {new Date().getFullYear()} Campus Check-In. All rights reserved.</p>
            </footer>
        </div>
    );
}