import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { hashPassword, getUserFromRequest } from '@/lib/auth';
import { saveFile } from '@/lib/file-upload';
import { apiResponse, apiError, APIError } from '@/lib/api-response';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

// Get all employees with search, sorting, and filters
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      throw APIError.unauthorized();
    }

    if (!(await hasPermission(user, PERMISSIONS.EMPLOYEE_VIEW))) {
      throw APIError.forbidden('You do not have permission to view employees');
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const status_master_id = searchParams.get('status_master_id');
    const designation_id = searchParams.get('designation_id');
    const role_id = searchParams.get('role_id');
    const minimal = searchParams.get('minimal') === 'true'; // Lightweight response for dropdowns

    // Sorting
    const sortField = searchParams.get('sortField') || 'first_name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    const skip = (page - 1) * limit;

    const where: any = {
      deleted_at: null,
    };

    if (status !== null && status !== '') {
      where.status = status === 'true' || status === '1';
    }

    if (status_master_id) {
      where.status_master_id = parseInt(status_master_id);
    }

    if (designation_id) {
      where.designation_master_id = parseInt(designation_id);
    }

    if (role_id) {
      where.role_master_id = parseInt(role_id);
    }

    // Search across employee code, name, email, designation
    if (search) {
      where.OR = [
        { first_name: { contains: search } },
        { last_name: { contains: search } },
        { email: { contains: search } },
        { employee_code: { contains: search } },
        { designation_master: { designation_name: { contains: search } } },
      ];
    }

    // Build orderBy dynamically based on sortField
    let orderBy: any = { first_name: 'asc' };
    const validSortFields = ['first_name', 'employee_code', 'doj', 'created_at'];

    if (validSortFields.includes(sortField)) {
      orderBy = { [sortField]: sortOrder === 'desc' ? 'desc' : 'asc' };
    } else if (sortField === 'designationName') {
      orderBy = { designation_master: { designation_name: sortOrder === 'desc' ? 'desc' : 'asc' } };
    }

    // Minimal select for dropdowns - much faster
    const minimalSelect = {
      id: true,
      uid: true,
      first_name: true,
      last_name: true,
      employee_code: true,
    };

    // Full select for listing
    const fullSelect = {
      id: true,
      uid: true,
      employee_code: true,
      employee_photo: true,
      first_name: true,
      last_name: true,
      email: true,
      phone_number: true,
      doj: true,
      status: true,
      visa_type: true,
      created_at: true,
      designation_master: {
        select: {
          id: true,
          designation_name: true,
        },
      },
      role: {
        select: {
          id: true,
          role_name: true,
        },
      },
      statusMaster: {
        select: {
          id: true,
          status: true,
        },
      },
      employee_onboard_document: {
        where: {
          deleted_at: null,
          employee_document_master: {
            document_type_name: {
              in: ['Passport', 'Visa']
            }
          }
        },
        select: {
          id: true,
          end_date: true,
          employee_document_master: {
            select: { document_type_name: true }
          }
        }
      }
    };

    // Get counts for stats
    const [employees, total, totalActive, totalInactive] = await Promise.all([
      prisma.employeeOnboarding.findMany({
        where,
        select: minimal ? minimalSelect : fullSelect,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.employeeOnboarding.count({ where }),
      prisma.employeeOnboarding.count({ where: { deleted_at: null, status: true } }),
      prisma.employeeOnboarding.count({ where: { deleted_at: null, status: false } }),
    ]);

    // Minimal response for dropdowns
    if (minimal) {
      return NextResponse.json({
        success: true,
        code: 200,
        data: employees.map((emp: any) => ({
          id: emp.id,
          uid: emp.uid,
          employeeCode: emp.employee_code,
          firstName: emp.first_name,
          lastName: emp.last_name,
          fullName: `${emp.first_name} ${emp.last_name}`,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    return NextResponse.json({
      success: true,
      code: 200,
      data: employees.map((emp: any) => ({
        id: emp.id,
        uid: emp.uid,
        employeeCode: emp.employee_code,
        employeePhoto: emp.employee_photo,
        firstName: emp.first_name,
        lastName: emp.last_name,
        fullName: `${emp.first_name} ${emp.last_name}`,
        email: emp.email,
        phoneNumber: emp.phone_number,
        doj: emp.doj,
        visaType: emp.visa_type,
        status: emp.status,
        createdAt: emp.created_at,
        designationId: emp.designation_master?.id,
        designationName: emp.designation_master?.designation_name,
        roleId: emp.role?.id,
        roleName: emp.role?.role_name,
        statusMasterId: emp.statusMaster?.id,
        statusName: emp.statusMaster?.status,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      meta: {
        totalActive,
        totalInactive
      }
    });
  } catch (error: any) {
    console.error('Employees list error:', error);
    return NextResponse.json(
      { success: false, code: 500, error: error.message || 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}

// Create new employee
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      throw APIError.unauthorized();
    }

    if (!(await hasPermission(user, PERMISSIONS.EMPLOYEE_CREATE))) {
      throw APIError.forbidden('You do not have permission to create employees');
    }

    // Validate Content-Type
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { success: false, code: 400, error: 'Content-Type must be multipart/form-data' },
        { status: 400 }
      );
    }

    const formData = await request.formData();

    // Extract fields
    const first_name = formData.get('first_name') as string;
    const last_name = formData.get('last_name') as string;
    const email = formData.get('email') as string;
    const phone_number = formData.get('phone_number') as string;
    const personal_email = formData.get('personal_email') as string;
    const designation_master_id = formData.get('designation_master_id') as string;
    const role_master_id = formData.get('role_master_id') as string;
    const doj = formData.get('doj') as string;
    const employee_type = formData.get('employee_type') as string;
    const department = formData.get('department') as string;
    const gender = formData.get('gender') as string;
    const date_of_birth = formData.get('date_of_birth') as string;
    const nationality = formData.get('nationality') as string;
    const marital_status = formData.get('marital_status') as string;
    const current_address = formData.get('current_address') as string;
    const permanent_address = formData.get('permanent_address') as string;
    const visa_type = formData.get('visa_type') as string;
    const emergency_contact_name = formData.get('emergency_contact_name') as string;
    const emergency_contact_number = formData.get('emergency_contact_number') as string;
    const potential_candidate_id = formData.get('potential_candidate_id') as string;

    // Handle File Upload
    const photoFile = formData.get('photo') as File | null;
    let photoPath = null;
    if (photoFile && photoFile.size > 0) {
      photoPath = await saveFile(photoFile, 'employees');
    }

    if (!first_name || !last_name || !email) {
      return NextResponse.json(
        { success: false, code: 400, error: 'First name, last name, and email are required' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingEmployee = await prisma.employeeOnboarding.findFirst({
      where: { email, deleted_at: null },
    });

    if (existingEmployee) {
      return NextResponse.json(
        { success: false, code: 400, error: 'An employee with this email already exists' },
        { status: 400 }
      );
    }

    // Generate UID
    const uid = `employee_onboarding_${Date.now()}`;

    // Generate employee code
    const lastEmployee = await prisma.employeeOnboarding.findFirst({
      where: { employee_code: { not: null } },
      orderBy: { id: 'desc' },
      select: { employee_code: true },
    });

    let employeeCode = 'EMP-00001';
    if (lastEmployee?.employee_code) {
      const match = lastEmployee.employee_code.match(/EMP-(\d+)/);
      if (match) {
        const lastNum = parseInt(match[1] || '0');
        employeeCode = `EMP-${String(lastNum + 1).padStart(5, '0')}`;
      }
    }

    // Designation and Role are mandatory
    if (!designation_master_id || !role_master_id) {
      return NextResponse.json(
        { success: false, code: 400, error: 'Designation and Role are required' },
        { status: 400 }
      );
    }

    const designationId = parseInt(designation_master_id);
    const roleId = parseInt(role_master_id);

    // Generate secure random password (user won't know it, forcing OTP flow)
    const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
    const hashedPassword = await hashPassword(randomPassword);

    // Use transaction to create both Employee and Login records
    const result = await prisma.$transaction(async (tx) => {
      const employee = await tx.employeeOnboarding.create({
        data: {
          uid,
          employee_code: employeeCode,
          first_name,
          last_name,
          email,
          personal_email: personal_email || undefined,
          phone_number: phone_number || '',
          designation_master_id: designationId,
          role_master_id: roleId,
          doj: doj ? new Date(doj) : new Date(),
          employee_type: employee_type as any || undefined,
          department: department ? parseInt(department) : undefined,
          dob: date_of_birth ? new Date(date_of_birth) : undefined,
          nationality: nationality || undefined,
          visa_type: visa_type || '',
          temp_address: current_address || undefined,
          permanent_address: permanent_address || undefined,
          employee_photo: photoPath || undefined,
          status: true,
          status_master_id: 15, // Active status
          created_at: new Date(),
          potential_candidate_id: potential_candidate_id ? parseInt(potential_candidate_id) : undefined,
        },
        include: {
          designation_master: { select: { designation_name: true } },
          role: { select: { role_name: true } },
        },
      });

      // Create Login record
      await tx.login.create({
        data: {
          user_id: employee.uid,
          email: employee.email,
          password: hashedPassword,
          status: true,
          usertype_master_id: 2, // Default to User/Employee type
        },
      });

      // Update Potential Candidate status if converting
      if (potential_candidate_id) {
        await tx.potentialCandidate.update({
          where: { id: parseInt(potential_candidate_id) },
          data: { status: false, status_master_id: 2 }, // Marking as Inactive/Converted (Status 2 usually inactive)
        });
      }

      return employee;
    });

    return NextResponse.json({
      success: true,
      code: 201,
      data: {
        id: result.id,
        uid: result.uid,
        employeeCode: result.employee_code,
        firstName: result.first_name,
        lastName: result.last_name,
        email: result.email,
        designationName: result.designation_master?.designation_name,
        roleName: result.role?.role_name,
        photo: result.employee_photo,
      },
      message: 'Employee created successfully',
    }, { status: 201 });

  } catch (error: any) {
    console.error('Create employee error:', error);
    return NextResponse.json(
      { success: false, code: 500, error: error.message || 'Failed to create employee' },
      { status: 500 }
    );
  }
}
