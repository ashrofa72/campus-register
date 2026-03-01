import type { User as FirebaseUser } from 'firebase/auth';
import type { Timestamp } from 'firebase/firestore';

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export enum AttendanceStatus {
  CHECKED_IN = 'تم تسجيل الدخول',
  CHECKED_OUT = 'تم تسجيل الخروج',
  IN_RANGE = 'داخل النطاق',
  OUT_OF_RANGE = 'خارج النطاق',
  PENDING = 'جاري تحديد الموقع...',
  ERROR = 'خطأ في تحديد الموقع',
}

export type StudentProfile = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  studentCode?: string;
  studentName?: string;
  studentClassroom?: string;
  role?: 'admin' | 'student';
  createdAt: Timestamp;
};

export type AppUser = FirebaseUser & {
    profile?: StudentProfile;
};

export type AttendanceRecord = {
    uid: string;
    studentName?: string;
    studentEmail?: string;
    timestamp: Timestamp;
    type: 'check-in' | 'check-out';
    coordinates: Coordinates;
};