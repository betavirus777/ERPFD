# FDCS HRMS - Next.js Application

A modern Human Resource Management System built with Next.js 15, TypeScript, Tailwind CSS, and beautiful UI components.

## 🚀 Features

### Authentication
- Email/Password login with session management
- OTP-based login alternative
- Two-factor authentication (2FA) support
- Forgot password and password reset flows
- Protected routes with middleware

### Dashboard
- Interactive widgets with real-time stats
- Revenue charts and analytics
- Employee leave tracking
- Document expiry alerts
- Sales pipeline visualization
- Customizable widget layout

### Employee Management
- Employee listing with grid/table views
- Add/Edit/Delete employees
- Employee profile with detailed information
- Designation and department management
- Internal/External employee types
- Visa and engagement mode tracking

### Leave Management
- Leave balance tracking by type
- Leave application workflow
- Approval/rejection system
- Leave allocation management
- Leave reports and summaries

### Client Management
- Client profiles and contacts
- Industry categorization
- Project tracking per client
- Revenue analytics

### Vendor Management
- Vendor profiles
- Service delivery partners
- Rate management

### Project Management
- Project lifecycle tracking
- Milestone management
- Task tracking
- Resource allocation
- Budget and profitability tracking

### Opportunities/Leads
- Sales pipeline management
- Opportunity stages
- Asset and resource assignment
- Service delivery tracking

### Reports & Analytics
- Financial reports (quarterly/annual)
- Project profitability reports
- Employee distribution reports
- Sales pipeline analysis
- Business distribution charts
- Export to PDF/Excel

### Settings & Master Data
- Company settings
- Designations
- Departments
- Leave types
- Expense types
- Document types
- Industries
- Access control & roles
- Audit trail

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives with shadcn/ui styling
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Charts**: Recharts
- **Form Handling**: React Hook Form + Zod
- **HTTP Client**: Axios
- **Icons**: Lucide React

## 📦 Installation

```bash
# Clone or copy the project
cd hrms-next

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Update .env.local with your API URL
# NEXT_PUBLIC_API_URL=http://localhost:9090/api

# Run development server
npm run dev
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file with:

```env
# API Configuration (your existing Laravel backend)
NEXT_PUBLIC_API_URL=http://localhost:9090/api

# Application
NEXT_PUBLIC_APP_NAME=FDCS HRMS
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Connecting to Existing Backend

This application is designed to work with your existing Laravel backend. The API integration layer (`src/lib/api.ts`) contains all the API endpoints that match your existing routes:

- Authentication APIs
- Employee APIs
- Leave APIs
- Client/Vendor APIs
- Project APIs
- Report APIs
- Settings APIs

## 🏃 Running the Application

```bash
# Development
npm run dev

# Production build
npm run build
npm start
```

The application will be available at `http://localhost:3000`

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── login/             # Authentication pages
│   ├── dashboard/         # Main dashboard
│   ├── employees/         # Employee management
│   │   └── leave/         # Leave management
│   ├── clients/           # Client management
│   ├── projects/          # Project management
│   ├── reports/           # Reports & analytics
│   └── settings/          # Settings & master data
├── components/
│   ├── layout/            # Layout components (Sidebar, Header)
│   └── ui/                # UI components (Button, Card, etc.)
├── lib/
│   ├── api.ts             # API integration layer
│   └── utils.ts           # Utility functions
└── store/
    └── auth.ts            # Authentication state management
```

## 🎨 UI/UX Highlights

- **Modern Design**: Glass morphism effects, gradients, and smooth animations
- **Dark Mode**: Full dark mode support
- **Responsive**: Mobile-first responsive design
- **Accessible**: Built with Radix UI for accessibility
- **Beautiful Typography**: Outfit font family
- **Color Scheme**: Emerald/Teal gradient accent colors

## 🔐 Authentication Flow

1. User enters email and password (or requests OTP)
2. Backend validates credentials and returns token + user data
3. Token is stored in cookies for subsequent requests
4. Middleware protects routes and redirects unauthenticated users
5. Optional 2FA verification step

## 📊 Using the Existing PostgreSQL Database

This application connects to your existing PostgreSQL database through the Laravel backend. No database changes are required - the app uses the same tables and relationships.

## 🚀 Deployment

```bash
# Build for production
npm run build

# The output will be in .next/

# Start production server
npm start
```

For production deployment, consider:
- Vercel (recommended for Next.js)
- Docker container
- Node.js server with PM2

## 📝 License

Private - FDCS Internal Use

---

Built with ❤️ using Next.js and modern web technologies
# ERPFD
