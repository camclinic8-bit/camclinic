# Cam Clinic - Camera Service Management System

A comprehensive camera service management software for multi-branch camera shops, built with Next.js 16, Supabase, and TypeScript.

## 🚀 Features

### Core Functionality
- **Multi-Branch Management**: Manage multiple camera service branches
- **Job Tracking**: Complete job lifecycle from creation to completion
- **Customer Management**: Customer database with job history
- **Technician Assignment**: Assign jobs to technicians with role-based access
- **Real-time Dashboard**: Live statistics and performance metrics
- **Reports & Analytics**: Generate detailed reports with filtering
- **User Management**: Create and manage staff with different roles

### User Roles
- **Super Admin**: Full system access, user management, branch management
- **Service Manager**: Branch operations, job assignments, staff management
- **Service Incharge**: Branch operations, manage assigned jobs
- **Technician**: View and update only assigned jobs

### Technical Features
- **Authentication**: Secure login with Supabase Auth
- **Row Level Security**: Data access control based on user roles
- **Real-time Updates**: Instant data refresh across all modules
- **Optimized Performance**: Parallel queries, efficient data fetching
- **Type Safety**: Full TypeScript implementation
- **Responsive Design**: Works on desktop and mobile devices

## 🛠️ Tech Stack

- **Framework**: Next.js 16.2.1 with App Router
- **Language**: TypeScript (strict mode)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with RLS policies
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Forms**: React Hook Form + Zod validation
- **Styling**: TailwindCSS v4
- **UI Components**: Custom components with Lucide icons
- **PDF Generation**: jsPDF + jsPDF-autotable

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account and project

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/your-username/cam-clinic.git
cd cam-clinic
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

To get these values:
1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the Project URL, anon key, and service role key

### 4. Set up the database
Run the Supabase migrations in order:

1. **Initial Schema** (`supabase/migrations/001_initial_schema.sql`)
2. **RLS Policies** (`supabase/migrations/002_rls_policies.sql`)
3. **Seed Data** (`supabase/migrations/003_seed_data.sql`)

You can run these via the Supabase SQL Editor or CLI.

### 5. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
cam-clinic/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── (auth)/         # Authentication routes
│   │   ├── (dashboard)/    # Protected dashboard routes
│   │   └── api/            # API routes
│   ├── components/         # Reusable components
│   │   ├── jobs/          # Job-related components
│   │   ├── layout/        # Layout components
│   │   └── ui/            # UI components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility libraries
│   │   └── db/           # Database functions
│   ├── stores/            # Zustand stores
│   └── types/             # TypeScript types
├── supabase/              # Database migrations and config
└── public/               # Static assets
```

## 🔐 Default Admin Account

After setting up the database, you can login with:
- **Email**: `camclinic8@gmail.com`
- **Password**: `admin123`

## 📊 Database Schema

### Main Tables
- **shops**: Shop/branch company information
- **branches**: Physical branch locations
- **profiles**: User profiles with roles and permissions
- **customers**: Customer information
- **jobs**: Service jobs with status tracking
- **job_products**: Products associated with jobs
- **spare_parts**: Spare parts used in repairs

### Relationships
- Shops → Branches (1:N)
- Branches → Users/Jobs/Customers (1:N)
- Users → Jobs (Technician assignments)
- Customers → Jobs (1:N)
- Jobs → Products/Parts (1:N)

## 🔧 Development

### Available Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push to main branch

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is proprietary software. All rights reserved.
