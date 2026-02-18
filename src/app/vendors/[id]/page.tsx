"use client"

import React, { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { vendorsAPI } from '@/lib/api'
import {
  ArrowLeft,
  Edit,
  Building2,
  Globe,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Users,
  FolderKanban,
  Loader2,
  ExternalLink,
  User,
  Briefcase,
} from 'lucide-react'
import Link from 'next/link'

interface Vendor {
  id: number
  vendorId: string
  vendorName: string
  vendorWebsite?: string
  contactNumber?: string
  vendorAddress?: string
  status: boolean
  countryName?: string
  createdAt?: string
  contacts?: any[]
  projects?: any[]
  services?: string[]
}

export default function VendorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchVendor()
  }, [id])

  const fetchVendor = async () => {
    try {
      setLoading(true)
      const response = await vendorsAPI.getById(parseInt(id))
      if (response?.data) {
        setVendor(response.data)
      } else {
        setError('Vendor not found')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch vendor')
    } finally {
      setLoading(false)
    }
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

  if (error || !vendor) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-red-600">{error || 'Vendor not found'}</p>
          <Button variant="outline" onClick={() => router.push('/vendors')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Vendors
          </Button>
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
            <Button variant="ghost" size="icon" onClick={() => router.push('/vendors')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{vendor.vendorName}</h1>
              <p className="text-gray-500">{vendor.vendorId}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={vendor.status 
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
            }>
              {vendor.status ? 'Active' : 'Inactive'}
            </Badge>
            <Link href={`/vendors/${id}/edit`}>
              <Button className="bg-[#1e3a5f] hover:bg-[#2d5a87]">
                <Edit className="w-4 h-4 mr-2" /> Edit Vendor
              </Button>
            </Link>
          </div>
        </div>

        {/* Vendor Info Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" /> Vendor Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Company Name</p>
                  <p className="font-medium">{vendor.vendorName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Vendor ID</p>
                  <p className="font-medium">{vendor.vendorId}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Country</p>
                  <p className="font-medium">{vendor.countryName || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <Badge className={vendor.status 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                  }>
                    {vendor.status ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              
              {vendor.vendorAddress && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Address</p>
                  <p className="font-medium flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    {vendor.vendorAddress}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t flex flex-wrap gap-4">
                {vendor.vendorWebsite && (
                  <a 
                    href={vendor.vendorWebsite.startsWith('http') ? vendor.vendorWebsite : `https://${vendor.vendorWebsite}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:underline"
                  >
                    <Globe className="w-4 h-4" /> {vendor.vendorWebsite}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {vendor.contactNumber && (
                  <a href={`tel:${vendor.contactNumber}`} className="flex items-center gap-2 text-gray-600 hover:text-blue-600">
                    <Phone className="w-4 h-4" /> {vendor.contactNumber}
                  </a>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{vendor.contacts?.length || 0}</p>
                    <p className="text-sm text-gray-500">Contacts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                    <FolderKanban className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{vendor.projects?.length || 0}</p>
                    <p className="text-sm text-gray-500">Projects</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <Briefcase className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{vendor.services?.length || 0}</p>
                    <p className="text-sm text-gray-500">Services</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="contacts" className="space-y-4">
          <TabsList>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
          </TabsList>

          <TabsContent value="contacts">
            <Card>
              <CardHeader>
                <CardTitle>Contact Persons</CardTitle>
              </CardHeader>
              <CardContent>
                {vendor.contacts && vendor.contacts.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Designation</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vendor.contacts.map((contact: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              {contact.personName || contact.person_name || '-'}
                            </div>
                          </TableCell>
                          <TableCell>
                            {contact.email && (
                              <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline flex items-center gap-1">
                                <Mail className="w-3 h-3" /> {contact.email}
                              </a>
                            )}
                          </TableCell>
                          <TableCell>
                            {contact.contactNum || contact.contact_num || '-'}
                          </TableCell>
                          <TableCell>{contact.designation || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No contacts found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects">
            <Card>
              <CardHeader>
                <CardTitle>Associated Projects</CardTitle>
              </CardHeader>
              <CardContent>
                {vendor.projects && vendor.projects.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project Name</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Start Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vendor.projects.map((project: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{project.projectName || project.project_name}</TableCell>
                          <TableCell>{project.clientName || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{project.statusName || 'Active'}</Badge>
                          </TableCell>
                          <TableCell>{project.startDate || project.start_date || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FolderKanban className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No projects found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}

