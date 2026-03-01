import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Spinner from '../components/Spinner';

export default function LoginPage() {
    const { signIn, signUp } = useAuth();
    const [isLoginView, setIsLoginView] = useState(true);
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState(''); // For sign up

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!navigator.onLine) {
            setError('يبدو أنك غير متصل بالإنترنت. يرجى التحقق من اتصالك والمحاولة مرة أخرى.');
            setLoading(false);
            return;
        }

        try {
            if (isLoginView) {
                if (!email || !password) {
                    setError('يرجى إدخال البريد الإلكتروني وكلمة المرور.');
                    setLoading(false);
                    return;
                }
                await signIn(email, password);
            } else {
                if (!displayName || !email || !password) {
                    setError('يرجى ملء جميع الحقول.');
                    setLoading(false);
                    return;
                }
                await signUp(displayName, email, password);
            }
        } catch (err: any) {
            switch (err.code) {
                case 'auth/invalid-email':
                    setError('يرجى إدخال بريد إلكتروني صحيح.');
                    break;
                case 'auth/user-not-found':
                case 'auth/invalid-credential':
                case 'auth/wrong-password':
                     setError('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
                     break;
                case 'auth/email-already-in-use':
                    setError('هذا الحساب موجود بالفعل.');
                    break;
                case 'auth/weak-password':
                    setError('يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.');
                    break;
                default:
                    setError('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
                    break;
            }
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    
    const toggleView = () => {
        setIsLoginView(!isLoginView);
        setError('');
        setEmail('');
        setPassword('');
        setDisplayName('');
    };

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 p-4 font-sans selection:bg-blue-100">
            <header className="text-center mb-10 space-y-2">
                <div className="inline-block px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-black uppercase tracking-widest mb-4 border border-blue-100">
                    نظام ذكي • آمن • سريع
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">تسجيل الحضور</h1>
                <p className="text-slate-500 text-lg font-medium">نظام الحضور الذكي للحرم الجامعي</p>
            </header>
            <main className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10 border border-slate-100">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="text-center space-y-2 mb-8">
                        <h2 className="text-3xl font-black text-slate-800">{isLoginView ? 'مرحباً بعودتك!' : 'إنشاء حساب جديد'}</h2>
                        <p className="text-slate-500 font-medium leading-relaxed">{isLoginView ? 'يرجى تسجيل الدخول للمتابعة إلى حسابك.' : 'املأ البيانات التالية لإنشاء حسابك الجديد.'}</p>
                    </div>
                    
                    {!isLoginView && (
                        <div className="space-y-1">
                            <label htmlFor="displayName" className="text-sm font-bold text-slate-700 mr-1">الاسم الكامل</label>
                            <input
                                type="text"
                                id="displayName"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="أدخل اسمك الكامل"
                                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400 font-medium"
                                required={!isLoginView}
                            />
                        </div>
                    )}

                    <div className="space-y-1">
                        <label htmlFor="email" className="text-sm font-bold text-slate-700 mr-1">البريد الإلكتروني</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="example@email.com"
                            autoComplete="email"
                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400 font-medium"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label htmlFor="password" className="text-sm font-bold text-slate-700 mr-1">كلمة المرور</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            autoComplete={isLoginView ? "current-password" : "new-password"}
                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400 font-medium"
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

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center items-center py-4 px-6 rounded-2xl font-black text-lg text-white bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 hover:-translate-y-1 active:translate-y-0 active:scale-95 disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed"
                    >
                        {loading ? <Spinner className="w-6 h-6" /> : (isLoginView ? 'تسجيل الدخول' : 'إنشاء حساب')}
                    </button>
                </form>
                <div className="mt-8 text-sm text-center">
                    <button onClick={toggleView} className="font-bold text-blue-600 hover:text-blue-500 transition-colors underline underline-offset-4 decoration-blue-200 hover:decoration-blue-500">
                        {isLoginView ? "ليس لديك حساب؟ سجل الآن مجاناً" : "لديك حساب بالفعل؟ سجل دخولك الآن"}
                    </button>
                </div>
            </main>
             <footer className="text-center mt-12 text-sm text-slate-400 font-medium">
                <p>&copy; {new Date().getFullYear()} تسجيل الحضور في الحرم الجامعي. جميع الحقوق محفوظة.</p>
            </footer>
        </div>
    );
}