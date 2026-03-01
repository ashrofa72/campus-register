
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { updateUserProfile, createUserProfile } from '../firebase/firestoreService';
import Spinner from '../components/Spinner';
import type { User } from 'firebase/auth';

interface ProfilePageProps {
    isEditing?: boolean;
    onCancel?: () => void;
}

export default function ProfilePage({ isEditing = false, onCancel }: ProfilePageProps) {
    const { user, reloadProfile } = useAuth();
    
    // Initialize state
    const [studentName, setStudentName] = useState('');
    const [studentCode, setStudentCode] = useState('');
    const [studentClassroom, setStudentClassroom] = useState('');
    
    // Avatar state
    const [previewUrl, setPreviewUrl] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            setStudentName(user.profile?.studentName || user.displayName || '');
            setStudentCode(user.profile?.studentCode || '');
            setStudentClassroom(user.profile?.studentClassroom || '');
            setPreviewUrl(user.profile?.photoURL || user.photoURL || '');
        }
    }, [user]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            
            // Validate file size
            // Firestore documents are limited to 1MB. Base64 encoding adds ~33% overhead.
            // We limit input files to 750KB to ensure the entire profile document fits safely.
            if (file.size > 750 * 1024) {
                setError("حجم الصورة كبير جداً. يرجى استخدام صورة أقل من 750 كيلوبايت.");
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    setPreviewUrl(event.target.result as string);
                    setError(''); // Clear errors
                }
            };
            reader.onerror = () => {
                setError("فشل في قراءة ملف الصورة.");
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (!studentName.trim() || !studentCode.trim() || !studentClassroom.trim()) {
            setError('الاسم والكود والفصل الدراسي حقول مطلوبة.');
            return;
        }
        setLoading(true);
        setError('');

        if (!navigator.onLine) {
            setError('يبدو أنك غير متصل بالإنترنت. يرجى التحقق من اتصالك والمحاولة مرة أخرى.');
            setLoading(false);
            return;
        }

        try {
            // Use the previewUrl directly. It now contains either the existing URL 
            // or the new Base64 Data URI string.
            const photoURL = previewUrl || user.profile?.photoURL || user.photoURL || null;

            const profileData = {
                studentName: studentName.trim(),
                displayName: studentName.trim(), // Ensure displayName matches studentName
                email: user.email || "", // Ensure email is preserved/set
                studentCode: studentCode.trim(),
                studentClassroom: studentClassroom.trim(),
                photoURL: photoURL
            };

            // Determine if we are creating a new profile or updating
            const isNewProfile = !user.profile || !user.profile.createdAt;

            if (isNewProfile) {
                await createUserProfile(user as User, profileData);
            } else {
                await updateUserProfile(user.uid, profileData);
            }
            
            await reloadProfile(); 
            
            if (isEditing) {
                alert('تم تحديث الملف الشخصي بنجاح!');
                if (onCancel) onCancel();
            }
        } catch (err: any) {
            console.error("Failed to update profile", err);
            setError(err.message || 'فشل في حفظ الملف الشخصي. يرجى المحاولة مرة أخرى.');
        } finally {
            setLoading(false);
        }
    };

    const containerClasses = isEditing 
        ? "w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-12 border border-slate-100" 
        : "min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 p-4 font-sans";

    const formContent = (
        <main className={isEditing ? "" : "w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10 text-center border border-slate-100"}>
            <form onSubmit={handleSubmit} className="space-y-6 text-right">
                <div className="space-y-2 text-center mb-8">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                        {isEditing ? 'تعديل الملف الشخصي' : 'إكمال الملف الشخصي'}
                    </h2>
                    {!isEditing && (
                        <p className="text-slate-500 font-medium leading-relaxed">
                            مرحباً، {user?.displayName}! يرجى إدخال بياناتك لإكمال إعداد حسابك.
                        </p>
                    )}
                </div>

                {/* Avatar Upload Section */}
                <div className="flex flex-col items-center mb-8 space-y-4">
                    <div className="relative group cursor-pointer" onClick={triggerFileInput}>
                        <img 
                            src={previewUrl || `https://ui-avatars.com/api/?name=${studentName || 'User'}&background=random`} 
                            alt="Avatar Preview"
                            className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-xl bg-slate-200 transition-all duration-300 group-hover:opacity-90 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-blue-600 bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300">
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                            </svg>
                        </div>
                    </div>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept="image/*" 
                        className="hidden" 
                    />
                    <button 
                        type="button"
                        onClick={triggerFileInput}
                        className="text-sm text-blue-600 font-black hover:text-blue-500 transition-colors underline underline-offset-4 decoration-blue-200"
                    >
                        تغيير الصورة الشخصية
                    </button>
                </div>
                
                <div className="space-y-1">
                    <label htmlFor="studentName" className="block text-sm font-bold text-slate-700 mr-1">اسم الطالب</label>
                    <input
                        type="text"
                        id="studentName"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        placeholder="أدخل اسمك الكامل"
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
                        required
                    />
                </div>
                
                <div className="space-y-1">
                    <label htmlFor="studentCode" className="block text-sm font-bold text-slate-700 mr-1">كود الطالب</label>
                    <input
                        type="text"
                        id="studentCode"
                        value={studentCode}
                        onChange={(e) => setStudentCode(e.target.value)}
                        placeholder="أدخل كود الطالب الخاص بك"
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
                        required
                    />
                </div>

                <div className="space-y-1">
                    <label htmlFor="studentClassroom" className="block text-sm font-bold text-slate-700 mr-1">الفصل الدراسي</label>
                    <input
                        type="text"
                        id="studentClassroom"
                        value={studentClassroom}
                        onChange={(e) => setStudentClassroom(e.target.value)}
                        placeholder="مثال: فصل 5ب"
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium"
                        required
                    />
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-100 p-3 rounded-xl flex items-center gap-2 text-red-600 text-sm font-bold">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                            <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                        </svg>
                        {error}
                    </div>
                )}
                
                <div className="flex gap-4 pt-6">
                    {isEditing && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 py-4 px-6 rounded-2xl font-black text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all active:scale-95"
                        >
                            إلغاء
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 flex justify-center items-center py-4 px-6 rounded-2xl font-black text-lg text-white bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 hover:-translate-y-1 active:translate-y-0 active:scale-95 disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed"
                    >
                        {loading ? <Spinner className="w-6 h-6" /> : 'حفظ الملف الشخصي'}
                    </button>
                </div>
            </form>
        </main>
    );

    if (isEditing) {
        return <div className={containerClasses}>{formContent}</div>;
    }

    return (
        <div className={containerClasses}>
             <header className="text-center mb-10 space-y-2">
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">تسجيل الحضور</h1>
                <p className="text-slate-500 text-lg font-medium">نظام الحضور الذكي للحرم الجامعي</p>
            </header>
            {formContent}
             <footer className="text-center mt-12 text-sm text-slate-400 font-medium">
                <p>&copy; {new Date().getFullYear()} تسجيل الحضور في الحرم الجامعي. جميع الحقوق محفوظة.</p>
            </footer>
        </div>
    );
}
