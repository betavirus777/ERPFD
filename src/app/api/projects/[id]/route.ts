import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET single project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = parseInt(id);

    if (isNaN(projectId)) {
      return NextResponse.json({ success: false, error: 'Invalid project ID' }, { status: 400 });
    }

    const project = await prisma.projectManagement.findFirst({
      where: { id: projectId, project_management_deleted_at: null },
      include: {
        client: { select: { id: true, client_name: true } },
        status_master: { select: { id: true, status: true } },
        vendors: { select: { id: true, vendor_name: true } },
        project_documents: { where: { deleted_at: null } },
        project_task: { where: { project_task_deleted_at: null } },
        tasks: {
          where: { deleted_at: null },
          include: {
            taskStatus: true,
            priority: true,
            assignee: { select: { id: true, uid: true, first_name: true, last_name: true, employee_photo: true } }
          }
        },
      },
    });

    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: project.id,
        // ... existing fields
        projectName: project.project_name,
        projectCode: project.project_code,
        projectDescription: project.project_description,
        clientId: project.client_id,
        clientName: project.client?.client_name,
        vendorId: project.service_delivery_partner_id,
        vendorName: project.vendors?.vendor_name,
        startDate: project.project_start_date,
        estimatedEndDate: project.project_estimate_end_date,
        kickOffDate: project.project_management_kickOff_date,
        goLiveDate: project.project_management_goLive_date,
        noOfConsultants: project.project_management_no_of_consultants,
        noOfManDays: project.project_management_no_of_man_days,
        actualManDays: project.project_management_actual_no_of_man_days,
        statusId: project.status_master_id,
        statusName: project.status_master?.status,
        fileUpload: project.file_upload,
        createdAt: project.project_management_created_at,
        documents: project.project_documents.map((d: any) => ({
          id: d.id,
          documentName: d.document_name,
          documentLink: d.document_link,
        })),
        // Use new tasks if available, otherwise fallback to old project_task
        tasks: project.tasks?.length > 0 ? project.tasks.map((t: any) => ({
          id: t.id,
          task_code: t.task_code,
          title: t.title,
          description: t.description,
          status_id: t.status_id,
          priority_id: t.priority_id,
          assignee: t.assignee,
          taskStatus: t.taskStatus,
          priority: t.priority,
          due_date: t.due_date,
          // Add other fields as needed
        })) : project.project_task.map((t: any) => ({
          id: t.id, // mapped ID might clash if we mix them, but we prefer new tasks
          taskId: t.project_task_id,
          taskName: t.project_task_name,
          description: t.project_description,
          progress: t.project_task_progress,
          startDate: t.project_task_start_date,
          expectedEndDate: t.project_task_expected_end_date,
          estimatedDays: t.project_task_estimated_days,
          billedDays: t.project_task_billed_days,
        })),
      },
    });
  } catch (error: any) {
    console.error('Get project error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT - Update project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = parseInt(id);
    const body = await request.json();

    if (isNaN(projectId)) {
      return NextResponse.json({ success: false, error: 'Invalid project ID' }, { status: 400 });
    }

    const existing = await prisma.projectManagement.findFirst({
      where: { id: projectId, project_management_deleted_at: null },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    const updateData: any = { project_management_updated_at: new Date() };

    const stringFields = ['project_name', 'project_description', 'file_upload'];
    stringFields.forEach(f => { if (body[f] !== undefined) updateData[f] = body[f]; });

    const intFields = ['client_id', 'service_delivery_partner_id', 'project_management_no_of_consultants', 'project_management_no_of_man_days', 'status_master_id'];
    intFields.forEach(f => { if (body[f] !== undefined) updateData[f] = body[f] ? parseInt(body[f]) : null; });

    const dateFields = ['project_start_date', 'project_estimate_end_date', 'project_management_kickOff_date', 'project_management_goLive_date'];
    dateFields.forEach(f => { if (body[f] !== undefined) updateData[f] = body[f] ? new Date(body[f]) : null; });

    if (body.updated_by) updateData.project_management_updated_by = body.updated_by;

    const project = await prisma.projectManagement.update({
      where: { id: projectId },
      data: updateData,
      include: {
        client: { select: { client_name: true } },
        status_master: { select: { status: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: project.id,
        projectName: project.project_name,
        projectCode: project.project_code,
        clientName: project.client?.client_name,
        statusName: project.status_master?.status,
      },
      message: 'Project updated successfully',
    });
  } catch (error: any) {
    console.error('Update project error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE - Soft delete project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = parseInt(id);

    if (isNaN(projectId)) {
      return NextResponse.json({ success: false, error: 'Invalid project ID' }, { status: 400 });
    }

    await prisma.projectManagement.update({
      where: { id: projectId },
      data: { project_management_deleted_at: new Date() },
    });

    return NextResponse.json({ success: true, message: 'Project deleted successfully' });
  } catch (error: any) {
    console.error('Delete project error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

