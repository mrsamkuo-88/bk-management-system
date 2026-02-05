import React, { useState } from 'react';
import { Mail, Lock, Loader, ArrowRight, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

interface LoginFormProps {
    onLoginSuccess: (user: any, roleType: 'VENDOR' | 'PART_TIMER' | 'ADMIN', profileData?: any) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Supabase Auth Login
            const user = await api.signIn(email, password);
            if (!user || !user.email) throw new Error("登入失敗");

            // 2. Determine Role based on Email
            const roleInfo = await api.getUserByEmail(user.email);

            // 3. Callback
            onLoginSuccess(user, roleInfo.type, roleInfo.data);

        } catch (err: any) {
            console.error(err);
            setError(err.message === "Invalid login credentials" ? "帳號或密碼錯誤" : "登入發生錯誤，請稍後再試");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-500">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">系統登入</h2>

            {error && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl mb-6 flex items-center gap-2 text-sm">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300 ml-1">Email</label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-3.5 text-slate-400" size={18} />
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-slate-900/50 border border-slate-700 text-white pl-11 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
                            placeholder="name@company.com"
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300 ml-1">Password</label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-3.5 text-slate-400" size={18} />
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-900/50 border border-slate-700 text-white pl-11 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-4 shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader className="animate-spin" size={20} /> : <>登入系統 <ArrowRight size={18} /></>}
                </button>
            </form>

            <div className="mt-6 text-center text-xs text-slate-500">
                僅限授權人員與合作廠商使用
            </div>
        </div>
    );
};

export default LoginForm;
