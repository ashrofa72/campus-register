
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

    // Center Text
    const colorClass = distance <= targetRadius ? "text-green-500" : (distance > 30 ? "text-red-500" : "text-orange-500");
    const statusText = distance <= targetRadius ? "داخل المنطقة" : (distance > 30 ? "بعيد جداً" : "قريب من المنطقة");

    return (
        <div className="relative flex items-center justify-center w-44 h-44 transition-all duration-500">
            {/* SVG Container */}
            <svg
                height={radius * 2}
                width={radius * 2}
                className="transform -rotate-90 drop-shadow-sm"
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
                    className={`${colorClass} transition-all duration-700 ease-in-out`}
                />
            </svg>
            
            {/* Center Text */}
            <div className="absolute flex flex-col items-center justify-center text-slate-800">
                <div className="flex items-baseline gap-0.5">
                    <span className="text-4xl font-black tracking-tighter">
                        {distance.toFixed(1)}
                    </span>
                    <span className="text-sm font-bold text-slate-400">متر</span>
                </div>
                <span className={`text-[11px] uppercase font-black tracking-widest mt-2 px-2 py-0.5 rounded-full bg-white shadow-sm border border-slate-100 ${colorClass}`}>
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
            alert('يبدو أنك غير متصل بالإنترنت. يرجى التحقق من اتصالك لتسجيل حضورك.');
            return;
        }

        // Strict Distance Check before submitting
        const currentDistance = getDistance(location, SCHOOL_COORDINATES);
        if (type === 'check-in' && currentDistance > ALLOWED_RADIUS_METERS) {
            alert(`أنت بعيد جداً لتسجيل الدخول. يجب أن تكون ضمن مسافة ${ALLOWED_RADIUS_METERS} متر.`);
            return;
        }

        try {
            await logAttendance(
                user.uid, 
                type, 
                location, 
                user.profile?.studentName || user.displayName || undefined,
                user.profile?.email || user.email || undefined
            );
            setIsCheckedIn(type === 'check-in');
        } catch (e) {
            console.error(`Failed to ${type}`, e);
            alert(`حدث خطأ أثناء محاولة ${type === 'check-in' ? 'تسجيل الدخول' : 'تسجيل الخروج'}. يرجى المحاولة مرة أخرى.`);
        }
    }, [user, location]);


    const renderStatusContent = () => {
        switch (status) {
            case AttendanceStatus.PENDING:
                return {
                    icon: <IconSpinner className="w-24 h-24 text-slate-400" />,
                    title: "جاري تحديد الموقع...",
                    message: "يتم الآن الحصول على موقعك الدقيق.",
                    buttonText: "يرجى الانتظار...",
                    buttonDisabled: true,
                    buttonColor: "bg-slate-400",
                };
            case AttendanceStatus.ERROR:
                return {
                    icon: <IconXCircle className="w-24 h-24 text-red-500" />,
                    title: "خطأ في تحديد الموقع",
                    message: error,
                    buttonText: "إعادة المحاولة",
                    buttonDisabled: false,
                    buttonColor: "bg-blue-500 hover:bg-blue-600",
                    onClick: retry,
                };
            case AttendanceStatus.CHECKED_IN:
                return {
                    icon: <IconCheckCircle className="w-24 h-24 text-green-500" />,
                    title: "تم تسجيل الدخول",
                    message: "أنت متواجد حالياً في الحرم الجامعي.",
                    buttonText: "تسجيل الخروج",
                    buttonDisabled: false,
                    buttonColor: "bg-blue-500 hover:bg-blue-600",
                    onClick: () => handleAttendanceAction('check-out'),
                };
            case AttendanceStatus.IN_RANGE:
                return {
                    icon: <ProximityIndicator distance={distance || 0} />,
                    title: "لقد وصلت!",
                    message: "أنت الآن ضمن منطقة تسجيل الحضور.",
                    buttonText: "سجل حضورك الآن",
                    buttonDisabled: false,
                    buttonColor: "bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/30",
                    onClick: () => handleAttendanceAction('check-in'),
                };
            case AttendanceStatus.OUT_OF_RANGE:
                return {
                    icon: <ProximityIndicator distance={distance || 999} />,
                    title: "خارج النطاق",
                    message: `اقترب لمسافة ${ALLOWED_RADIUS_METERS} متر لتسجيل الحضور.`,
                    buttonText: "بعيد جداً لتسجيل الحضور",
                    buttonDisabled: true,
                    buttonColor: "bg-slate-200 text-slate-400 cursor-not-allowed",
                };
            default: return null;
        }
    };

    const content = renderStatusContent();

    return (
        <main className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-10 space-y-8 text-center border border-slate-100">
            {content && (
                <>
                    <div className="flex justify-center py-4 scale-100 hover:scale-110 transition-transform duration-500">
                        {content.icon}
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">{content.title}</h2>
                        <p className="text-slate-500 text-base font-medium leading-relaxed">{content.message}</p>
                    </div>
                </>
            )}

            {/* Technical Details Box */}
            <div className="bg-slate-50/50 p-5 rounded-3xl text-sm text-slate-600 space-y-3 text-right border border-slate-200/50 backdrop-blur-sm">
                <div className="flex justify-between items-center">
                    <span className="font-bold">الحالة:</span>
                    <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${status === AttendanceStatus.IN_RANGE || status === AttendanceStatus.CHECKED_IN ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-slate-200 text-slate-700 border border-slate-300'}`}>
                        {status}
                    </span>
                </div>
                 <div className="flex justify-between items-center">
                    <span className="font-bold">المسافة الحالية:</span>
                    <span className="font-mono font-bold text-slate-800">{distance !== null ? `${distance.toFixed(2)} م` : '--'}</span>
                </div>
                 <div className="flex justify-between items-center">
                    <span className="font-bold">النطاق المسموح:</span>
                    <span className="font-mono font-bold text-blue-600">{ALLOWED_RADIUS_METERS} م</span>
                </div>
            </div>

            {content && (
                <button
                    onClick={content.onClick}
                    disabled={content.buttonDisabled}
                    className={`w-full py-4 px-8 rounded-2xl font-black text-lg text-white shadow-xl focus:outline-none focus:ring-4 focus:ring-offset-2 transition-all duration-300 ${content.buttonColor} ${content.buttonDisabled ? 'opacity-50 grayscale' : 'hover:-translate-y-1 hover:shadow-2xl active:translate-y-0 active:scale-95'}`}
                >
                    {content.buttonText}
                </button>
            )}
        </main>
    );
}
