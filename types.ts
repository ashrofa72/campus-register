import type { User as FirebaseUser } from 'firebase/auth';
import type { Timestamp } from 'firebase/firestore';

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export enum AttendanceStatus {
  CHECKED_IN = 'Checked In',
  CHECKED_OUT = 'Checked Out',
  IN_RANGE = 'In Range',
  OUT_OF_RANGE = 'Out of Range',
  PENDING = 'Acquiring Location...',
  ERROR = 'Location Error',
}

export type StudentProfile = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  studentCode?: string;
  studentName?: string;
  studentClassroom?: string;
  createdAt: Timestamp;
};

export type AppUser = FirebaseUser & {
    profile?: StudentProfile;
};

export type AttendanceRecord = {
    uid: string;
    timestamp: Timestamp;
    type: 'check-in' | 'check-out';
    coordinates: Coordinates;
};