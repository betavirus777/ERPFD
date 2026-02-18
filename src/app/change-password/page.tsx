"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/store/auth'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock, Eye, EyeOff, Loader2, Save } from 'lucide-react'
import axios from 'axios'
import { toast } from '@/components/ui/use-toast'

const changePasswordSchema = z.object({
    oldPassword: z.string().min(1, 'Old password is required'),
    password: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Confirm password is required'),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
})

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>

export default function ChangePasswordPage() {
    const router = useRouter()
    const { token, user } = useAuthStore()
    const [showOldPassword, setShowOldPassword] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const form = useForm<ChangePasswordFormData>({
        resolver: zodResolver(changePasswordSchema),
        defaultValues: { oldPassword: '', password: '', confirmPassword: '' },
    })

    const onSubmit = async (data: ChangePasswordFormData) => {
        if (!token) {
            toast({ title: "Error", description: "Session expired", variant: "destructive" })
            return
        }

        setIsLoading(true)
        setError('')

        try {
            const response = await axios.post('/api/auth/change-password',
                { oldPassword: data.oldPassword, newPassword: data.password },
                { headers: { Authorization: `Bearer ${token}` } }
            )

            if (response.data.success) {
                toast({
                    title: "Success",
                    description: "Password changed successfully",
                })
                form.reset()
            } else {
                setError(response.data.error || 'Failed to change password')
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to change password')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <MainLayout>
            <div className="p-6">
                <h1 className="text-2xl font-bold text-[#1e3a5f] mb-6">Change Password</h1>

                <div className="max-w-md bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg text-sm mb-6">
                            {error}
                        </div>
                    )}

                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                        <div className="space-y-1.5">
                            <Label htmlFor="oldPassword">Old Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input id="oldPassword" type={showOldPassword ? 'text' : 'password'} className="pl-10 pr-10" {...form.register('oldPassword')} />
                                <button type="button" onClick={() => setShowOldPassword(!showOldPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                                    {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {form.formState.errors.oldPassword && <p className="text-red-500 text-xs mt-1">{form.formState.errors.oldPassword.message}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="password">New Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input id="password" type={showPassword ? 'text' : 'password'} className="pl-10 pr-10" {...form.register('password')} />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {form.formState.errors.password && <p className="text-red-500 text-xs mt-1">{form.formState.errors.password.message}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} className="pl-10 pr-10" {...form.register('confirmPassword')} />
                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {form.formState.errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{form.formState.errors.confirmPassword.message}</p>}
                        </div>

                        <Button type="submit" className="w-full bg-[#1e3a5f] hover:bg-[#163050]" disabled={isLoading}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            Update Password
                        </Button>
                    </form>
                </div>
            </div>
        </MainLayout>
    )
}
