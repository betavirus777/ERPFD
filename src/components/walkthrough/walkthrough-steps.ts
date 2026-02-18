export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface WalkthroughStep {
  id: string;
  targetSelector: string;
  title: string;
  description: string;
  placement: TooltipPlacement;
  icon?: string;
  module?: string;
}

export const WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    id: 'welcome',
    targetSelector: '[data-tour="sidebar-logo"]',
    title: 'Welcome to HRMS! 👋',
    description: 'Let us show you around the platform. This quick tour will help you get familiar with all the key features.',
    placement: 'right',
    module: 'Getting Started',
  },
  {
    id: 'dashboard',
    targetSelector: '[data-tour="nav-dashboard"]',
    title: 'Dashboard',
    description: 'Your command center. View key metrics, quick stats, upcoming birthdays, and recent activities at a glance.',
    placement: 'right',
    icon: '📊',
    module: 'Main',
  },
  {
    id: 'employees',
    targetSelector: '[data-tour="nav-employees"]',
    title: 'Employee Management',
    description: 'Manage your entire workforce — view profiles, update details, track documents, and export data.',
    placement: 'right',
    icon: '👥',
    module: 'Workforce',
  },
  {
    id: 'leave',
    targetSelector: '[data-tour="nav-leave"]',
    title: 'Leave Management',
    description: 'Apply for leave, check balances, and approve requests. Track all leave activities across the organization.',
    placement: 'right',
    icon: '📅',
    module: 'Workforce',
  },
  {
    id: 'documents',
    targetSelector: '[data-tour="nav-document-requests"]',
    title: 'Document Requests',
    description: 'Request salary certificates, NOCs, experience letters, and other HR documents with automated workflows.',
    placement: 'right',
    icon: '📄',
    module: 'Workforce',
  },
  {
    id: 'candidates',
    targetSelector: '[data-tour="nav-candidates"]',
    title: 'Candidate Tracking',
    description: 'Manage job applicants from sourcing to onboarding. Convert selected candidates directly into employees.',
    placement: 'right',
    icon: '🎯',
    module: 'Workforce',
  },
  {
    id: 'clients',
    targetSelector: '[data-tour="nav-clients"]',
    title: 'Client Management',
    description: 'Track your client relationships, contracts, and associated projects all in one place.',
    placement: 'right',
    icon: '🏢',
    module: 'Business',
  },
  {
    id: 'projects',
    targetSelector: '[data-tour="nav-projects"]',
    title: 'Projects',
    description: 'Monitor project progress, manage timesheets, assign tasks, and track deliverables.',
    placement: 'right',
    icon: '📁',
    module: 'Business',
  },
  {
    id: 'sales',
    targetSelector: '[data-tour="nav-sales"]',
    title: 'Sales & Invoices',
    description: 'Create quotations, manage invoices, and track your sales pipeline from opportunity to payment.',
    placement: 'right',
    icon: '💰',
    module: 'Finance',
  },
  {
    id: 'reports',
    targetSelector: '[data-tour="nav-reports"]',
    title: 'Reports & Analytics',
    description: 'Generate leave reports, track document expiry dates, and export data for compliance.',
    placement: 'right',
    icon: '📈',
    module: 'Finance',
  },
  {
    id: 'settings',
    targetSelector: '[data-tour="nav-settings"]',
    title: 'Administration',
    description: 'Configure master data, manage roles & permissions, and review the audit trail.',
    placement: 'right',
    icon: '⚙️',
    module: 'Admin',
  },
  {
    id: 'theme',
    targetSelector: '[data-tour="theme-toggle"]',
    title: 'Theme Switcher',
    description: 'Toggle between light and dark mode for a comfortable viewing experience.',
    placement: 'bottom',
    icon: '🌙',
    module: 'Header',
  },
  {
    id: 'profile',
    targetSelector: '[data-tour="user-menu"]',
    title: 'Your Profile',
    description: 'Access your profile, change your password, or logout from here. You\'re all set — enjoy using the platform!',
    placement: 'bottom',
    icon: '👤',
    module: 'Header',
  },
];
