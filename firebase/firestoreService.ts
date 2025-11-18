
import { db } from './config';
import { doc, setDoc, getDoc, collection, addDoc, query, where, getDocs, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { StudentProfile, AttendanceRecord, Coordinates } from '../types';
import type { User } from 'firebase/auth';

export const getUserProfile = async (uid: string): Promise<StudentProfile | null> => {
    const userDocRef = doc(db, 'students', uid);
    try {
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            return userDocSnap.data() as StudentProfile;
        } else {
            return null;
        }
    } catch (error: any) {
        // If Firestore rules prevent reading a non-existent document (e.g. checking resource.data),
        // a permission-denied error is thrown. We treat this as "profile not found".
        if (error.code === 'permission-denied') {
            return null;
        }
        throw error;
    }
};

export const createUserProfile = async (user: User, additionalData?: Partial<StudentProfile>): Promise<StudentProfile> => {
    const userDocRef = doc(db, 'students', user.uid);
    
    // 1. Merge basic data
    const mergedData: any = {
        uid: user.uid,
        email: user.email || "",
        createdAt: serverTimestamp(),
        ...additionalData
    };

    // 2. Apply defaults SAFELY. 
    // We check if fields are missing or null in the *merged result* and fill them.
    // This protects against 'additionalData' explicitly passing null for required fields.
    
    if (!mergedData.displayName) {
        mergedData.displayName = user.displayName || mergedData.studentName || "Student";
    }

    if (!mergedData.studentName) {
        mergedData.studentName = mergedData.displayName;
    }

    // Ensure photoURL isn't accidentally nulled if the user has one in Auth, 
    // unless explicitly set to null in additionalData (which we respect if provided).
    // However, if additionalData didn't provide it, fall back to user.photoURL.
    if (mergedData.photoURL === undefined) {
         mergedData.photoURL = user.photoURL || null;
    }

    // Filter out undefined values to prevent Firestore errors
    const cleanData = Object.entries(mergedData).reduce((acc, [key, value]) => {
        if (value !== undefined) {
            (acc as any)[key] = value;
        }
        return acc;
    }, {} as any);

    // Use merge: true to prevent overwriting data if this runs concurrently with another update
    await setDoc(userDocRef, cleanData, { merge: true });
    
    // Return the profile with a client-side Timestamp to prevent UI crashes 
    // when accessing .toDate() before a re-fetch occurs.
    return {
        ...cleanData,
        createdAt: Timestamp.now() 
    } as unknown as StudentProfile;
};

export const updateUserProfile = async (uid:string, data: Partial<StudentProfile>): Promise<void> => {
    const userDocRef = doc(db, 'students', uid);
    // Ensure UID is included in the data payload.
    const payload = {
        ...data,
        uid: uid
    };
    
    // Sync display name if student name is updated but display name is missing/null
    // This fixes cases where displayName might end up as null in the database
    if (payload.studentName && !payload.displayName) {
        payload.displayName = payload.studentName;
    }
    
    // Filter out undefined values
    const cleanPayload = Object.entries(payload).reduce((acc, [key, value]) => {
        if (value !== undefined) {
            (acc as any)[key] = value;
        }
        return acc;
    }, {} as any);

    await setDoc(userDocRef, cleanPayload, { merge: true });
};


export const logAttendance = async (uid: string, type: 'check-in' | 'check-out', coordinates: Coordinates): Promise<void> => {
    const attendanceCollectionRef = collection(db, 'attendance');
    const newRecord = {
        uid,
        type,
        coordinates,
        timestamp: serverTimestamp(),
    };
    await addDoc(attendanceCollectionRef, newRecord);
};


export const getLastAttendance = async (uid: string): Promise<AttendanceRecord | null> => {
    const attendanceCollectionRef = collection(db, 'attendance');
    // NOTE: The query was modified to remove `orderBy` and `limit`. This avoids a Firestore error
    // that occurs when a composite index is not created for the query.
    const q = query(
      attendanceCollectionRef, 
      where("uid", "==", uid)
    );

    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
        return null;
    }
    
    const records: AttendanceRecord[] = [];
    querySnapshot.forEach(doc => {
        records.push(doc.data() as AttendanceRecord);
    });

    // Sort records to find the most recent one.
    records.sort((a, b) => {
        const timeA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : 0;
        const timeB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : 0;
        return timeB - timeA; // Descending to get latest first
    });
    
    return records[0] || null;
};

export const getAttendanceHistory = async (uid: string): Promise<AttendanceRecord[]> => {
    const attendanceCollectionRef = collection(db, 'attendance');
    // NOTE: The query was modified to remove `orderBy`.
    const q = query(
      attendanceCollectionRef, 
      where("uid", "==", uid)
    );

    const querySnapshot = await getDocs(q);
    const history: AttendanceRecord[] = [];
    querySnapshot.forEach((doc) => {
        history.push(doc.data() as AttendanceRecord);
    });

    // Sort records by timestamp descending on the client.
    history.sort((a, b) => {
        const timeA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : 0;
        const timeB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : 0;
        return timeB - timeA;
    });

    return history;
};
