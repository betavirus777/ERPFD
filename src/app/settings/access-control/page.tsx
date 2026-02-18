"use client"

import React, { useEffect, useState } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { usePermission } from '@/hooks/usePermission'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Shield,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Check,
  X as XIcon,
} from 'lucide-react'

interface Permission {
  permissionId: number
  description: string
  checked: number
}

interface Module {
  module: string
  permissions: Permission[]
}

interface Role {
  id: number
  roleName: string
  roleDescription: string
}

export default function AccessControlPage() {
  const router = useRouter()
  const { isAdmin, isSuperAdmin } = usePermission()
  const [loading, setLoading] = useState(true)
  const [roles, setRoles] = useState<Role[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  // Delete Dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [roleToDelete, setRoleToDelete] = useState<number | null>(null)

  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    roleName: '',
    description: '',
  })

  const [permissions, setPermissions] = useState<Record<number, boolean>>({})

  useEffect(() => {
    if (!isAdmin()) {
      router.push('/dashboard')
      return
    }
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/access-control/roles')
      const data = await response.json()
      if (data.success) {
        setRoles(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch roles:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchModules = async () => {
    try {
      const response = await fetch('/api/access-control/modules')
      const data = await response.json()
      if (data.success) {
        setModules(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch modules:', err)
    }
  }

  const fetchRolePermissions = async (roleId: number) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/access-control/roles/${roleId}`)
      const data = await response.json()
      if (data.success) {
        setModules(data.data)

        // Set role info from first module
        if (data.data.length > 0) {
          setFormData({
            roleName: data.data[0].roleName || '',
            description: data.data[0].roleDescription || '', // Fixed typo
          })
        }

        // Build permissions object
        const perms: Record<number, boolean> = {}
        data.data.forEach((module: Module) => {
          module.permissions.forEach((perm: Permission) => {
            perms[perm.permissionId] = perm.checked === 1
          })
        })
        setPermissions(perms)
      }
    } catch (err) {
      console.error('Failed to fetch role permissions:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleNewRole = async () => {
    setIsEditing(false)
    setSelectedRole(null)
    setFormData({ roleName: '', description: '' })
    await fetchModules()
    setPermissions({})
    setModalOpen(true)
  }

  const handleEditRole = async (role: Role) => {
    setIsEditing(true)
    setSelectedRole(role)
    await fetchRolePermissions(role.id)
    setModalOpen(true)
  }

  const handleSaveRole = async () => {
    setError('')
    setSuccess('')

    if (!formData.roleName.trim()) {
      setError('Role name is required')
      return
    }

    try {
      setSaving(true)

      const permissionsArray = Object.entries(permissions).map(([permissionId, checked]) => ({
        permissionId: parseInt(permissionId),
        checked: checked ? 1 : 0,
      }))

      const payload = {
        roleName: formData.roleName,
        description: formData.description,
        permissions: permissionsArray,
      }

      let response
      if (isEditing && selectedRole) {
        response = await fetch(`/api/access-control/roles/${selectedRole.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, roleId: selectedRole.id }),
        })
      } else {
        response = await fetch('/api/access-control/roles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      const data = await response.json()

      if (data.success) {
        setSuccess(data.message || 'Role saved successfully')
        setTimeout(() => {
          setModalOpen(false)
          fetchRoles()
          setSuccess('')
        }, 2000)
      } else {
        setError(data.error || 'Failed to save role')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save role')
    } finally {
      setSaving(false)
    }
  }

  const initiateDeleteRole = (roleId: number) => {
    setRoleToDelete(roleId)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteRole = async () => {
    if (!roleToDelete) return

    try {
      const response = await fetch(`/api/access-control/roles/${roleToDelete}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (data.success) {
        fetchRoles()
        setDeleteDialogOpen(false)
        setRoleToDelete(null)
      } else {
        console.error("Delete failed", data.error)
      }
    } catch (err) {
      console.error('Failed to delete role:', err)
    }
  }

  const togglePermission = (permissionId: number) => {
    setPermissions(prev => ({
      ...prev,
      [permissionId]: !prev[permissionId],
    }))
  }

  const toggleModuleAll = (module: Module, checked: boolean) => {
    const newPerms = { ...permissions }
    module.permissions.forEach(perm => {
      newPerms[perm.permissionId] = checked
    })
    setPermissions(newPerms)
  }

  if (!isAdmin()) {
    return null
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-600" />
              Access Control
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Manage roles and permissions for your organization
            </p>
          </div>
          <Button onClick={handleNewRole} className="bg-[#1e3a5f] hover:bg-[#2d5a87]">
            <Plus className="w-4 h-4 mr-2" />
            Create Role
          </Button>
        </div>

        {/* Roles List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : roles.length === 0 ? (
            <div className="text-center p-12">
              <Shield className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No roles found</p>
              <Button onClick={handleNewRole} className="mt-4">
                Create your first role
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-900/50">
                  <TableHead>Role Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map(role => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium text-gray-900 dark:text-white">
                      {role.roleName}
                    </TableCell>
                    <TableCell className="text-gray-500 dark:text-gray-400">
                      {role.roleDescription || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditRole(role)}
                        >
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        {isSuperAdmin() && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => initiateDeleteRole(role.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Role Editor Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Edit Role' : 'Create New Role'}
            </DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update role details and permissions' : 'Create a new role and assign permissions'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                <XIcon className="w-4 h-4" />
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-green-600 dark:text-green-400 text-sm flex items-center gap-2">
                <Check className="w-4 h-4" />
                {success}
              </div>
            )}

            {/* Role Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Role Name <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="e.g., Project Manager"
                  value={formData.roleName}
                  onChange={(e) => setFormData(prev => ({ ...prev, roleName: e.target.value }))}
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Brief description of this role..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  disabled={saving}
                />
              </div>
            </div>

            {/* Permissions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Permissions</h3>

              {modules.map(module => {
                const allChecked = module.permissions.every(p => permissions[p.permissionId])

                return (
                  <div key={module.module} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900 dark:text-white">{module.module}</h4>
                      <button
                        onClick={() => toggleModuleAll(module, !allChecked)}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        disabled={saving}
                      >
                        {allChecked ? 'Unselect All' : 'Select All'}
                      </button>
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {module.permissions.map(perm => (
                        <label
                          key={perm.permissionId}
                          className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={permissions[perm.permissionId] || false}
                            onChange={() => togglePermission(perm.permissionId)}
                            disabled={saving}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {perm.description}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSaveRole} disabled={saving} className="bg-[#1e3a5f] hover:bg-[#2d5a87]">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  {isEditing ? 'Update Role' : 'Create Role'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this role? This action cannot be undone and might affect users assigned to this role.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteRole}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}

