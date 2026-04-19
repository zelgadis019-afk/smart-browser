'use client'

import { useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import { Loader2, Mail, Lock, Eye, EyeOff, Globe } from 'lucide-react'

export default function AuthForm() {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/` }
        })
        if (error) throw error
        setMessage('Check your email to confirm your account!')
      } else if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        })
        if (error) throw error
        setMessage('Password reset link sent to your email!')
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-900/40">
            <Globe size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">AI Smart Browser</h1>
          <p className="text-slate-400 text-sm mt-1">Chat with any webpage</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl">
          <h2 className="text-base font-semibold text-white mb-5">
            {mode === 'login' ? 'Welcome back' : mode === 'signup' ? 'Create account' : 'Reset password'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Email */}
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                className="w-full pl-9 pr-3 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Password */}
            {mode !== 'reset' && (
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  minLength={8}
                  className="w-full pl-9 pr-9 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-400"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            )}

            {/* Error/Success */}
            {error && (
              <div className="p-3 bg-red-900/30 border border-red-800/50 rounded-xl text-sm text-red-400">
                {error}
              </div>
            )}
            {message && (
              <div className="p-3 bg-green-900/30 border border-green-800/50 rounded-xl text-sm text-green-400">
                {message}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-white rounded-xl text-sm font-medium transition-colors mt-1"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : null}
              {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
            </button>
          </form>

          {/* Links */}
          <div className="mt-5 space-y-2 text-center">
            {mode === 'login' && (
              <>
                <button
                  onClick={() => { setMode('reset'); setError(''); setMessage('') }}
                  className="text-xs text-slate-500 hover:text-slate-400 transition-colors"
                >
                  Forgot password?
                </button>
                <div className="text-xs text-slate-500">
                  No account?{' '}
                  <button
                    onClick={() => { setMode('signup'); setError(''); setMessage('') }}
                    className="text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Sign up
                  </button>
                </div>
              </>
            )}
            {mode === 'signup' && (
              <div className="text-xs text-slate-500">
                Have an account?{' '}
                <button
                  onClick={() => { setMode('login'); setError(''); setMessage('') }}
                  className="text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Sign in
                </button>
              </div>
            )}
            {mode === 'reset' && (
              <button
                onClick={() => { setMode('login'); setError(''); setMessage('') }}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Back to sign in
              </button>
            )}
          </div>

          {/* Guest mode notice */}
          <div className="mt-4 pt-4 border-t border-slate-700/50 text-center">
            <p className="text-xs text-slate-500">
              Sign in to save pages & access history.<br />
              Core features work without an account.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
