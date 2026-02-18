import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { apiResponse, apiError, APIError } from '@/lib/api-response';
import { HttpStatus } from '@/lib/constants';

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) throw APIError.unauthorized();

        // Fetch all employees with comprehensive related data
        const employees = await prisma.employeeOnboarding.findMany({
            where: {
                deleted_at: null,
            },
            include: {
                designation_master: true,
                role: true,
                country: true,
                statusMaster: true,
                employee_bank_details: {
                    where: { status: true, deleted_at: null },
                    take: 1
                },
                employee_personal_detail: {
                    where: { status: true, deleted_at: null },
                    take: 1
                },
                emergencyContacts: {
                    where: { status: true, deleted_at: null },
                    orderBy: { id: 'asc' },
                    take: 2
                },
                employee_onboard_document: {
                    where: { deleted_at: null },
                    include: {
                        employee_document_master: true
                    }
                },
                salaryDetails: {
                    where: { status: true, deleted_at: null }
                }
            },
            orderBy: { id: 'asc' }
        });

        // Helper function to find document by type
        const findDocument = (docs: any[], type: string) => {
            return docs.find(d =>
                d.employee_document_master?.document_type_name?.toLowerCase().includes(type.toLowerCase())
            );
        };

        // Calculate age from DOB
        const calculateAge = (dob: Date | null) => {
            if (!dob) return '';
            const today = new Date();
            const birthDate = new Date(dob);
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            return age;
        };

        // Calculate tenure from DOJ
        const calculateTenure = (doj: Date | null) => {
            if (!doj) return '';
            const today = new Date();
            const joinDate = new Date(doj);
            const years = today.getFullYear() - joinDate.getFullYear();
            const months = today.getMonth() - joinDate.getMonth();
            const totalMonths = years * 12 + months;
            const y = Math.floor(totalMonths / 12);
            const m = totalMonths % 12;
            return `${y}y ${m}m`;
        };

        // Format date helper
        const formatDate = (date: Date | string | null) => {
            if (!date) return '';
            return new Date(date).toLocaleDateString('en-GB');
        };

        // Calculate salary totals
        const calculateSalary = (salaryDetails: any[]) => {
            let basic = 0;
            let allowances = 0;
            let airTicket = 0;

            salaryDetails.forEach(s => {
                const amount = s.allowance_type_salary_amount || 0;
                // Assuming allowance_type_id 1 = Basic, others are allowances
                if (s.allowance_type_id === 1) {
                    basic = amount;
                } else if (s.allowance_type_id === 5) { // Assuming 5 = Air Ticket
                    airTicket = amount;
                } else {
                    allowances += amount;
                }
            });

            return { basic, allowances, gross: basic + allowances, airTicket };
        };

        // Map to export format
        const exportData = employees.map((emp, index) => {
            const passport = findDocument(emp.employee_onboard_document, 'passport');
            const visa = findDocument(emp.employee_onboard_document, 'visa');
            const emiratesId = findDocument(emp.employee_onboard_document, 'emirates');
            const labourCard = findDocument(emp.employee_onboard_document, 'labour');
            const insurance = findDocument(emp.employee_onboard_document, 'insurance');
            const residence = findDocument(emp.employee_onboard_document, 'residence');

            const bank = emp.employee_bank_details[0];
            const personal = emp.employee_personal_detail[0];
            const contact1 = emp.emergencyContacts[0];
            const contact2 = emp.emergencyContacts[1];
            const salary = calculateSalary(emp.salaryDetails);

            return {
                'SI.No.': index + 1,
                'Employee ID': emp.employee_code || emp.uid,
                'Employee Name': `${emp.first_name} ${emp.last_name}`,
                'FD Designation': emp.designation_master?.designation_name || '',
                'Visa Designation': emp.visa_type || '',
                'Date of Joining': formatDate(emp.doj),
                'Tenure': calculateTenure(emp.doj),
                'Leaving Date': '', // Not in current schema
                'Probation Period': '6 Months', // Default
                'Probation Confirmation': '', // Not in current schema
                'Basic Salary': salary.basic,
                'Allowances': salary.allowances,
                'Gross Salary': salary.gross,
                'Air Ticket Allowance': salary.airTicket,
                'UAE Contact No.': emp.phone_number || '',
                'Work Email Address': emp.email || '',
                'Personal Email': emp.personal_email || '',
                'Notice Period': '30 Days', // Default
                'Contract Type': emp.employee_type || '',
                'Account': '', // Project/Client assignment
                'Work Location': 'UAE',
                'Work Setup': emp.engagement_method || '',
                'Benefits Entitlement': '',
                'Nationality': emp.nationality || '',
                'Gender': personal?.gender === 1 ? 'Male' : personal?.gender === 2 ? 'Female' : '',
                'Date of Birth': formatDate(emp.dob),
                'Age': calculateAge(emp.dob),
                'Civil Status': personal?.marital_status === 1 ? 'Single' : personal?.marital_status === 2 ? 'Married' : '',
                'Place of Birth': '',
                'Passport No.': passport?.document_number || '',
                'Passport Issue Date': formatDate(passport?.start_date),
                'Passport Expiry Date': formatDate(passport?.end_date),
                'Unified ID': '',
                'Visa Type': emp.visa_type || '',
                'Visa Issue Authority': '',
                'Residence Permit No.': residence?.document_number || '',
                'Residence Visa Issue Date': formatDate(residence?.start_date),
                'Residence Visa Expiry Date': formatDate(residence?.end_date),
                'Emirates ID Number': emiratesId?.document_number || '',
                'Emirates ID Expiry Date': formatDate(emiratesId?.end_date),
                'Labour Card No.': labourCard?.document_number || '',
                'Labour Card Expiry Date': formatDate(labourCard?.end_date),
                'Insurance': insurance ? 'Yes' : 'No',
                'Insurance Category': '',
                'Insurance Card No.': insurance?.document_number || '',
                'Insurance Expiry Date': formatDate(insurance?.end_date),
                'ILOE Expiry Date': '',
                'Bank Name': bank?.bank_name || '',
                'Account Name': bank?.recipient_name || '',
                'Account No.': bank?.bank_account_number || '',
                'IBAN Number': bank?.bank_iban_number || '',
                'UAE Routing Code': '',
                'IFSC Code': bank?.bank_swift_code || '',
                'UAE Address': emp.temp_address || '',
                'Home Country Address': emp.permanent_address || '',
                'Home Country Contact No.': '',
                'Emergency Contact Name': contact1?.name || '',
                'Emergency Contact No.': contact1?.contact_number || '',
                'Emergency Contact Relationship': contact1?.relationship || '',
                'Emergency Contact Name2': contact2?.name || '',
                'Emergency Contact No.3': contact2?.contact_number || '',
                'Emergency Contact Relationship4': contact2?.relationship || '',
            };
        });

        return apiResponse({
            data: exportData,
            total: exportData.length
        }, HttpStatus.OK);

    } catch (error) {
        console.error('Export error:', error);
        return apiError(error);
    }
}
