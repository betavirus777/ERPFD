"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock, Eye, EyeOff, Loader2, ArrowRight, ShieldCheck } from 'lucide-react'
import axios from 'axios'
import { toast } from '@/components/ui/use-toast'

const setPasswordSchema = z.object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
})

type SetPasswordFormData = z.infer<typeof setPasswordSchema>

export default function SetPasswordPage() {
    const router = useRouter()
    const { token, user, logout } = useAuthStore()
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const form = useForm<SetPasswordFormData>({
        resolver: zodResolver(setPasswordSchema),
        defaultValues: { password: '', confirmPassword: '' },
    })

    const onSubmit = async (data: SetPasswordFormData) => {
        if (!token) {
            setError('Session expired. Please login again.')
            return
        }

        setIsLoading(true)
        setError('')

        try {
            const response = await axios.post('/api/auth/set-password',
                { password: data.password },
                { headers: { Authorization: `Bearer ${token}` } }
            )

            if (response.data.success) {
                // Success
                toast({
                    title: "Password Set Successfully",
                    description: "Your account is now secured. Redirecting...",
                })
                setTimeout(() => {
                    router.push('/dashboard')
                }, 1500)
            } else {
                setError(response.data.error || 'Failed to set password')
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to set password. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex bg-[#f8fafc]">
            {/* Left Side - Enterprise Branding (Reuse from Login) */}
            <div className="hidden lg:flex lg:w-[55%] bg-gradient-to-br from-[#1e3a5f] via-[#163050] to-[#0f2340] relative overflow-visible">
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                }} />
                <div className="relative z-10 flex flex-col justify-between p-12 w-full h-full">
                    <div className="flex items-center">
                        <Image src="/logo2.png" alt="Logo" width={140} height={40} className="h-8 w-auto object-contain" />
                    </div>
                    <div className="max-w-lg mb-20">
                        <h1 className="text-4xl font-semibold text-white mb-4">Set Your Password</h1>
                        <p className="text-[#94a8c4] text-lg">
                            Secure your account by setting a strong password. This will be required for future logins.
                        </p>
                    </div>
                    <div className="text-[#5a7499] text-sm">© {new Date().getFullYear()} Forward Defense Cyber Security Pvt. Ltd.</div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex-1 flex items-center justify-center p-8 lg:p-16">
                <div className="w-full max-w-[420px]">
                    <div className="bg-white rounded-xl shadow-enterprise-lg border border-gray-100 p-8">
                        <div className="mb-8">
                            <div className="flex items-center gap-2 mb-2 text-[#1e3a5f]">
                                <ShieldCheck className="w-6 h-6" />
                                <h2 className="text-2xl font-semibold">Secure Account</h2>
                            </div>
                            <p className="text-gray-500 text-sm">
                                Create a new password for your account.
                            </p>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg text-sm mb-6">
                                {error}
                            </div>
                        )}

                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                            <div className="space-y-1.5">
                                <Label htmlFor="password">New Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-gray-400" />
                                    <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="pl-11 pr-11" {...form.register('password')} />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {form.formState.errors.password && <p className="text-red-500 text-xs mt-1">{form.formState.errors.password.message}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-gray-400" />
                                    <Input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} placeholder="••••••••" className="pl-11 pr-11" {...form.register('confirmPassword')} />
                                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {form.formState.errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{form.formState.errors.confirmPassword.message}</p>}
                            </div>

                            <Button type="submit" className="w-full h-11 bg-[#1e3a5f] hover:bg-[#163050] text-white" disabled={isLoading}>
                                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Set Password <ArrowRight className="ml-2 h-4 w-4" /></>}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
