import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import {
  verifyOTP,
  generateToken,
  getMenusForRole,
  getPermissionsForRole,
  logLoginAttempt,
  clearOTP
} from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, code: 400, error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.login.findFirst({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, code: 404, error: 'User not found.' },
        { status: 404 }
      );
    }

    // Verify OTP
    const isValidOTP = verifyOTP(user.id.toString(), otp);
    if (!isValidOTP) {
      return NextResponse.json(
        { success: false, code: 401, error: 'Invalid or expired OTP.' },
        { status: 401 }
      );
    }

    // Check user status
    if (!user.status) {
      return NextResponse.json(
        { success: false, code: 403, error: 'User account is inactive.' },
        { status: 403 }
      );
    }

    // Find related employee/client/vendor by user_id
    const employee = await prisma.employeeOnboarding.findFirst({
      where: { uid: user.user_id, status: true },
      include: { role: true, statusMaster: true },
    });

    const clientContact = !employee ? await prisma.clients_personal_details.findFirst({
      where: { uid: user.user_id, status: true },
    }) : null;

    const vendorContact = !employee && !clientContact ? await prisma.vendorContactDetails.findFirst({
      where: { uid: user.user_id, status: true },
    }) : null;

    // Get organisation
    const organisation = await prisma.organisation.findFirst();
    if (!organisation) {
      return NextResponse.json(
        { success: false, code: 500, error: 'Organisation not configured' },
        { status: 500 }
      );
    }

    // Get base currency
    const baseCurrency = await prisma.baseCurrencyMaster.findFirst({
      where: { status: true },
    });

    let baseCurrencyData = null;
    if (baseCurrency?.base_currency_id) {
      baseCurrencyData = await prisma.countryMaster.findUnique({
        where: { id: baseCurrency.base_currency_id },
      });
    }

    // Build response based on user type
    let responseData: Record<string, unknown> = {};

    if (employee) {
      const roleId = employee.role_master_id || 0;
      const organizationId = organisation.id;

      const token = generateToken({
        userId: user.id,
        email: user.email,
        employeeUid: employee.uid,
        roleId,
        organizationId,
      });

      const menus = await getMenusForRole(roleId, organizationId);
      const permissions = await getPermissionsForRole(roleId, organizationId);

      responseData = {
        id: employee.uid,
        roleId,
        organizationId,
        employeeCode: employee.employee_code,
        firstName: employee.first_name,
        lastName: employee.last_name,
        email: user.email,
        token,
        menus: { success: true, code: 200, data: menus },
        permissions,
        baseCurrencyId: baseCurrency?.base_currency_id,
        baseCurrency: baseCurrencyData?.country_currency,
        monthDays: 22,
        photo: employee.employee_photo,
      };
    } else if (clientContact) {
      const roleId = clientContact.role || 0;
      const organizationId = organisation.id;

      const token = generateToken({
        userId: user.id,
        email: user.email,
        employeeUid: clientContact.uid || undefined,
        roleId,
        organizationId,
      });

      const menus = await getMenusForRole(roleId, organizationId);
      const permissions = await getPermissionsForRole(roleId, organizationId);

      const names = clientContact.person_name?.split(' ') || ['', ''];

      responseData = {
        id: clientContact.uid,
        roleId,
        organizationId,
        firstName: names[0],
        lastName: names[1] || '',
        email: user.email,
        token,
        menus: { success: true, code: 200, data: menus },
        permissions,
        baseCurrencyId: baseCurrency?.base_currency_id,
        baseCurrency: baseCurrencyData?.country_currency,
        monthDays: 22,
        photo: clientContact.client_contact_document,
      };
    } else if (vendorContact) {
      const roleId = vendorContact.role_master_id || 0;
      const organizationId = organisation.id;

      const token = generateToken({
        userId: user.id,
        email: user.email,
        employeeUid: vendorContact.uid || undefined,
        roleId,
        organizationId,
      });

      const menus = await getMenusForRole(roleId, organizationId);
      const permissions = await getPermissionsForRole(roleId, organizationId);

      const names = vendorContact.person_name?.split(' ') || ['', ''];

      responseData = {
        id: vendorContact.uid,
        roleId,
        organizationId,
        firstName: names[0],
        lastName: names[1] || '',
        email: user.email,
        token,
        menus: { success: true, code: 200, data: menus },
        permissions,
        baseCurrencyId: baseCurrency?.base_currency_id,
        baseCurrency: baseCurrencyData?.country_currency,
        monthDays: 22,
        photo: vendorContact.contact_photo,
      };
    } else {
      return NextResponse.json(
        { success: false, code: 403, error: 'Unauthorized access.' },
        { status: 403 }
      );
    }

    // Add force password change flag
    if (responseData) {
      responseData.forceChangePassword = !user.is_password_set;
    }

    // Clear OTP after successful login
    clearOTP(user.id.toString());

    // Log successful login
    await logLoginAttempt(
      email,
      request.url,
      request.headers.get('user-agent') || '',
      request.headers.get('x-forwarded-for') || 'unknown',
      true
    );

    return NextResponse.json({ success: true, code: 200, data: responseData });
  } catch (error) {
    console.error('Login with OTP error:', error);
    return NextResponse.json(
      { success: false, code: 500, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
