'use client';

import React, { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { adminAPI } from '@/lib/api';
import { Save, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';

interface Permission {
    id: number;
    name: string;
    moduleId: number;
    moduleName: string;
}

export default function ManageRolePermissionsPage() {
    const { toast } = useToast();
    const params = useParams();
    const router = useRouter();
    const roleId = Number(params.id);

    const [permissions, setPermissions] = useState<Record<string, Permission[]>>({});
    const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [roleName, setRoleName] = useState('');

    useEffect(() => {
        if (roleId) {
            fetchData();
        }
    }, [roleId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [permsRes, rolePermsRes, rolesRes] = await Promise.all([
                adminAPI.getAllPermissions(),
                adminAPI.getRolePermissions(roleId),
                adminAPI.getRoles()
            ]);

            if (permsRes?.data) {
                setPermissions(permsRes.data);
            }

            if (rolePermsRes?.data) {
                setSelectedPermissions(rolePermsRes.data);
            }

            if (rolesRes?.data) {
                const role = rolesRes.data.find((r: any) => r.id === roleId);
                if (role) setRoleName(role.name);
            }

        } catch (error) {
            console.error('Failed to fetch data:', error);
            toast({
                title: "Error",
                description: "Failed to load permissions data",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePermission = (id: number) => {
        setSelectedPermissions(prev =>
            prev.includes(id)
                ? prev.filter(p => p !== id)
                : [...prev, id]
        );
    };

    const handleSelectAllModule = (modulePerms: Permission[]) => {
        const ids = modulePerms.map(p => p.id);
        const allSelected = ids.every(id => selectedPermissions.includes(id));

        if (allSelected) {
            // Deselect all
            setSelectedPermissions(prev => prev.filter(id => !ids.includes(id)));
        } else {
            // Select all
            const newIds = ids.filter(id => !selectedPermissions.includes(id));
            setSelectedPermissions(prev => [...prev, ...newIds]);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await adminAPI.updateRolePermissions(roleId, selectedPermissions);
            toast({
                title: "Success",
                description: "Permissions updated successfully",
                variant: "default", // or just omit variant for default
            });
            router.refresh();
            router.push('/admin/roles');
        } catch (error) {
            console.error('Failed to save permissions:', error);
            toast({
                title: "Error",
                description: "Failed to update permissions",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-96">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="space-y-6 max-w-5xl mx-auto pb-20">
                <div className="flex items-center gap-4">
                    <Link href="/admin/roles">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Manage Permissions: {roleName}</h1>
                        <p className="text-gray-500">Enable or disable specific permissions for this role.</p>
                    </div>
                </div>

                <div className="grid gap-6">
                    {Object.entries(permissions).map(([moduleName, modulePerms]) => (
                        <Card key={moduleName}>
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-lg font-medium">{moduleName}</CardTitle>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleSelectAllModule(modulePerms)}
                                    >
                                        {modulePerms.every(p => selectedPermissions.includes(p.id)) ? 'Deselect All' : 'Select All'}
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {modulePerms.map((perm) => (
                                        <div key={perm.id} className="flex items-start gap-3 p-3 rounded-md border text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                            <Checkbox
                                                id={`perm-${perm.id}`}
                                                checked={selectedPermissions.includes(perm.id)}
                                                onCheckedChange={() => handleTogglePermission(perm.id)}
                                                className="mt-0.5"
                                            />
                                            <div className="grid gap-1">
                                                <label
                                                    htmlFor={`perm-${perm.id}`}
                                                    className="font-medium leading-none cursor-pointer"
                                                >
                                                    {perm.name.replace(/_/g, ' ')}
                                                </label>
                                                <p className="text-xs text-gray-500">{perm.name}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Sticky Footer for Save Action */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-950 border-t flex justify-end gap-4 z-40 md:pl-64">
                    <div className="max-w-5xl w-full mx-auto flex justify-end gap-4 px-4 sm:px-6">
                        <Link href="/admin/roles">
                            <Button variant="outline">Cancel</Button>
                        </Link>
                        <Button onClick={handleSave} disabled={saving} className="bg-[#1e3a5f] hover:bg-[#163050]">
                            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            Save Changes
                        </Button>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
