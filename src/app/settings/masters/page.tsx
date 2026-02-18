"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/MainLayout'
import { usePermission } from '@/hooks/usePermission'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Settings as SettingsIcon,
  Briefcase,
  Users as UsersIcon,
  Shield,
  Calendar,
  FileText,
  DollarSign,
} from 'lucide-react'

interface MasterItem {
  id: number
  name: string
  status?: number
}

interface MasterType {
  id: string
  name: string
  icon: React.ReactNode
  endpoint: string
  nameField: string // Field from API response
  payloadField: string // Field to send in payload
}

const masterTypes: MasterType[] = [
  { id: 'designations', name: 'Designations', icon: <Briefcase className="w-5 h-5" />, endpoint: 'designations', nameField: 'designationName', payloadField: 'designation_name' },
  { id: 'departments', name: 'Departments', icon: <UsersIcon className="w-5 h-5" />, endpoint: 'departments', nameField: 'departmentName', payloadField: 'department_name' },
  { id: 'roles', name: 'Roles', icon: <Shield className="w-5 h-5" />, endpoint: 'roles', nameField: 'roleName', payloadField: 'role_name' },
  { id: 'leave-types', name: 'Leave Types', icon: <Calendar className="w-5 h-5" />, endpoint: 'leave-types', nameField: 'leaveType', payloadField: 'leave_type' }, // leave-types route expects leave_type
  { id: 'document-types', name: 'Document Types', icon: <FileText className="w-5 h-5" />, endpoint: 'document-types', nameField: 'documentTypeName', payloadField: 'document_type_name' },
]

export default function MasterSettingsPage() {
  const router = useRouter()
  const { canManageMasters, isAdmin } = usePermission()

  useEffect(() => {
    if (!isAdmin() && !canManageMasters()) {
      router.push('/dashboard')
    }
  }, [])

  const [selectedType, setSelectedType] = useState<MasterType>(masterTypes[0])
  const [items, setItems] = useState<MasterItem[]>([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<MasterItem | null>(null)
  const [formValue, setFormValue] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchItems()
  }, [selectedType])
  const fetchItems = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/masters/${selectedType.endpoint}`)
      const data = await response.json()
      if (data.success) {
        setItems(data.data.map((item: any) => ({
          ...item,
          name: item[selectedType.nameField] || item.name // Map to common name
        })) || [])
      }
    } catch (error) {
      console.error('Failed to fetch items:', error)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formValue.trim()) return

    try {
      setSaving(true)
      const url = selectedItem
        ? `/api/masters/${selectedType.endpoint}/${selectedItem.id}`
        : `/api/masters/${selectedType.endpoint}`

      const payload = {
        [selectedType.payloadField]: formValue
      }

      const response = await fetch(url, {
        method: selectedItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (data.success) {
        setDialogOpen(false)
        setFormValue('')
        setSelectedItem(null)
        fetchItems()
      }
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedItem) return

    try {
      setSaving(true)
      const response = await fetch(`/api/masters/${selectedType.endpoint}/${selectedItem.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        setDeleteDialogOpen(false)
        setSelectedItem(null)
        fetchItems()
      }
    } catch (error) {
      console.error('Failed to delete:', error)
    } finally {
      setSaving(false)
    }
  }

  const openEditDialog = (item: MasterItem) => {
    setSelectedItem(item)
    setFormValue(item.name)
    setDialogOpen(true)
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-blue-600" />
            Master Data Settings
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage system master data and configurations
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="space-y-2">
            {masterTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${selectedType.id === type.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                  }`}
              >
                {type.icon}
                <span className="font-medium">{type.name}</span>
              </button>
            ))}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Manage {selectedType.name}</CardTitle>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Add, edit, or remove {selectedType.name.toLowerCase()}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setSelectedItem(null)
                    setFormValue('')
                    setDialogOpen(true)
                  }}
                  className="bg-[#1e3a5f] hover:bg-[#2d5a87]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add New
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                ) : items.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">
                      No {selectedType.name.toLowerCase()} found
                    </p>
                    <Button
                      onClick={() => {
                        setSelectedItem(null)
                        setFormValue('')
                        setDialogOpen(true)
                      }}
                      className="mt-4"
                      variant="outline"
                    >
                      Add First {selectedType.name.slice(0, -1)}
                    </Button>
                  </div>
                ) : (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead className="w-24">Status</TableHead>
                          <TableHead className="w-32 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.id}</TableCell>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>
                              <Badge className={
                                item.status === 1 || item.status === undefined
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                              }>
                                {item.status === 1 || item.status === undefined ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditDialog(item)}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedItem(item)
                                    setDeleteDialogOpen(true)
                                  }}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedItem ? 'Edit' : 'Add'} {selectedType.name.slice(0, -1)}
            </DialogTitle>
            <DialogDescription>
              {selectedItem ? 'Update the' : 'Create a new'} {selectedType.name.slice(0, -1).toLowerCase()}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={formValue}
                onChange={(e) => setFormValue(e.target.value)}
                placeholder={`Enter ${selectedType.name.slice(0, -1).toLowerCase()} name`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && formValue.trim()) {
                    handleSave()
                  }
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !formValue.trim()}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedType.name.slice(0, -1)}</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedItem?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}
