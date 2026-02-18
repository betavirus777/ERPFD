// Mock data for Project Management - use until database is ready

export const mockTaskStatuses = [
    { id: 1, name: 'To Do', code: 'TODO', color: '#6B7280', order: 1 },
    { id: 2, name: 'In Progress', code: 'IN_PROGRESS', color: '#3B82F6', order: 2 },
    { id: 3, name: 'In Review', code: 'REVIEW', color: '#F59E0B', order: 3 },
    { id: 4, name: 'Blocked', code: 'BLOCKED', color: '#EF4444', order: 4 },
    { id: 5, name: 'Done', code: 'DONE', color: '#10B981', order: 5 },
]

export const mockTaskPriorities = [
    { id: 1, name: 'Low', code: 'LOW', color: '#6B7280', order: 1 },
    { id: 2, name: 'Medium', code: 'MEDIUM', color: '#3B82F6', order: 2 },
    { id: 3, name: 'High', code: 'HIGH', color: '#F59E0B', order: 3 },
    { id: 4, name: 'Critical', code: 'CRITICAL', color: '#EF4444', order: 4 },
]

export const mockProjects = [
    {
        id: 1,
        project_name: 'HRMS Modernization',
        project_code: 'PROJ-001',
        project_description: 'Upgrade legacy HRMS system to modern cloud-based solution',
        status: true,
        client: { id: 1, client_name: 'Internal - Forward Defense' },
        status_master: { id: 1, status: 'Active' },
        _count: { tasks: 12, resourceAllocations: 5, timesheets: 45 }
    },
    {
        id: 2,
        project_name: 'Client Portal Development',
        project_code: 'PROJ-002',
        project_description: 'Build self-service portal for client management',
        status: true,
        client: { id: 2, client_name: 'Acme Corporation' },
        status_master: { id: 1, status: 'Active' },
        _count: { tasks: 8, resourceAllocations: 3, timesheets: 24 }
    },
    {
        id: 3,
        project_name: 'Mobile App Development',
        project_code: 'PROJ-003',
        project_description: 'Native iOS and Android mobile applications',
        status: true,
        client: { id: 3, client_name: 'TechStart Inc' },
        status_master: { id: 1, status: 'Active' },
        _count: { tasks: 15, resourceAllocations: 4, timesheets: 60 }
    },
]

export const mockTasks = [
    // Project 1 - HRMS Modernization
    {
        id: 1,
        task_code: 'TASK-001',
        project_id: 1,
        title: 'Design new employee onboarding flow',
        description: 'Create wireframes and mockups for streamlined onboarding process',
        status_id: 2,
        priority_id: 3,
        assignee: { uid: 'EMP-001', first_name: 'John', last_name: 'Doe', employee_photo: null },
        taskStatus: mockTaskStatuses[1],
        priority: mockTaskPriorities[2],
        estimated_hours: 16,
        due_date: '2026-01-15',
        _count: { comments: 3, attachments: 2 }
    },
    {
        id: 2,
        task_code: 'TASK-002',
        project_id: 1,
        title: 'Implement authentication system',
        description: 'Set up JWT-based authentication with 2FA support',
        status_id: 2,
        priority_id: 4,
        assignee: { uid: 'EMP-002', first_name: 'Sarah', last_name: 'Smith', employee_photo: null },
        taskStatus: mockTaskStatuses[1],
        priority: mockTaskPriorities[3],
        estimated_hours: 24,
        due_date: '2026-01-12',
        _count: { comments: 5, attachments: 1 }
    },
    {
        id: 3,
        task_code: 'TASK-003',
        project_id: 1,
        title: 'Database schema design',
        description: 'Design and document complete database schema',
        status_id: 5,
        priority_id: 3,
        assignee: { uid: 'EMP-003', first_name: 'Mike', last_name: 'Johnson', employee_photo: null },
        taskStatus: mockTaskStatuses[4],
        priority: mockTaskPriorities[2],
        estimated_hours: 12,
        due_date: '2026-01-08',
        _count: { comments: 2, attachments: 3 }
    },
    {
        id: 4,
        task_code: 'TASK-004',
        project_id: 1,
        title: 'Setup CI/CD pipeline',
        description: 'Configure automated testing and deployment',
        status_id: 1,
        priority_id: 2,
        assignee: null,
        taskStatus: mockTaskStatuses[0],
        priority: mockTaskPriorities[1],
        estimated_hours: 8,
        due_date: '2026-01-20',
        _count: { comments: 0, attachments: 0 }
    },
    {
        id: 5,
        task_code: 'TASK-005',
        project_id: 1,
        title: 'Performance optimization',
        description: 'Optimize database queries and API response times',
        status_id: 1,
        priority_id: 2,
        assignee: { uid: 'EMP-001', first_name: 'John', last_name: 'Doe', employee_photo: null },
        taskStatus: mockTaskStatuses[0],
        priority: mockTaskPriorities[1],
        estimated_hours: 16,
        due_date: '2026-01-25',
        _count: { comments: 1, attachments: 0 }
    },
    {
        id: 6,
        task_code: 'TASK-006',
        project_id: 1,
        title: 'Write API documentation',
        description: 'Complete OpenAPI/Swagger documentation for all endpoints',
        status_id: 3,
        priority_id: 2,
        assignee: { uid: 'EMP-004', first_name: 'Emily', last_name: 'Chen', employee_photo: null },
        taskStatus: mockTaskStatuses[2],
        priority: mockTaskPriorities[1],
        estimated_hours: 12,
        due_date: '2026-01-18',
        _count: { comments: 4, attachments: 1 }
    },

    // Project 2 - Client Portal
    {
        id: 7,
        task_code: 'TASK-007',
        project_id: 2,
        title: 'Client dashboard UI',
        description: 'Design and implement responsive dashboard interface',
        status_id: 2,
        priority_id: 3,
        assignee: { uid: 'EMP-005', first_name: 'David', last_name: 'Lee', employee_photo: null },
        taskStatus: mockTaskStatuses[1],
        priority: mockTaskPriorities[2],
        estimated_hours: 20,
        due_date: '2026-01-14',
        _count: { comments: 2, attachments: 5 }
    },
    {
        id: 8,
        task_code: 'TASK-008',
        project_id: 2,
        title: 'Implement file upload',
        description: 'Secure file upload with virus scanning',
        status_id: 1,
        priority_id: 3,
        assignee: null,
        taskStatus: mockTaskStatuses[0],
        priority: mockTaskPriorities[2],
        estimated_hours: 10,
        due_date: '2026-01-22',
        _count: { comments: 0, attachments: 0 }
    },
]

export const mockComments = [
    {
        id: 1,
        task_id: 1,
        comment: 'Started working on the wireframes. Should have initial drafts by EOD.',
        created_by: 'EMP-001',
        author: { uid: 'EMP-001', first_name: 'John', last_name: 'Doe', employee_photo: null },
        created_at: '2026-01-07T10:30:00Z'
    },
    {
        id: 2,
        task_id: 1,
        comment: 'Great progress! Can you also include mobile layouts?',
        created_by: 'EMP-003',
        author: { uid: 'EMP-003', first_name: 'Mike', last_name: 'Johnson', employee_photo: null },
        created_at: '2026-01-07T14:15:00Z'
    },
]

// Helper functions
export const getProjectById = (id: number) => {
    return mockProjects.find(p => p.id === id)
}

export const getTasksByProject = (projectId: number) => {
    return mockTasks.filter(t => t.project_id === projectId)
}

export const getTasksByStatus = (projectId: number, statusId: number) => {
    return mockTasks.filter(t => t.project_id === projectId && t.status_id === statusId)
}

export const getTaskById = (id: number) => {
    return mockTasks.find(t => t.id === id)
}

export const getCommentsByTask = (taskId: number) => {
    return mockComments.filter(c => c.task_id === taskId)
}

// Simulate API delay
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
