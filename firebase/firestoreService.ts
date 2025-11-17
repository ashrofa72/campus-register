import { db } from './config';
import { doc, setDoc, getDoc, collection, addDoc, query, where, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore';
import type { AppUser, StudentProfile, AttendanceRecord, Coordinates } from '../types';
import type { User } from 'firebase/auth';

export const getUserProfile = async (uid: string): Promise<StudentProfile | null> => {
    const userDocRef = doc(db, 'students', uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
        return userDocSnap.data() as StudentProfile;
    } else {
        return null;
    }
};

export const createUserProfile = async (user: User): Promise<StudentProfile> => {
    const userDocRef = doc(db, 'students', user.uid);
    const newProfile: StudentProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: serverTimestamp(),
    };
    await setDoc(userDocRef, newProfile);
    return newProfile;
};

export const updateUserProfile = async (uid:string, data: Partial<StudentProfile>): Promise<void> => {
    const userDocRef = doc(db, 'students', uid);
    await setDoc(userDocRef, data, { merge: true });
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
    // The trade-off is that we now fetch all of a user's attendance records and sort
    // on the client to find the latest one. This is less efficient and may
    // increase read costs and latency. The ideal solution is to create the
    // required index in the Firebase console.
    // Index details: Collection 'attendance', Fields: 'uid' (Ascending), 'timestamp' (Descending).
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
    // NOTE: The query was modified to remove `orderBy`. This avoids a Firestore error
    // that occurs when a composite index is not created for the query.
    // Sorting is now handled on the client-side. The ideal solution is to create
    // the required index in the Firebase console.
    // Index details: Collection 'attendance', Fields: 'uid' (Ascending), 'timestamp' (Descending).
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
