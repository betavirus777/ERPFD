"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2, ArrowLeft, Save, Building2, CalendarDays, DollarSign, FileText } from 'lucide-react'
import { clientsAPI, mastersAPI, projectsAPI } from '@/lib/api'

const projectStatuses = [
    { id: 'planning', name: 'Planning', color: 'bg-slate-100 text-slate-700' },
    { id: 'active', name: 'Active', color: 'bg-blue-100 text-blue-700' },
    { id: 'on-hold', name: 'On Hold', color: 'bg-yellow-100 text-yellow-700' },
    { id: 'completed', name: 'Completed', color: 'bg-green-100 text-green-700' },
]

export default function CreateProjectPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [clients, setClients] = useState<any[]>([])
    const [currencies, setCurrencies] = useState<any[]>([])
    const [error, setError] = useState('')

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        client_id: '',
        currency_id: '',
        start_date: '',
        end_date: '',
        budget: '',
        project_type: 'fixed',
        priority: 'medium',
    })

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [clientsRes, currenciesRes] = await Promise.all([
                    clientsAPI.getAll({ status: true }),
                    mastersAPI.getCurrencies(),
                ])

                if (clientsRes?.success) setClients(clientsRes.data || [])
                if (currenciesRes?.success) setCurrencies(currenciesRes.data || [])
            } catch (error) {
                console.error('Failed to load form data:', error)
            }
        }
        fetchData()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.name || !formData.client_id || !formData.currency_id) {
            setError('Please fill in all required fields')
            return
        }

        setLoading(true)
        setError('')

        try {
            const payload = {
                name: formData.name,
                description: formData.description,
                client_id: parseInt(formData.client_id),
                currency_id: parseInt(formData.currency_id),
                start_date: formData.start_date || undefined,
                end_date: formData.end_date || undefined,
                budget: formData.budget || undefined,
                priority: formData.priority,
                project_type: formData.project_type,
            }

            const response = await projectsAPI.create(payload)
            if (response?.success) {
                router.push('/projects')
            } else {
                setError(response?.error || 'Failed to create project')
            }
        } catch (error: any) {
            console.error('Create project error:', error)
            setError(error.response?.data?.error || 'Failed to create project')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Create New Project</h1>
                    <p className="text-gray-500">Set up a new project for your team</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 text-sm">
                        {error}
                    </div>
                )}

                {/* Basic Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            Basic Information
                        </CardTitle>
                        <CardDescription>Enter the project details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Project Name <span className="text-red-500">*</span></Label>
                            <Input
                                id="name"
                                placeholder="Enter project name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Describe the project scope, objectives, and deliverables..."
                                rows={4}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Project Type</Label>
                                <Select
                                    value={formData.project_type}
                                    onValueChange={(value) => setFormData({ ...formData, project_type: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="fixed">Fixed Price</SelectItem>
                                        <SelectItem value="time-material">Time & Material</SelectItem>
                                        <SelectItem value="retainer">Retainer</SelectItem>
                                        <SelectItem value="internal">Internal</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Priority</Label>
                                <Select
                                    value={formData.priority}
                                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                Low
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="medium">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                                Medium
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="high">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                                High
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="critical">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                                Critical
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Client & Financial */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-indigo-600" />
                            Client & Financial
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="client">Client <span className="text-red-500">*</span></Label>
                                <Select
                                    value={formData.client_id}
                                    onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a client" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {clients.map((client) => (
                                            <SelectItem key={client.id} value={client.id.toString()}>
                                                {client.clientName || client.client_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="currency">Currency <span className="text-red-500">*</span></Label>
                                <Select
                                    value={formData.currency_id}
                                    onValueChange={(value) => setFormData({ ...formData, currency_id: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select currency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {currencies.map((curr) => (
                                            <SelectItem key={curr.id} value={curr.id.toString()}>
                                                {curr.currencyCode} - {curr.currencyName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="budget">Estimated Budget</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <Input
                                    id="budget"
                                    type="number"
                                    placeholder="0.00"
                                    className="pl-9"
                                    value={formData.budget}
                                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Timeline */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CalendarDays className="w-5 h-5 text-emerald-600" />
                            Timeline
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="start_date">Start Date</Label>
                                <Input
                                    id="start_date"
                                    type="date"
                                    value={formData.start_date}
                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end_date">Target End Date</Label>
                                <Input
                                    id="end_date"
                                    type="date"
                                    value={formData.end_date}
                                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-end gap-4 pt-4">
                    <Button variant="outline" type="button" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading} className="bg-[#1e3a5f] hover:bg-[#163050]">
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                <span className="text-white">Creating...</span>
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                <span className="text-white">Create Project</span>
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    )
}
