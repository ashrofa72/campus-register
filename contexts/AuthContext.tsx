import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { getUserProfile, createUserProfile } from '../firebase/firestoreService';
import type { AppUser } from '../types';
import type { User } from 'firebase/auth';

interface AuthContextType {
    user: AppUser | null;
    loading: boolean;
    profileLoading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (displayName: string, email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    reloadProfile: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [profileLoading, setProfileLoading] = useState(false);

    const fetchProfile = async (firebaseUser: User) => {
        setProfileLoading(true);
        try {
            let profile = await getUserProfile(firebaseUser.uid);
            if (!profile) {
                profile = await createUserProfile(firebaseUser);
            }
            setUser({ ...firebaseUser, profile });
        } catch (error: any) {
            // A Firebase error with code 'unavailable' indicates an offline condition
            // where data could not be retrieved from the server or cache.
            const isOfflineError = error.code === 'unavailable' || !navigator.onLine;

            if (isOfflineError) {
                console.warn(`AuthContext: Could not fetch user profile because the client is offline. The app will proceed with cached auth data if available.`);
                // If we fail to fetch a profile due to being offline, we should not erase
                // a profile that might already be in our state from a previous successful fetch.
                setUser(prevUser => {
                    // If a previous user state with a profile exists, preserve it.
                    if (prevUser?.profile) {
                        return { ...firebaseUser, profile: prevUser.profile };
                    }
                    // Otherwise, set the user without a profile. This is for the initial load while offline.
                    return firebaseUser;
                });
            } else {
                console.error("AuthContext: Failed to fetch or create user profile.", error);
                // For any other type of error, we can't trust the profile state.
                setUser(firebaseUser);
            }
        } finally {
            setProfileLoading(false);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                await fetchProfile(firebaseUser);
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signIn = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
    };

    const signUp = async (displayName: string, email: string, password: string) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName });
        // onAuthStateChanged will handle creating the user profile in firestore via fetchProfile
    };

    const signOut = async () => {
        await firebaseSignOut(auth);
    };

    const reloadProfile = () => {
        if (auth.currentUser) {
            fetchProfile(auth.currentUser);
        }
    };

    const value = {
        user,
        loading,
        profileLoading,
        signIn,
        signUp,
        signOut,
        reloadProfile,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Fix: Export useAuth hook to be used by consumer components.
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
