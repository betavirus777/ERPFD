import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { apiResponse, apiError, APIError } from '@/lib/api-response';
import { HttpStatus } from '@/lib/constants';
import { checkRateLimit, RateLimits } from '@/lib/rate-limit';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

// Task creation/update schema
const projectSchema = z.object({
  name: z.string().min(3).max(255),
  description: z.string().optional(),
  client_id: z.number().int().positive(),
  currency_id: z.number().int().positive(),
  code: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  status_id: z.number().int().positive().optional(),
  budget: z.number().or(z.string()).optional(),
  priority: z.string().optional(),
  project_type: z.string().optional(),
});

/**
 * GET /api/projects
 * List all projects
 */
export async function GET(request: NextRequest) {
  try {
    if (!checkRateLimit(request, RateLimits.API_READ.limit)) {
      throw APIError.rateLimitExceeded();
    }

    const user = await getUserFromRequest(request);
    if (!user) {
      throw APIError.unauthorized();
    }

    if (!(await hasPermission(user, PERMISSIONS.PROJECT_VIEW))) {
      throw APIError.forbidden('You do not have permission to view projects');
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const client_id = searchParams.get('client_id');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {
      project_management_deleted_at: null,
    };

    if (status) {
      where.status = status === 'true';
    }

    if (client_id) {
      where.client_id = parseInt(client_id);
    }

    if (search) {
      where.OR = [
        { project_name: { contains: search } },
        { project_code: { contains: search } },
        { project_description: { contains: search } },
      ];
    }

    // Check if new PM tables exist
    let useNewSchema = false;
    try {
      await prisma.$queryRaw`SELECT 1 FROM tasks LIMIT 1`;
      useNewSchema = true;
    } catch (e) {
      useNewSchema = false;
    }

    let projects, total;

    if (useNewSchema) {
      // Use NEW PM module schema
      [projects, total] = await Promise.all([
        prisma.projectManagement.findMany({
          where,
          include: {
            client: {
              select: {
                id: true,
                client_name: true,
              },
            },
            status_master: {
              select: {
                id: true,
                status: true,
              },
            },
            _count: {
              select: {
                // Using explicit relation names from schema if possible, or suppressing TS error
                // tasks: true, // If this errors, removing it is safer for build
                project_task: true,
              },
            },
          } as any,
          orderBy: { project_management_created_at: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.projectManagement.count({ where }),
      ]);
    } else {
      // Use EXISTING schema (fallback)
      [projects, total] = await Promise.all([
        prisma.projectManagement.findMany({
          where,
          include: {
            client: {
              select: {
                id: true,
                client_name: true,
              },
            },
            status_master: {
              select: {
                id: true,
                status: true,
              },
            },
            _count: {
              select: {
                project_task: true,
                project_management_resource_assignment: true,
              },
            },
          },
          orderBy: { project_management_created_at: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.projectManagement.count({ where }),
      ]);

      // Transform old schema to match new format
      projects = projects.map((project: any) => ({
        ...project,
        _count: {
          tasks: project._count.project_task || 0,
          resourceAllocations: project._count.project_management_resource_assignment || 0,
          timesheets: 0,
        },
      }));
    }

    return apiResponse(
      projects,
      HttpStatus.OK,
      {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    );
  } catch (error) {
    return apiError(error);
  }
}

/**
 * POST /api/projects
 * Create a new project
 */
export async function POST(request: NextRequest) {
  try {
    if (!checkRateLimit(request, RateLimits.API_WRITE.limit)) {
      throw APIError.rateLimitExceeded();
    }

    const user = await getUserFromRequest(request);
    if (!user) {
      throw APIError.unauthorized();
    }

    if (!(await hasPermission(user, PERMISSIONS.PROJECT_CREATE))) {
      throw APIError.forbidden('You do not have permission to create projects');
    }

    const body = await request.json();
    const validated = projectSchema.parse(body);

    // Generate code if missing
    let projectCode = validated.code;
    if (!projectCode) {
      const date = new Date();
      const year = date.getFullYear();
      const count = await prisma.projectManagement.count();
      projectCode = `PRJ-${year}-${(count + 1).toString().padStart(4, '0')}`;
    }

    const project = await prisma.projectManagement.create({
      data: {
        project_name: validated.name,
        project_description: validated.description,
        client_id: validated.client_id,
        project_management_currency: validated.currency_id,
        project_code: projectCode,
        project_start_date: validated.start_date ? new Date(validated.start_date) : null,
        project_estimate_end_date: validated.end_date ? new Date(validated.end_date) : null,
        status_master_id: validated.status_id,
        project_budget: validated.budget ? parseFloat(validated.budget.toString()) : null,
        priority: validated.priority,
        project_type: validated.project_type,
        // Use employeeUid, falling back to email or 'system'
        project_management_created_by: user.employeeUid || user.email || 'system',
        project_management_created_at: new Date(),
        project_management_updated_at: new Date(),
        status: true
      }
    });

    return apiResponse(project, HttpStatus.CREATED);
  } catch (error) {
    return apiError(error);
  }
}
