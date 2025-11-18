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
    reloadProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children?: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [profileLoading, setProfileLoading] = useState(false);

    const fetchProfile = async (firebaseUser: User) => {
        setProfileLoading(true);
        try {
            let profile = await getUserProfile(firebaseUser.uid);
            
            if (!profile) {
                // Try to create profile. This might fail if displayName is missing due to race conditions
                // in the initial signup flow if not handled in signUp().
                try {
                    // We attempt to create it, but if it fails due to permissions (e.g. missing required fields
                    // that aren't available on the user object yet), we just ignore it.
                    // The user will be redirected to ProfilePage to complete their profile anyway.
                    profile = await createUserProfile(firebaseUser);
                } catch (e: any) {
                    // If permission denied, it's likely because the display name hasn't propagated 
                    // to the user object yet or rules require fields we don't have. 
                    // We suppress this specific error to avoid alarming logs, as the app flow handles this.
                    if (e.code === 'permission-denied') {
                        console.log("AuthContext: Auto-creation skipped (waiting for user input/signup flow).");
                        profile = null; // Ensure profile is null so we don't set partial state
                    } else {
                        throw e;
                    }
                }
            }
            
            // Only attach profile if it exists
            if (profile) {
                setUser({ ...firebaseUser, profile });
            } else {
                setUser(firebaseUser);
            }
        } catch (error: any) {
            // A Firebase error with code 'unavailable' indicates an offline condition
            const isOfflineError = error.code === 'unavailable' || !navigator.onLine;

            if (isOfflineError) {
                console.warn(`AuthContext: Could not fetch user profile (offline).`);
                setUser(prevUser => {
                    if (prevUser?.profile) {
                        return { ...firebaseUser, profile: prevUser.profile };
                    }
                    return firebaseUser;
                });
            } else {
                // Log other errors, but don't block the user from being "logged in" (just without profile)
                console.error("AuthContext: Failed to fetch user profile.", error);
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
        
        // 1. Update the auth profile name
        await updateProfile(userCredential.user, { displayName });
        
        // 2. Create Firestore Profile explicitly with the known displayName.
        // This avoids the race condition where onAuthStateChanged triggers fetchProfile 
        // before the user object has the displayName.
        await createUserProfile(userCredential.user, { displayName });

        // 3. Force a profile fetch to ensure the app state is consistent
        await fetchProfile({ ...userCredential.user, displayName } as User);
    };

    const signOut = async () => {
        await firebaseSignOut(auth);
    };

    const reloadProfile = async () => {
        if (auth.currentUser) {
            await fetchProfile(auth.currentUser);
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

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
