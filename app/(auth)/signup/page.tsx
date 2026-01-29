'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, UserPlus, Loader2, Info, CheckCircle2, Eye, EyeOff } from 'lucide-react';


export default function SignupPage() {
  // 🔒 YOUR LOGIC (unchanged)
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      router.push('/login?message=Account created successfully');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 🎨 GEMINI UI (adapted)
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#fafafa] p-4 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.04)_0%,transparent_50%)]" />

      <div className="relative w-full max-w-[480px] animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Branding */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative mb-6">
            <div className="absolute -inset-2 bg-gradient-to-tr from-emerald-600 to-teal-600 rounded-2xl blur-xl opacity-20" />
            <div className="relative w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center shadow-2xl border border-white/10">
              <div className="w-7 h-7 border-[4px] border-white rounded-[3px] rotate-45" />
            </div>
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900">
            AI MINDMAP CANVAS
          </h1>
       
        </div>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-2xl border border-white rounded-[2.5rem] shadow-[0_32px_80px_-20px_rgba(0,0,0,0.08)] p-8 sm:p-12">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-slate-900">Get Started</h2>
            <p className="text-slate-500 text-sm mt-2">
              Create your intelligence workspace
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600">
                <Info size={18} />
                <p className="text-xs font-bold">{error}</p>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="name@company.com"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white"
                />
              </div>
            </div>

            {/* Password */}
           <div className="relative">
  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />

  <input
    type={showPassword ? 'text' : 'password'}
    required
    value={formData.password}
    onChange={(e) =>
      setFormData({ ...formData, password: e.target.value })
    }
    placeholder="Minimum 8 characters"
    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 pl-12 pr-12 text-sm font-medium text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white"
  />

  <button
    type="button"
    onClick={() => setShowPassword((v) => !v)}
    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
  >
    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
  </button>
</div>


            {/* Confirm Password */}
            <div className="relative">
  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />

  <input
    type={showConfirmPassword ? 'text' : 'password'}
    required
    value={formData.confirmPassword}
    onChange={(e) =>
      setFormData({ ...formData, confirmPassword: e.target.value })
    }
    placeholder="Confirm password"
    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 pl-12 pr-12 text-sm font-medium text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white"
  />

  <button
    type="button"
    onClick={() => setShowConfirmPassword((v) => !v)}
    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
  >
    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
  </button>
</div>


            {/* Terms */}
            <div className="py-2 flex items-start gap-2 text-slate-500 text-[10px] px-1">
              <CheckCircle2 size={12} className="text-emerald-500 mt-0.5" />
              <p>
                By creating an account, you agree to our Terms of Service and
                Privacy Policy.
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-2xl py-4 font-bold text-sm shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  <span>Create Account</span>
                  <UserPlus size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-100 text-center">
            <p className="text-slate-500 text-sm">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-blue-600 font-bold hover:underline"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
