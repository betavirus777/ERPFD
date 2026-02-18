"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authAPI } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Loader2, KeyRound } from 'lucide-react'

const verifySchema = z.object({
  code: z.string().min(6, 'Please enter the 6-digit code').max(6, 'Code must be 6 digits'),
})

type VerifyFormData = z.infer<typeof verifySchema>

export default function Verify2FAPage() {
  const router = useRouter()
  const { qrCode, secretKey, tempUserData, complete2FA, logout } = useAuthStore()
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const form = useForm<VerifyFormData>({
    resolver: zodResolver(verifySchema),
    defaultValues: { code: '' }
  })

  // Redirect if no 2FA data
  React.useEffect(() => {
    if (!tempUserData) {
      router.push('/login')
    }
  }, [tempUserData, router])

  const handleVerify = async (data: VerifyFormData) => {
    if (!tempUserData || !secretKey) {
      setError('Session expired. Please login again.')
      return
    }

    setIsLoading(true)
    setError('')
    
    try {
      const response = await authAPI.verifyBarCode({
        google2fasecret: secretKey,
        emp_id: tempUserData.id as string,
        code: data.code,
      })
      
      if (response.data.success) {
        complete2FA()
        router.push('/dashboard')
      } else {
        setError(response.data.error || 'Invalid verification code')
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } }
      setError(error.response?.data?.error || 'Verification failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    logout()
    router.push('/login')
  }

  if (!tempUserData) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-blue-500/10 to-purple-500/10 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-lg relative z-10 border-slate-700/50 bg-slate-900/90 backdrop-blur-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-white">Two-Factor Authentication</CardTitle>
            <CardDescription className="text-slate-400">
              {qrCode 
                ? 'Scan the QR code with your authenticator app, then enter the code below'
                : 'Enter the verification code from your authenticator app'
              }
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {error && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {qrCode && (
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-white rounded-xl">
                <Image 
                  src={qrCode} 
                  alt="QR Code for 2FA" 
                  width={200}
                  height={200}
                  className="w-48 h-48"
                />
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-400 mb-2">Or enter this key manually:</p>
                <code className="px-3 py-2 bg-slate-800 rounded-lg text-emerald-400 font-mono text-sm">
                  {secretKey}
                </code>
              </div>
            </div>
          )}

          <form onSubmit={form.handleSubmit(handleVerify)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code" className="text-slate-300">Verification Code</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500 text-center text-xl tracking-widest"
                  maxLength={6}
                  {...form.register('code')}
                />
              </div>
              {form.formState.errors.code && (
                <p className="text-sm text-red-400">{form.formState.errors.code.message}</p>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

