
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';
import { getDistance } from '../utils/geolocation';
import { SCHOOL_COORDINATES, ALLOWED_RADIUS_METERS } from '../constants';
import { AttendanceStatus } from '../types';
import { logAttendance, getLastAttendance } from '../firebase/firestoreService';
import { useAuth } from '../contexts/AuthContext';

// --- COMPONENTS ---

const ProximityIndicator = ({ distance }: { distance: number }) => {
    // Configuration for visual feedback
    const visualMaxDistance = 50; // The distance at which the circle starts filling up (in meters)
    const targetRadius = ALLOWED_RADIUS_METERS; 
    
    // Calculate progress percentage (0 to 1)
    // 0% when distance >= visualMaxDistance
    // 100% when distance <= targetRadius
    let progress = 0;
    if (distance <= targetRadius) {
        progress = 1;
    } else if (distance < visualMaxDistance) {
        // Linear interpolation between targetRadius and visualMaxDistance
        const range = visualMaxDistance - targetRadius;
        const covered = visualMaxDistance - distance;
        progress = covered / range;
    }

    // SVG Geometry
    const radius = 50; // visual radius in px
    const strokeWidth = 8;
    const normalizedRadius = radius - strokeWidth / 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - progress * circumference;

    // Dynamic Styling
    let colorClass = "text-orange-500"; // Default approaching color
    let statusText = "Approaching";

    if (distance <= targetRadius) {
        colorClass = "text-green-500";
        statusText = "In Zone";
    } else if (distance > 30) {
        colorClass = "text-red-400";
        statusText = "Too Far";
    }

    return (
        <div className="relative flex items-center justify-center w-40 h-40 transition-all duration-300">
            {/* SVG Container */}
            <svg
                height={radius * 2}
                width={radius * 2}
                className="transform -rotate-90"
            >
                {/* Background Track */}
                <circle
                    stroke="currentColor"
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                    className="text-slate-100"
                />
                {/* Progress Indicator */}
                <circle
                    stroke="currentColor"
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference + ' ' + circumference}
                    style={{ strokeDashoffset }}
                    strokeLinecap="round"
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                    className={`${colorClass} transition-all duration-500 ease-out`}
                />
            </svg>
            
            {/* Center Text */}
            <div className="absolute flex flex-col items-center justify-center text-slate-700">
                <span className="text-3xl font-bold tracking-tight">
                    {distance.toFixed(1)}<span className="text-sm font-normal text-slate-400">m</span>
                </span>
                <span className={`text-[10px] uppercase font-bold tracking-widest mt-1 ${colorClass}`}>
                    {statusText}
                </span>
            </div>
        </div>
    );
};


// --- ICONS ---
const IconCheckCircle = ({ className = '' }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
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
    const { location, error, loading: locationLoading, retry } = useGeolocation();

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

        // Strict Distance Check before submitting
        const currentDistance = getDistance(location, SCHOOL_COORDINATES);
        if (type === 'check-in' && currentDistance > ALLOWED_RADIUS_METERS) {
            alert(`You are too far to check in. You must be within ${ALLOWED_RADIUS_METERS} meters.`);
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
                    title: "Locating...",
                    message: "Acquiring your precise location.",
                    buttonText: "Please Wait...",
                    buttonDisabled: true,
                    buttonColor: "bg-slate-400",
                };
            case AttendanceStatus.ERROR:
                return {
                    icon: <IconXCircle className="w-24 h-24 text-red-500" />,
                    title: "Location Error",
                    message: error,
                    buttonText: "Retry Location",
                    buttonDisabled: false,
                    buttonColor: "bg-blue-500 hover:bg-blue-600",
                    onClick: retry,
                };
            case AttendanceStatus.CHECKED_IN:
                return {
                    icon: <IconCheckCircle className="w-24 h-24 text-green-500" />,
                    title: "Checked In",
                    message: "You are currently present on campus.",
                    buttonText: "Check Out",
                    buttonDisabled: false,
                    buttonColor: "bg-blue-500 hover:bg-blue-600",
                    onClick: () => handleAttendanceAction('check-out'),
                };
            case AttendanceStatus.IN_RANGE:
                return {
                    icon: <ProximityIndicator distance={distance || 0} />,
                    title: "You're Here!",
                    message: "You are within the check-in zone.",
                    buttonText: "Check In Now",
                    buttonDisabled: false,
                    buttonColor: "bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/30",
                    onClick: () => handleAttendanceAction('check-in'),
                };
            case AttendanceStatus.OUT_OF_RANGE:
                return {
                    icon: <ProximityIndicator distance={distance || 999} />,
                    title: "Out of Range",
                    message: `Move within ${ALLOWED_RADIUS_METERS}m to check in.`,
                    buttonText: "Too Far to Check In",
                    buttonDisabled: true,
                    buttonColor: "bg-slate-200 text-slate-400 cursor-not-allowed",
                };
            default: return null;
        }
    };

    const content = renderStatusContent();

    return (
        <main className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 md:p-8 space-y-6 text-center transform transition-all duration-300">
            {content && (
                <>
                    <div className="flex justify-center py-2 scale-100 hover:scale-105 transition-transform duration-300">
                        {content.icon}
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold text-slate-800">{content.title}</h2>
                        <p className="text-slate-500 text-sm font-medium">{content.message}</p>
                    </div>
                </>
            )}

            {/* Technical Details Box */}
            <div className="bg-slate-50 p-3 rounded-xl text-xs text-slate-500 space-y-1 text-left border border-slate-100">
                <div className="flex justify-between items-center">
                    <span className="font-semibold">Status:</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${status === AttendanceStatus.IN_RANGE || status === AttendanceStatus.CHECKED_IN ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                        {status}
                    </span>
                </div>
                 <div className="flex justify-between items-center">
                    <span className="font-semibold">Distance:</span>
                    <span className="font-mono">{distance !== null ? `${distance.toFixed(2)}m` : '--'}</span>
                </div>
                 <div className="flex justify-between items-center">
                    <span className="font-semibold">Limit:</span>
                    <span className="font-mono">{ALLOWED_RADIUS_METERS}m</span>
                </div>
            </div>

            {content && (
                <button
                    onClick={content.onClick}
                    disabled={content.buttonDisabled}
                    className={`w-full py-3.5 px-6 rounded-xl font-bold text-white shadow-md focus:outline-none focus:ring-4 focus:ring-offset-2 transition-all duration-200 ${content.buttonColor} ${content.buttonDisabled ? '' : 'hover:-translate-y-0.5 active:translate-y-0'}`}
                >
                    {content.buttonText}
                </button>
            )}
        </main>
    );
}
