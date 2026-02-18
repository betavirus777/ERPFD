"use client"

import React, { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { clientsAPI, mastersAPI } from '@/lib/api'
import {
  ArrowLeft,
  Save,
  Loader2,
  Building2,
  Users,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'

interface Contact {
  id?: number
  person_name: string
  email: string
  contact_num: string
  designation: string
}

export default function ClientEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Master data
  const [industries, setIndustries] = useState<any[]>([])
  const [countries, setCountries] = useState<any[]>([])
  
  // Form data
  const [formData, setFormData] = useState({
    client_name: '',
    client_website: '',
    contact_number: '',
    client_work_address: '',
    industry_id: '',
    country_id: '',
    status: true,
  })
  
  // Contacts
  const [contacts, setContacts] = useState<Contact[]>([])
  const [contactModalOpen, setContactModalOpen] = useState(false)
  const [contactForm, setContactForm] = useState<Contact>({
    person_name: '',
    email: '',
    contact_num: '',
    designation: '',
  })
  const [editingContactIndex, setEditingContactIndex] = useState<number | null>(null)

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      const [clientRes, industriesRes, countriesRes] = await Promise.all([
        clientsAPI.getById(parseInt(id)),
        mastersAPI.getIndustries(),
        mastersAPI.getCountries(),
      ])
      
      if (clientRes?.data) {
        const client = clientRes.data
        setFormData({
          client_name: client.clientName || client.client_name || '',
          client_website: client.clientWebsite || client.client_website || '',
          contact_number: client.contactNumber || client.contact_number || '',
          client_work_address: client.clientWorkAddress || client.client_work_address || '',
          industry_id: String(client.industryId || client.industry_id || ''),
          country_id: String(client.countryId || client.country_id || ''),
          status: client.status !== false,
        })
        setContacts(client.contacts || [])
      }
      
      if (industriesRes?.data) setIndustries(industriesRes.data)
      if (countriesRes?.data) setCountries(countriesRes.data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch client')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.client_name) {
      setError('Client name is required')
      return
    }

    try {
      setSaving(true)
      setError('')
      
      const response = await clientsAPI.update(parseInt(id), {
        ...formData,
        industry_id: formData.industry_id ? parseInt(formData.industry_id) : null,
        country_id: formData.country_id ? parseInt(formData.country_id) : null,
        contacts,
      })
      
      if (response.success) {
        setSuccess('Client updated successfully!')
        setTimeout(() => router.push(`/clients/${id}`), 1500)
      } else {
        setError(response.error || 'Failed to update client')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update client')
    } finally {
      setSaving(false)
    }
  }

  const handleAddContact = () => {
    setEditingContactIndex(null)
    setContactForm({ person_name: '', email: '', contact_num: '', designation: '' })
    setContactModalOpen(true)
  }

  const handleEditContact = (index: number) => {
    setEditingContactIndex(index)
    setContactForm(contacts[index])
    setContactModalOpen(true)
  }

  const handleSaveContact = () => {
    if (!contactForm.person_name) {
      setError('Contact name is required')
      return
    }

    if (editingContactIndex !== null) {
      const newContacts = [...contacts]
      newContacts[editingContactIndex] = contactForm
      setContacts(newContacts)
    } else {
      setContacts([...contacts, contactForm])
    }
    
    setContactModalOpen(false)
    setContactForm({ person_name: '', email: '', contact_num: '', designation: '' })
  }

  const handleDeleteContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index))
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f]" />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push(`/clients/${id}`)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Client</h1>
              <p className="text-gray-500">{formData.client_name}</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} className="bg-[#1e3a5f] hover:bg-[#2d5a87]">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-600 text-sm">{error}</p>
            <button onClick={() => setError('')} className="ml-auto text-red-600 hover:text-red-800">×</button>
          </div>
        )}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-green-600 text-sm">{success}</p>
          </div>
        )}

        <Tabs defaultValue="details" className="space-y-4">
          <TabsList>
            <TabsTrigger value="details">Company Details</TabsTrigger>
            <TabsTrigger value="contacts">Contacts ({contacts.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" /> Company Information
                </CardTitle>
                <CardDescription>Basic information about the client</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Company Name <span className="text-red-500">*</span></Label>
                    <Input
                      value={formData.client_name}
                      onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                      placeholder="Enter company name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Website</Label>
                    <Input
                      value={formData.client_website}
                      onChange={(e) => setFormData({ ...formData, client_website: e.target.value })}
                      placeholder="https://example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Number</Label>
                    <Input
                      value={formData.contact_number}
                      onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                      placeholder="Enter contact number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Industry</Label>
                    <Select
                      value={formData.industry_id}
                      onValueChange={(v) => setFormData({ ...formData, industry_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {industries.map(ind => (
                          <SelectItem key={ind.id} value={String(ind.id)}>
                            {ind.industryName || ind.industry_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Select
                      value={formData.country_id}
                      onValueChange={(v) => setFormData({ ...formData, country_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map(country => (
                          <SelectItem key={country.id} value={String(country.id)}>
                            {country.countryName || country.country_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={formData.status}
                      onCheckedChange={(checked) => setFormData({ ...formData, status: checked })}
                    />
                    <Label>Active</Label>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Textarea
                    value={formData.client_work_address}
                    onChange={(e) => setFormData({ ...formData, client_work_address: e.target.value })}
                    placeholder="Enter company address"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contacts">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" /> Contact Persons
                  </CardTitle>
                  <CardDescription>Manage client contacts</CardDescription>
                </div>
                <Button onClick={handleAddContact} size="sm">
                  <Plus className="w-4 h-4 mr-2" /> Add Contact
                </Button>
              </CardHeader>
              <CardContent>
                {contacts.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Designation</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contacts.map((contact, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{contact.person_name}</TableCell>
                          <TableCell>{contact.email || '-'}</TableCell>
                          <TableCell>{contact.contact_num || '-'}</TableCell>
                          <TableCell>{contact.designation || '-'}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => handleEditContact(idx)}>
                              Edit
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDeleteContact(idx)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No contacts added yet</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={handleAddContact}>
                      <Plus className="w-4 h-4 mr-2" /> Add Contact
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Contact Modal */}
      <Dialog open={contactModalOpen} onOpenChange={setContactModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingContactIndex !== null ? 'Edit' : 'Add'} Contact</DialogTitle>
            <DialogDescription>Enter contact person details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name <span className="text-red-500">*</span></Label>
              <Input
                value={contactForm.person_name}
                onChange={(e) => setContactForm({ ...contactForm, person_name: e.target.value })}
                placeholder="Enter name"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                placeholder="Enter email"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={contactForm.contact_num}
                onChange={(e) => setContactForm({ ...contactForm, contact_num: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>
            <div className="space-y-2">
              <Label>Designation</Label>
              <Input
                value={contactForm.designation}
                onChange={(e) => setContactForm({ ...contactForm, designation: e.target.value })}
                placeholder="Enter designation"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContactModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveContact} className="bg-[#1e3a5f] hover:bg-[#2d5a87]">
              {editingContactIndex !== null ? 'Update' : 'Add'} Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}

