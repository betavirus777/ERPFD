'use client';

import React, { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { adminAPI } from '@/lib/api';
import { Shield, Lock, Key, CheckCircle2, Users, Layers } from 'lucide-react';
import Link from 'next/link';

interface Role {
    id: number;
    name: string;
    description: string;
    permissionCount: number;
    status: boolean;
}

const ROLE_COLORS: Record<string, { bg: string; icon: string; border: string }> = {
    'Super Admin': { bg: 'from-violet-600 to-purple-700', icon: 'bg-violet-500/20 text-violet-100', border: 'border-violet-500/30' },
    'HR': { bg: 'from-blue-600 to-cyan-600', icon: 'bg-blue-500/20 text-blue-100', border: 'border-blue-500/30' },
    'Finance': { bg: 'from-emerald-600 to-teal-600', icon: 'bg-emerald-500/20 text-emerald-100', border: 'border-emerald-500/30' },
    'Sales': { bg: 'from-orange-500 to-amber-500', icon: 'bg-orange-500/20 text-orange-100', border: 'border-orange-500/30' },
    'Operations': { bg: 'from-rose-500 to-pink-600', icon: 'bg-rose-500/20 text-rose-100', border: 'border-rose-500/30' },
    'Employee': { bg: 'from-slate-500 to-gray-600', icon: 'bg-slate-500/20 text-slate-100', border: 'border-slate-500/30' },
    'Client': { bg: 'from-sky-500 to-indigo-500', icon: 'bg-sky-500/20 text-sky-100', border: 'border-sky-500/30' },
    'Vendor': { bg: 'from-lime-500 to-green-600', icon: 'bg-lime-500/20 text-lime-100', border: 'border-lime-500/30' },
};

const DEFAULT_COLOR = { bg: 'from-[#1e3a5f] to-[#2d5a87]', icon: 'bg-white/20 text-white', border: 'border-white/20' };

export default function RolesPage() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            setLoading(true);
            const response = await adminAPI.getRoles();
            if (response?.data) setRoles(response.data);
        } catch (error) {
            console.error('Failed to fetch roles:', error);
        } finally {
            setLoading(false);
        }
    };

    const totalPermissions = roles.reduce((sum, r) => sum + (r.permissionCount || 0), 0);
    const activeRoles = roles.filter(r => r.status).length;

    return (
        <MainLayout>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Roles & Permissions</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage access control for all system roles.</p>
                    </div>
                </div>

                {/* Stats Bar */}
                {!loading && roles.length > 0 && (
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                                <Layers className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{roles.length}</p>
                                <p className="text-xs text-gray-500">Total Roles</p>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeRoles}</p>
                                <p className="text-xs text-gray-500">Active Roles</p>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                <Key className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalPermissions}</p>
                                <p className="text-xs text-gray-500">Total Permissions Granted</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Role Cards */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 h-52 animate-pulse" />
                        ))}
                    </div>
                ) : roles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                        <Users className="w-16 h-16 mb-4 text-gray-300" />
                        <p className="text-lg font-medium text-gray-500">No roles found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {roles.map((role) => {
                            const colors = ROLE_COLORS[role.name] || DEFAULT_COLOR;
                            return (
                                <div
                                    key={role.id}
                                    className={`relative flex flex-col rounded-2xl overflow-hidden border ${colors.border} shadow-sm hover:shadow-lg transition-shadow duration-200`}
                                >
                                    {/* Gradient header */}
                                    <div className={`bg-gradient-to-br ${colors.bg} px-5 pt-5 pb-8`}>
                                        <div className="flex items-start justify-between">
                                            <div className={`p-2.5 rounded-xl ${colors.icon}`}>
                                                <Shield className="w-5 h-5" />
                                            </div>
                                            <Badge
                                                className={
                                                    role.status
                                                        ? 'bg-white/20 text-white border-white/30 text-xs'
                                                        : 'bg-black/20 text-white/70 border-black/20 text-xs'
                                                }
                                                variant="outline"
                                            >
                                                {role.status ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>
                                        <h3 className="mt-4 text-lg font-semibold text-white leading-tight">{role.name}</h3>
                                        <p className="mt-1 text-sm text-white/70 line-clamp-2">{role.description || 'No description provided.'}</p>
                                    </div>

                                    {/* Footer */}
                                    <div className="bg-white dark:bg-gray-800 px-5 py-4 flex items-center justify-between -mt-3 rounded-t-2xl">
                                        <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                                            <Key className="w-4 h-4" />
                                            <span className="font-semibold text-gray-900 dark:text-white">{role.permissionCount}</span>
                                            <span>permissions</span>
                                        </div>
                                        <Link href={`/admin/roles/${role.id}`}>
                                            <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8">
                                                <Lock className="w-3.5 h-3.5" />
                                                Manage
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
