import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedProjectManagement() {
    console.log('🌱 Seeding Project Management data...');

    // 1. Seed Task Statuses
    console.log('Creating task statuses...');
    const taskStatuses = await Promise.all([
        prisma.taskStatus.upsert({
            where: { code: 'TODO' },
            update: {},
            create: {
                name: 'To Do',
                code: 'TODO',
                description: 'Task is ready to be worked on',
                color: '#6B7280', // Gray
                icon: 'circle',
                order: 1,
                is_final: false,
            },
        }),
        prisma.taskStatus.upsert({
            where: { code: 'IN_PROGRESS' },
            update: {},
            create: {
                name: 'In Progress',
                code: 'IN_PROGRESS',
                description: 'Task is currently being worked on',
                color: '#3B82F6', // Blue
                icon: 'clock',
                order: 2,
                is_final: false,
            },
        }),
        prisma.taskStatus.upsert({
            where: { code: 'REVIEW' },
            update: {},
            create: {
                name: 'In Review',
                code: 'REVIEW',
                description: 'Task is being reviewed',
                color: '#F59E0B', // Orange
                icon: 'eye',
                order: 3,
                is_final: false,
            },
        }),
        prisma.taskStatus.upsert({
            where: { code: 'BLOCKED' },
            update: {},
            create: {
                name: 'Blocked',
                code: 'BLOCKED',
                description: 'Task is blocked by dependencies',
                color: '#EF4444', // Red
                icon: 'alert-circle',
                order: 4,
                is_final: false,
            },
        }),
        prisma.taskStatus.upsert({
            where: { code: 'DONE' },
            update: {},
            create: {
                name: 'Done',
                code: 'DONE',
                description: 'Task is completed',
                color: '#10B981', // Green
                icon: 'check-circle',
                order: 5,
                is_final: true,
            },
        }),
    ]);
    console.log(`✅ Created ${taskStatuses.length} task statuses`);

    // 2. Seed Task Priorities
    console.log('Creating task priorities...');
    const taskPriorities = await Promise.all([
        prisma.taskPriority.upsert({
            where: { code: 'LOW' },
            update: {},
            create: {
                name: 'Low',
                code: 'LOW',
                color: '#6B7280', // Gray
                order: 1,
            },
        }),
        prisma.taskPriority.upsert({
            where: { code: 'MEDIUM' },
            update: {},
            create: {
                name: 'Medium',
                code: 'MEDIUM',
                color: '#3B82F6', // Blue
                order: 2,
            },
        }),
        prisma.taskPriority.upsert({
            where: { code: 'HIGH' },
            update: {},
            create: {
                name: 'High',
                code: 'HIGH',
                color: '#F59E0B', // Orange
                order: 3,
            },
        }),
        prisma.taskPriority.upsert({
            where: { code: 'CRITICAL' },
            update: {},
            create: {
                name: 'Critical',
                code: 'CRITICAL',
                color: '#EF4444', // Red
                order: 4,
            },
        }),
    ]);
    console.log(`✅ Created ${taskPriorities.length} task priorities`);

    console.log('✅ Project Management seed data complete!');
}

async function main() {
    try {
        await seedProjectManagement();
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

main();
