'use client';

import React, { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { adminAPI } from '@/lib/api';
import { Shield, Lock, Eye, Edit, Key } from 'lucide-react';
import Link from 'next/link';

interface Role {
    id: number;
    name: string;
    description: string;
    permissionCount: number;
    status: boolean;
}

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
            if (response?.data) {
                setRoles(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch roles:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <MainLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Roles & Permissions</h1>
                        <p className="text-gray-500">Manage access control for different user roles.</p>
                    </div>
                    {/* <Button>Create Role</Button> - Phase 2 */}
                </div>

                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>System Roles</CardTitle>
                            <CardDescription>
                                List of all defined roles and their active permission counts.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Role Name</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Active Permissions</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8">
                                                Loading roles...
                                            </TableCell>
                                        </TableRow>
                                    ) : roles.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8">
                                                No roles found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        roles.map((role) => (
                                            <TableRow key={role.id}>
                                                <TableCell className="font-medium flex items-center gap-2">
                                                    <Shield className="w-4 h-4 text-primary" />
                                                    {role.name}
                                                </TableCell>
                                                <TableCell>{role.description || '-'}</TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className="gap-1">
                                                        <Key className="w-3 h-3" />
                                                        {role.permissionCount}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={role.status ? 'outline' : 'destructive'} className={role.status ? 'bg-green-50 text-green-700 border-green-200' : ''}>
                                                        {role.status ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Link href={`/admin/roles/${role.id}`}>
                                                        <Button size="sm" variant="outline">
                                                            <Lock className="w-4 h-4 mr-2" />
                                                            Manage Permissions
                                                        </Button>
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </MainLayout>
    );
}
