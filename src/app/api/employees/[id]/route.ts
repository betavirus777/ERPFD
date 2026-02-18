import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Get employee by ID with all related data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const employeeId = parseInt(id);

    if (isNaN(employeeId)) {
      return NextResponse.json(
        { success: false, code: 400, error: 'Invalid employee ID' },
        { status: 400 }
      );
    }

    const employee = await prisma.employeeOnboarding.findFirst({
      where: { id: employeeId, deleted_at: null },
      include: {
        role: true,
        designation_master: true,
        statusMaster: true,
      },
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, code: 404, error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Get all related data in parallel
    const [
      emergencyContacts,
      familyInfo,
      education,
      experience,
      documents,
      bankDetails,
      salaryDetailsRaw,
      consentForms,
      allowanceTypes,
    ] = await Promise.all([
      prisma.employeeEmergencyContact.findMany({
        where: { employee_onboarding_id: employeeId, deleted_at: null },
      }).catch(() => []),
      prisma.employeeFamilyInfo.findMany({
        where: { employee_onboarding_id: employeeId, deleted_at: null },
      }).catch(() => []),
      prisma.employeeEducationDetail.findMany({
        where: { employee_onboarding_id: employeeId, deleted_at: null },
      }).catch(() => []),
      prisma.employeeExperience.findMany({
        where: { employee_onboarding_id: employeeId, deleted_at: null },
      }).catch(() => []),
      prisma.employee_onboard_document.findMany({
        where: { employee_onboarding_id: employeeId, deleted_at: null },
        include: { employee_document_master: true },
      }).catch(() => []),
      prisma.employee_bank_details.findMany({
        where: { employee_onboarding_id: employeeId, deleted_at: null },
      }).catch(() => []),
      prisma.employeeSalaryDetails.findMany({
        where: { employee_onboarding_id: employeeId, deleted_at: null },
      }).catch(() => []),
      prisma.employeeConsentForm.findMany({
        where: { employee_onboarding_id: employeeId, deleted_at: null },
        include: { form_master: true },
      }).catch(() => []),
      prisma.allowance_type_master.findMany({
        where: { allowance_deleted_at: null },
      }).catch(() => []),
    ]);

    // Map allowance types for salary details
    const allowanceTypeMap = new Map(allowanceTypes.map((at: any) => [at.id, at.allowance_type]));
    const salaryDetails = salaryDetailsRaw.map((s: any) => ({
      ...s,
      allowanceTypeName: allowanceTypeMap.get(s.allowance_type_id) || null,
    }));

    return NextResponse.json({
      success: true,
      code: 200,
      data: {
        id: employee.id,
        uid: employee.uid,
        employee_code: employee.employee_code,
        employee_photo: employee.employee_photo,
        first_name: employee.first_name,
        last_name: employee.last_name,
        email: employee.email,
        personal_email: employee.personal_email,
        phone_number: employee.phone_number,
        dob: employee.dob,
        doj: employee.doj,
        permanent_address: employee.permanent_address,
        temp_address: employee.temp_address,
        status: employee.status,
        visa_type: employee.visa_type,
        employee_type: employee.employee_type,
        engagement_method: employee.engagement_method,
        nationality: employee.nationality,
        department: employee.department,
        reporting_to: employee.reporting_to,
        designationName: employee.designation_master?.designation_name,
        roleName: employee.role?.role_name,
        statusName: employee.statusMaster?.status,
        designation_master_id: employee.designation_master_id,
        role_master_id: employee.role_master_id,
        status_master_id: employee.status_master_id,
        emergencyContacts: emergencyContacts.map((c: any) => ({
          id: c.id,
          name: c.name,
          relationship: c.relationship,
          contact_number: c.contact_number,
        })),
        familyInfo: familyInfo.map((f: any) => ({
          id: f.id,
          name: f.name,
          relationship: f.relationship,
          dob: f.dob,
          contact_number: f.contact_number,
        })),
        education: education.map((e: any) => ({
          id: e.id,
          institution: e.institution,
          subject: e.subject,
          degree: e.degree,
          grade: e.grade,
          start_date: e.start_date,
          end_date: e.end_date,
        })),
        experience: experience.map((e: any) => ({
          id: e.id,
          company_name: e.company_name,
          location: e.location,
          job_position: e.job_position,
          start_date: e.start_date,
          end_date: e.end_date,
        })),
        documents: documents.map((doc: any) => ({
          id: doc.id,
          document_master_id: doc.document_master_id,
          documentTypeName: doc.employee_document_master?.document_type_name,
          document_number: doc.document_number,
          upload_document: doc.upload_document,
          upload_name: doc.upload_name,
          start_date: doc.start_date,
          end_date: doc.end_date,
        })),
        bankDetails: bankDetails.map((b: any) => ({
          id: b.id,
          bank_name: b.bank_name,
          bank_account_number: b.bank_account_number,
          recipient_name: b.recipient_name,
          bank_address: b.bank_address,
          bank_swift_code: b.bank_swift_code,
          bank_iban_number: b.bank_iban_number,
        })),
        salaryDetails: salaryDetails.map((s: any) => ({
          id: s.id,
          allowance_type_id: s.allowance_type_id,
          allowanceTypeName: s.allowanceTypeName,
          allowance_amount: s.allowance_type_salary_amount,
          allowance_currency: s.allowance_type_currency,
        })),
        consentForms: consentForms.map((c: any) => ({
          id: c.id,
          consent_form_id: c.consent_form_id,
          formName: c.form_master?.form_name,
          formLink: c.form_master?.upload_document,
          sign: c.sign,
          sign_date: c.sign_date,
        })),
      },
    });
  } catch (error: any) {
    console.error('Get employee error:', error);
    return NextResponse.json(
      { success: false, code: 500, error: error.message || 'Failed to fetch employee' },
      { status: 500 }
    );
  }
}

// Update employee with all related data
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const employeeId = parseInt(id);
    const body = await request.json();

    if (isNaN(employeeId)) {
      return NextResponse.json(
        { success: false, code: 400, error: 'Invalid employee ID' },
        { status: 400 }
      );
    }

    const existingEmployee = await prisma.employeeOnboarding.findFirst({
      where: { id: employeeId, deleted_at: null },
    });

    if (!existingEmployee) {
      return NextResponse.json(
        { success: false, code: 404, error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Check email uniqueness if changed
    if (body.email && body.email !== existingEmployee.email) {
      const emailExists = await prisma.employeeOnboarding.findFirst({
        where: {
          email: body.email,
          id: { not: employeeId },
          deleted_at: null,
        },
      });

      if (emailExists) {
        return NextResponse.json(
          { success: false, code: 400, error: 'Email already in use' },
          { status: 400 }
        );
      }
    }

    // Update main employee data
    const updateData: any = {
      updated_at: new Date(),
    };

    const allowedFields = [
      'first_name', 'last_name', 'email', 'personal_email', 'phone_number',
      'dob', 'doj', 'date_of_birth', 'employee_type', 'nationality', 'visa_type',
      'role_master_id', 'designation_master_id', 'department', 'status', 
      'permanent_address', 'current_address', 'temp_address', 'employee_photo', 'engagement_method',
      'status_master_id', 'employee_code', 'vendor_id', 'reporting_to'
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'dob' || field === 'doj' || field === 'date_of_birth') {
          const dbField = field === 'date_of_birth' ? 'dob' : field;
          updateData[dbField] = body[field] ? new Date(body[field]) : null;
        } else if (field === 'current_address') {
          updateData['temp_address'] = body[field];
        } else if (['role_master_id', 'designation_master_id', 'status_master_id', 'vendor_id', 'department'].includes(field)) {
          updateData[field] = body[field] ? parseInt(body[field]) : null;
        } else if (field === 'status') {
          updateData[field] = Boolean(body[field]);
        } else {
          updateData[field] = body[field];
        }
      }
    }

    const employee = await prisma.employeeOnboarding.update({
      where: { id: employeeId },
      data: updateData,
    });

    // Handle bank details
    if (body.bankDetails) {
      const bankData = body.bankDetails;
      if (bankData.id) {
        await prisma.employee_bank_details.update({
          where: { id: bankData.id },
          data: {
            bank_name: bankData.bank_name,
            bank_account_number: bankData.bank_account_number,
            recipient_name: bankData.recipient_name,
            bank_address: bankData.bank_address,
            bank_swift_code: bankData.bank_swift_code,
            bank_iban_number: bankData.bank_iban_number,
            updated_at: new Date(),
          },
        });
      } else if (bankData.bank_name) {
        await prisma.employee_bank_details.create({
          data: {
            employee_onboarding_id: employeeId,
            bank_name: bankData.bank_name,
            bank_account_number: bankData.bank_account_number,
            recipient_name: bankData.recipient_name,
            bank_address: bankData.bank_address,
            bank_swift_code: bankData.bank_swift_code,
            bank_iban_number: bankData.bank_iban_number,
          },
        });
      }
    }

    // Handle emergency contacts
    if (body.emergencyContacts) {
      for (const contact of body.emergencyContacts) {
        if (contact.id) {
          await prisma.employeeEmergencyContact.update({
            where: { id: contact.id },
            data: {
              name: contact.name,
              relationship: contact.relationship,
              contact_number: contact.contact_number,
              updated_at: new Date(),
            },
          });
        } else if (contact.name) {
          await prisma.employeeEmergencyContact.create({
            data: {
              employee_onboarding_id: employeeId,
              name: contact.name,
              relationship: contact.relationship,
              contact_number: contact.contact_number,
            },
          });
        }
      }
    }

    // Handle family info
    if (body.familyInfo) {
      for (const family of body.familyInfo) {
        if (family.id) {
          await prisma.employeeFamilyInfo.update({
            where: { id: family.id },
            data: {
              name: family.name,
              relationship: family.relationship,
              dob: family.dob ? new Date(family.dob) : null,
              contact_number: family.contact_number,
              updated_at: new Date(),
            },
          });
        } else if (family.name) {
          await prisma.employeeFamilyInfo.create({
            data: {
              employee_onboarding_id: employeeId,
              name: family.name,
              relationship: family.relationship,
              dob: family.dob ? new Date(family.dob) : null,
              contact_number: family.contact_number,
            },
          });
        }
      }
    }

    // Handle documents
    if (body.documents) {
      for (const doc of body.documents) {
        if (doc.id) {
          await prisma.employee_onboard_document.update({
            where: { id: doc.id },
            data: {
              document_master_id: doc.document_master_id ? parseInt(doc.document_master_id) : null,
              document_number: doc.document_number,
              upload_document: doc.upload_document,
              upload_name: doc.upload_name,
              start_date: doc.start_date ? new Date(doc.start_date) : null,
              end_date: doc.end_date ? new Date(doc.end_date) : null,
              updated_at: new Date(),
            },
          });
        } else if (doc.document_master_id) {
          await prisma.employee_onboard_document.create({
            data: {
              employee_onboarding_id: employeeId,
              document_master_id: parseInt(doc.document_master_id),
              document_number: doc.document_number,
              upload_document: doc.upload_document,
              upload_name: doc.upload_name,
              start_date: doc.start_date ? new Date(doc.start_date) : null,
              end_date: doc.end_date ? new Date(doc.end_date) : null,
            },
          });
        }
      }
    }

    // Handle experience
    if (body.experience) {
      for (const exp of body.experience) {
        if (exp.id) {
          await prisma.employeeExperience.update({
            where: { id: exp.id },
            data: {
              company_name: exp.company_name,
              location: exp.location,
              job_position: exp.job_position,
              start_date: exp.start_date ? new Date(exp.start_date) : null,
              end_date: exp.end_date ? new Date(exp.end_date) : null,
              updated_at: new Date(),
            },
          });
        } else if (exp.company_name) {
          await prisma.employeeExperience.create({
            data: {
              employee_onboarding_id: employeeId,
              company_name: exp.company_name,
              location: exp.location,
              job_position: exp.job_position,
              start_date: exp.start_date ? new Date(exp.start_date) : null,
              end_date: exp.end_date ? new Date(exp.end_date) : null,
            },
          });
        }
      }
    }

    // Handle education
    if (body.education) {
      for (const edu of body.education) {
        if (edu.id) {
          await prisma.employeeEducationDetail.update({
            where: { id: edu.id },
            data: {
              institution: edu.institution,
              subject: edu.subject,
              degree: edu.degree,
              grade: edu.grade,
              start_date: edu.start_date ? new Date(edu.start_date) : null,
              end_date: edu.end_date ? new Date(edu.end_date) : null,
              updated_at: new Date(),
            },
          });
        } else if (edu.institution) {
          await prisma.employeeEducationDetail.create({
            data: {
              employee_onboarding_id: employeeId,
              institution: edu.institution,
              subject: edu.subject,
              degree: edu.degree,
              grade: edu.grade,
              start_date: edu.start_date ? new Date(edu.start_date) : null,
              end_date: edu.end_date ? new Date(edu.end_date) : null,
            },
          });
        }
      }
    }

    // Handle salary details
    if (body.salaryDetails) {
      for (const salary of body.salaryDetails) {
        if (salary.id && salary.allowance_type_id) {
          await prisma.employeeSalaryDetails.update({
            where: { id: salary.id },
            data: {
              allowance_type_id: parseInt(salary.allowance_type_id),
              allowance_type_salary_amount: parseFloat(salary.allowance_amount) || 0,
              allowance_type_currency: parseInt(salary.allowance_currency) || undefined,
              updated_at: new Date(),
            },
          });
        } else if (salary.allowance_type_id) {
          await prisma.employeeSalaryDetails.create({
            data: {
              employee_onboarding_id: employeeId,
              allowance_type_id: parseInt(salary.allowance_type_id),
              allowance_type_salary_amount: parseFloat(salary.allowance_amount) || 0,
              allowance_type_currency: parseInt(salary.allowance_currency) || undefined,
            },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      code: 200,
      data: employee,
      message: 'Employee updated successfully',
    });
  } catch (error: any) {
    console.error('Update employee error:', error);
    return NextResponse.json(
      { success: false, code: 500, error: error.message || 'Failed to update employee' },
      { status: 500 }
    );
  }
}

// Delete employee (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const employeeId = parseInt(id);

    if (isNaN(employeeId)) {
      return NextResponse.json(
        { success: false, code: 400, error: 'Invalid employee ID' },
        { status: 400 }
      );
    }

    const employee = await prisma.employeeOnboarding.findFirst({
      where: { id: employeeId, deleted_at: null },
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, code: 404, error: 'Employee not found' },
        { status: 404 }
      );
    }

    await prisma.employeeOnboarding.update({
      where: { id: employeeId },
      data: {
        deleted_at: new Date(),
        status: false,
      },
    });

    return NextResponse.json({
      success: true,
      code: 200,
      message: 'Employee deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete employee error:', error);
    return NextResponse.json(
      { success: false, code: 500, error: error.message || 'Failed to delete employee' },
      { status: 500 }
    );
  }
}
