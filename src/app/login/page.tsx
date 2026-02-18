"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authAPI } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Mail, Lock, Shield, Loader2, ArrowRight } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

const otpSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  otp: z.string().min(6, 'OTP must be 6 digits'),
})

type LoginFormData = z.infer<typeof loginSchema>
type OtpFormData = z.infer<typeof otpSchema>

export default function LoginPage() {
  const router = useRouter()
  const { login, setRequires2FA } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [isOtpMode, setIsOtpMode] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: { email: '', otp: '' },
  })

  const handlePasswordLogin = async (data: LoginFormData) => {
    setIsLoading(true)
    setError('')

    try {
      const result = await authAPI.login(data.email, data.password)

      if (result.success && result.data) {
        const userData = result.data

        if (userData.google2fa === 1) {
          setRequires2FA(true, userData.qr_image, userData.secretKey, {
            ...userData,
            token: userData.token,
          })
          router.push('/verify-2fa')
        } else {
          login(userData, userData.token)
          router.push('/dashboard')
        }
      } else {
        setError(result.error || 'Login failed')
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } }
      setError(error.response?.data?.error || 'Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendOtp = async () => {
    const email = otpForm.getValues('email')
    if (!email || !z.string().email().safeParse(email).success) {
      otpForm.setError('email', { message: 'Please enter a valid email' })
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const result = await authAPI.sendOtp(email)
      if (result.success) {
        setOtpSent(true)
      } else {
        setError(result.error || 'Failed to send OTP')
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } }
      setError(error.response?.data?.error || 'Failed to send OTP')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpLogin = async (data: OtpFormData) => {
    setIsLoading(true)
    setError('')

    try {
      const result = await authAPI.loginWithOtp(data.email, data.otp)

      if (result.success && result.data) {
        if ((result.data as any).forceChangePassword) {
          login(result.data, result.data.token)
          router.push('/set-password')
          return
        }
        login(result.data, result.data.token)
        router.push('/dashboard')
      } else {
        setError(result.error || 'Invalid OTP')
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } }
      setError(error.response?.data?.error || 'Invalid OTP')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-[#f8fafc]">
      {/* Left Side - Enterprise Branding */}
      <div className="hidden lg:flex lg:w-[55%] bg-gradient-to-br from-[#1e3a5f] via-[#163050] to-[#0f2340] relative overflow-visible">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
        }} />

        {/* Gradient Overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#0f2340]/50 to-transparent" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="hidden lg:flex items-center">
            <Image
              src="/logo2.png"
              alt="Forward Defense"
              width={140}
              height={40}
              className="h-8 w-auto object-contain"
              priority
            />
          </div>

          {/* Main Content */}
          <div className="max-w-lg">
            <h1 className="text-4xl font-semibold text-white mb-4 leading-tight">
              Enterprise Resource Planning System
            </h1>
            <p className="text-[#94a8c4] text-lg leading-relaxed mb-8">
              Comprehensive workforce management platform for modern enterprises.
              Streamline HR operations, project management, and business analytics.
            </p>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4">
              {[
                'Employee Management',
                'Leave & Attendance',
                'Project Tracking',
                'Financial Reports',
                'Client Management',
                'Analytics Dashboard',
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-[#7a94b8]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#4a7ab8]" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="text-[#5a7499] text-sm">
            © {new Date().getFullYear()} Forward Defense Cyber Security Pvt. Ltd.
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-[420px]">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-10">
            <Image
              src="/logo2.png"
              alt="Forward Defense"
              width={180}
              height={54}
              className="h-12 w-auto"
              priority
            />
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-xl shadow-enterprise-lg border border-gray-100 p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-[#1e3a5f] mb-2">
                {isOtpMode ? 'Sign in with OTP' : 'Sign in'}
              </h2>
              <p className="text-gray-500 text-sm">
                {isOtpMode
                  ? 'We\'ll send a verification code to your email'
                  : 'Enter your credentials to access the system'}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg text-sm mb-6 animate-fade-in">
                {error}
              </div>
            )}

            {!isOtpMode ? (
              <form onSubmit={loginForm.handleSubmit(handlePasswordLogin)} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-gray-700 text-sm font-medium">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@company.com"
                      className="pl-11"
                      {...loginForm.register('email')}
                    />
                  </div>
                  {loginForm.formState.errors.email && (
                    <p className="text-red-500 text-xs mt-1">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-gray-700 text-sm font-medium">
                      Password
                    </Label>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-[#1e3a5f] hover:text-[#2d4a6f] font-medium"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="pl-11 pr-11"
                      {...loginForm.register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                    </button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-red-500 text-xs mt-1">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-[#1e3a5f] hover:bg-[#163050] text-white font-medium rounded-lg shadow-sm"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={otpForm.handleSubmit(handleOtpLogin)} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="otp-email" className="text-gray-700 text-sm font-medium">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-gray-400" />
                    <Input
                      id="otp-email"
                      type="email"
                      placeholder="name@company.com"
                      className="pl-11"
                      disabled={otpSent}
                      {...otpForm.register('email')}
                    />
                  </div>
                  {otpForm.formState.errors.email && (
                    <p className="text-red-500 text-xs mt-1">{otpForm.formState.errors.email.message}</p>
                  )}
                </div>

                {otpSent && (
                  <div className="space-y-1.5 animate-fade-in">
                    <Label htmlFor="otp" className="text-gray-700 text-sm font-medium">
                      Verification Code
                    </Label>
                    <div className="relative">
                      <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-gray-400" />
                      <Input
                        id="otp"
                        type="text"
                        placeholder="000000"
                        maxLength={6}
                        className="pl-11 text-center tracking-[0.5em] font-mono"
                        {...otpForm.register('otp')}
                      />
                    </div>
                    {otpForm.formState.errors.otp && (
                      <p className="text-red-500 text-xs mt-1">{otpForm.formState.errors.otp.message}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">Check your inbox for the 6-digit code</p>
                  </div>
                )}

                {!otpSent ? (
                  <Button
                    type="button"
                    onClick={handleSendOtp}
                    className="w-full h-11 bg-[#1e3a5f] hover:bg-[#163050] text-white font-medium rounded-lg shadow-sm"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        Send Verification Code
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <Button
                      type="submit"
                      className="w-full h-11 bg-[#1e3a5f] hover:bg-[#163050] text-white font-medium rounded-lg shadow-sm"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          Verify & Sign In
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="w-full text-sm text-[#1e3a5f] hover:text-[#2d4a6f] font-medium py-2"
                      disabled={isLoading}
                    >
                      Resend Code
                    </button>
                  </div>
                )}
              </form>
            )}

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-gray-400 uppercase tracking-wide">or</span>
              </div>
            </div>

            {/* Toggle OTP/Password */}
            <button
              type="button"
              onClick={() => {
                setIsOtpMode(!isOtpMode)
                setOtpSent(false)
                setError('')
              }}
              className="w-full py-2.5 px-4 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors font-medium"
            >
              {isOtpMode ? 'Sign in with Password' : 'Sign in with OTP'}
            </button>
          </div>

          {/* Desktop Footer */}
          <p className="hidden lg:block text-center text-xs text-gray-400 mt-8">
            Secure enterprise access • Protected by industry-standard encryption
          </p>
        </div>
      </div>
    </div>
  )
}
