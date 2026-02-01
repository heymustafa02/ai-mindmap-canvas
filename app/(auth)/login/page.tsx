'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, Loader2, Info, Eye, EyeOff } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const message = searchParams.get('message');
    if (message) {
      setSuccess(message);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      router.push('/canvas');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#fafafa] p-4 overflow-hidden">
      {/* Background decor */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.04)_0%,transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(99,102,241,0.04)_0%,transparent_50%)]" />

      <div className="relative w-full max-w-[480px] animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Branding */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative mb-6">
            <div className="absolute -inset-2 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl blur-xl opacity-20" />
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
            <h2 className="text-2xl font-bold text-slate-900">Welcome Back</h2>
            <p className="text-slate-500 text-sm mt-2">
              Login to continue building
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600">
                <Info size={18} />
                <p className="text-xs font-bold">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-50 border border-green-100 rounded-2xl text-green-700 text-xs font-bold">
                {success}
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">
                Email Address
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
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 focus:bg-white"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">
                Password
              </label>

              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />

                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-12 text-sm font-medium text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 focus:bg-white"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
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
                  <span>Sign In</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-100 text-center">
            <p className="text-slate-500 text-sm">
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                className="text-blue-600 font-bold hover:underline"
              >
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}