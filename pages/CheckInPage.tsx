import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';
import { getDistance } from '../utils/geolocation';
import { SCHOOL_COORDINATES, ALLOWED_RADIUS_METERS } from '../constants';
import { AttendanceStatus } from '../types';
import { logAttendance, getLastAttendance } from '../firebase/firestoreService';
import { useAuth } from '../contexts/AuthContext';

// --- ICONS ---
const IconCheckCircle = ({ className = '' }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);

const IconMapPin = ({ className = '' }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </svg>
);

const IconXCircle = ({ className = '' }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);

const IconSpinner = ({ className = '' }: { className?: string }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


export default function CheckInPage() {
    const { user } = useAuth();
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [isStatusLoading, setIsStatusLoading] = useState(true);
    const { location, error, loading: locationLoading } = useGeolocation();

    useEffect(() => {
        if (!user) return;
        const fetchLastStatus = async () => {
            setIsStatusLoading(true);
            try {
                const lastRecord = await getLastAttendance(user.uid);
                if (lastRecord && lastRecord.type === 'check-in') {
                    setIsCheckedIn(true);
                } else {
                    setIsCheckedIn(false);
                }
            } catch (error) {
                console.error("Failed to fetch last attendance status, defaulting to 'Checked Out'.", error);
                setIsCheckedIn(false);
            } finally {
                setIsStatusLoading(false);
            }
        };
        fetchLastStatus();
    }, [user]);

    const distance = useMemo<number | null>(() => {
        if (!location) return null;
        return getDistance(location, SCHOOL_COORDINATES);
    }, [location]);

    const status = useMemo<AttendanceStatus>(() => {
        if (locationLoading || isStatusLoading) return AttendanceStatus.PENDING;
        if (error) return AttendanceStatus.ERROR;
        if (isCheckedIn) return AttendanceStatus.CHECKED_IN;
        if (distance !== null && distance <= ALLOWED_RADIUS_METERS) {
            return AttendanceStatus.IN_RANGE;
        }
        return AttendanceStatus.OUT_OF_RANGE;
    }, [locationLoading, isStatusLoading, error, isCheckedIn, distance]);

    const handleAttendanceAction = useCallback(async (type: 'check-in' | 'check-out') => {
        if (!user || !location) return;

        if (!navigator.onLine) {
            alert('You seem to be offline. Please check your connection to record your attendance.');
            return;
        }

        try {
            await logAttendance(user.uid, type, location);
            setIsCheckedIn(type === 'check-in');
        } catch (e) {
            console.error(`Failed to ${type}`, e);
            alert(`There was an error trying to ${type}. Please try again.`);
        }
    }, [user, location]);


    const renderStatusContent = () => {
        switch (status) {
            case AttendanceStatus.PENDING:
                return {
                    icon: <IconSpinner className="w-24 h-24 text-slate-400" />,
                    title: "Loading...",
                    message: "Checking your location and attendance status. Please wait.",
                    buttonText: "Please Wait...",
                    buttonDisabled: true,
                    buttonColor: "bg-slate-400",
                };
            case AttendanceStatus.ERROR:
                return {
                    icon: <IconXCircle className="w-24 h-24 text-red-500" />,
                    title: "Location Error",
                    message: error,
                    buttonText: "Cannot Check In",
                    buttonDisabled: true,
                    buttonColor: "bg-red-400",
                };
            case AttendanceStatus.CHECKED_IN:
                return {
                    icon: <IconCheckCircle className="w-24 h-24 text-green-500" />,
                    title: "You are Checked In",
                    message: "Your attendance has been recorded. Have a great day!",
                    buttonText: "Check Out",
                    buttonDisabled: false,
                    buttonColor: "bg-blue-500 hover:bg-blue-600",
                    onClick: () => handleAttendanceAction('check-out'),
                };
            case AttendanceStatus.IN_RANGE:
                return {
                    icon: <IconMapPin className="w-24 h-24 text-blue-500" />,
                    title: "Welcome to Campus!",
                    message: "You are within the designated area. You can now check in.",
                    buttonText: "Check In",
                    buttonDisabled: false,
                    buttonColor: "bg-green-500 hover:bg-green-600",
                    onClick: () => handleAttendanceAction('check-in'),
                };
            case AttendanceStatus.OUT_OF_RANGE:
                return {
                    icon: <IconXCircle className="w-24 h-24 text-orange-500" />,
                    title: "Out of Range",
                    message: `You must be within ${ALLOWED_RADIUS_METERS} meters of the school to check in.`,
                    buttonText: "Out of Range",
                    buttonDisabled: true,
                    buttonColor: "bg-slate-400",
                };
            default: return null;
        }
    };

    const content = renderStatusContent();

    return (
        <main className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 md:p-8 space-y-6 text-center transform transition-all">
            {content && (
                <>
                    <div className="flex justify-center">{content.icon}</div>
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold text-slate-800">{content.title}</h2>
                        <p className="text-slate-500 text-sm">{content.message}</p>
                    </div>
                </>
            )}

            <div className="bg-slate-50 p-4 rounded-lg text-xs text-slate-600 space-y-2 text-left">
                <p><strong>Status:</strong> <span className="font-mono">{status}</span></p>
                <p>
                    <strong>Distance from School:</strong> 
                    <span className="font-mono ml-1">{distance !== null ? `${distance.toFixed(2)} meters` : 'N/A'}</span>
                </p>
                {location && (
                    <div>
                        <p><strong>Your Location:</strong></p>
                        <p className="font-mono">Lat: {location.latitude.toFixed(6)}, Lon: {location.longitude.toFixed(6)}</p>
                    </div>
                )}
            </div>

            {content && (
                <button
                    onClick={content.onClick}
                    disabled={content.buttonDisabled}
                    className={`w-full py-3 px-6 rounded-lg font-semibold text-white shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 ${content.buttonColor} ${content.buttonDisabled ? 'cursor-not-allowed opacity-70' : 'transform hover:-translate-y-0.5'}`}
                >
                    {content.buttonText}
                </button>
            )}
        </main>
    );
}