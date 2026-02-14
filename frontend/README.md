# PrepIntel Frontend

A production-ready, scalable React + TypeScript + Tailwind CSS frontend for technical interview preparation platform.

## 📋 Project Structure

```
frontend/
├── src/
│   ├── app/                    # Application root
│   │   ├── App.tsx             # Main app component
│   │   ├── router.tsx          # Centralized routing (lazy-loaded)
│   │   └── providers.tsx       # Global providers (Query, Tooltip, etc)
│   │
│   ├── modules/                # Feature modules (domain-driven)
│   │   ├── auth/               # Authentication
│   │   │   ├── pages/          # LoginPage, SignupPage
│   │   │   ├── components/     # Auth-specific components
│   │   │   ├── services/       # Auth API calls
│   │   │   ├── types/          # Auth types
│   │   │   └── hooks/          # Auth hooks
│   │   ├── dashboard/          # Dashboard feature
│   │   ├── roadmap/            # Learning roadmap
│   │   ├── practice/           # Code practice
│   │   ├── mock-interview/     # Interview simulations
│   │   ├── analytics/          # Performance tracking
│   │   ├── mentor/             # AI mentor chat
│   │   ├── planning/           # Task planning
│   │   └── settings/           # User settings
│   │
│   ├── layouts/                # Reusable layout components
│   │   ├── MainLayout.tsx      # Dashboard layout with sidebar
│   │   ├── AuthLayout.tsx      # Auth page layout
│   │   └── DashboardLayout.tsx # Dashboard-specific layout
│   │
│   ├── components/             # Shared components
│   │   ├── ui/                 # shadcn UI components (auto-generated)
│   │   └── common/             # Custom shared components
│   │
│   ├── services/               # Centralized API layer
│   │   ├── apiClient.ts        # HTTP client with interceptors
│   │   ├── authService.ts      # Auth endpoints
│   │   ├── dashboardService.ts # Dashboard data
│   │   ├── roadmapService.ts   # Roadmap data
│   │   ├── practiceService.ts  # Practice problems
│   │   ├── analyticsService.ts # Analytics data
│   │   └── mentorService.ts    # AI mentor API
│   │
│   ├── store/                  # Zustand state management
│   │   ├── authStore.ts        # Global auth state
│   │   ├── roadmapStore.ts     # Roadmap state
│   │   ├── analyticsStore.ts   # Analytics state
│   │   └── mentorStore.ts      # Mentor chat state
│   │
│   ├── hooks/                  # Global custom hooks
│   │   ├── useAuth.ts          # Auth hook
│   │   ├── useIsMobile.ts      # Mobile detection
│   │   └── index.ts            # Barrel export
│   │
│   ├── utils/                  # Utility functions
│   │   └── utils.ts            # Helper utilities (cn, format, etc)
│   │
│   ├── types/                  # Global TypeScript definitions
│   │   └── index.ts            # Core domain models
│   │
│   ├── assets/                 # Images, fonts, logos
│   │
│   ├── main.tsx                # React 18 entry point
│   ├── index.css               # Global styles
│   └── App.css                 # App-specific styles
│
├── public/                     # Static assets
│   └── robots.txt
│
├── vite.config.ts             # Vite configuration
├── tsconfig.json              # TypeScript configuration
├── tailwind.config.ts         # Tailwind CSS theme
├── package.json               # Dependencies
├── .env.example               # Environment variables template
└── README.md                  # This file
```

## 🏗️ Architecture Highlights

### Modular Feature-Based Structure
Each module (auth, dashboard, roadmap, etc.) is self-contained with its own:
- Pages (page components)
- Components (module-specific UI)
- Services (API calls for that feature)
- Types (TypeScript interfaces)
- Hooks (custom hooks for the feature)

### Centralized API Layer
All API calls go through `services/` with a single `apiClient` that handles:
- Request/response interceptors
- Authentication token management
- Error handling
- Timeout management

### State Management
- **Zustand** for lightweight, modular state: `authStore`, `roadmapStore`, etc.
- **TanStack React Query** for server state (caching, background sync, refetch)
- **React Router** for client-side routing with lazy-loaded pages

### Routing
- Lazy-loaded pages for code splitting
- Protected routes with auth guards
- Centralized route config in `app/router.tsx`

### Styling
- **Tailwind CSS** with dark mode support
- **shadcn/ui** components (Radix UI primitives + Tailwind)
- CSS variables for theme customization

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ (or Bun)
- npm/yarn/pnpm/bun

### Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
# or
bun install

# Create .env file from template
cp .env.example .env
```

### Environment Variables

Create a `.env` file:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_AI_SERVICE_URL=http://localhost:5000
VITE_APP_NAME=PrepIntel
VITE_ENABLE_MOCK_API=true
```

### Development

```bash
# Start dev server (port 8080)
npm run dev

# The app auto-reloads with HMR enabled
```

Visit `http://localhost:8080`

### Build for Production

```bash
# Build optimized bundle
npm run build

# Preview production build
npm run preview
```

### Testing

```bash
# Run tests in watch mode
npm run test:watch

# Run tests once
npm run test
```

### Linting

```bash
# Lint the code
npm run lint
```

## 🔌 API Integration

### Mock API (Development)
Currently, all API calls return mock data with simulated delays. To integrate with a real backend:

1. Update the services in `src/services/` to uncomment the real API calls
2. Replace mock data returns with actual `apiClient.get()`, `apiClient.post()`, etc.
3. Update `VITE_API_BASE_URL` in `.env` to point to your backend

**Example: Replacing Mock Login**

```typescript
// Current (mock)
async login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
  await new Promise(r => setTimeout(r, 500));
  return { success: true, data: { token: '...', user: {...} } };
}

// Real backend
async login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
  return apiClient.post<LoginResponse>('/auth/login', { email, password });
}
```

### Endpoints Structure

The backend should implement these endpoints:

```
POST   /api/auth/login
POST   /api/auth/signup
POST   /api/auth/logout
GET    /api/auth/verify
POST   /api/auth/refresh
POST   /api/auth/password-reset/request
POST   /api/auth/password-reset/confirm
PUT    /api/auth/password

GET    /api/readiness
GET    /api/dashboard/tasks/today
GET    /api/dashboard/weak-topics
GET    /api/dashboard/activity

GET    /api/roadmap/categories
GET    /api/roadmap/topics?category=DSA
PUT    /api/roadmap/topics/:id

GET    /api/practice/problems
GET    /api/practice/problems/:id
POST   /api/practice/problems/:id/submit
GET    /api/practice/problems/:id/hint
PUT    /api/practice/problems/:id/solved

GET    /api/analytics/heatmap
GET    /api/analytics/trajectory
GET    /api/analytics/breakdown

POST   /api/mentor/chat
GET    /api/mentor/history
GET    /api/mentor/recommendations
DELETE /api/mentor/history
```

## 🎨 Styling & Theme

### Tailwind CSS
- All layouts use utility classes
- Dark mode supported via `darkMode: ["class"]`
- Custom colors defined in `tailwind.config.ts`

### shadcn UI Components
- Install new components: `npx shadcn-ui@latest add [component-name]`
- Components are auto-generated and stored in `src/components/ui/`

### Custom Colors
Available color tokens (defined via CSS variables):
- `primary`, `secondary`, `destructive`, `muted`, `accent`
- `mastery-strong`, `mastery-improving`, `mastery-weak`
- `sidebar-*` colors for navigation
- `chart-1` through `chart-5` for data visualization

## 📦 Dependencies

### Core
- **React 18**: UI library
- **React Router v6**: Client routing
- **TypeScript**: Type safety

### State & Data
- **Zustand**: Lightweight state management
- **TanStack React Query**: Server state, caching, background sync

### UI & Styling
- **Tailwind CSS**: Utility-first CSS
- **shadcn/ui**: Accessible component library
- **Radix UI**: Headless component primitives
- **Lucide React**: Icon library

### Utilities
- **clsx**: Conditional classnames
- **tailwind-merge**: Merge Tailwind classes
- **date-fns**: Date utilities
- **react-hook-form**: Form state management
- **zod**: Schema validation (optional)

## ✅ Key Features

### Authentication
- Login/Signup with Zustand state
- Protected routes with auth guards
- Persistent auth via localStorage
- Token management through APIClient

### Dashboard
- Readiness score breakdown
- Daily task tracking
- Weak topics identification
- Activity heatmap (30 days)

### Roadmap
- Structured learning paths (DSA, OS, DBMS, CN, OOPs)
- Topic mastery tracking
- Confidence metrics
- Last practiced timestamps

### Practice Lab
- Problem search and filtering
- Code editor interface
- Hint system
- Solution submission with test feedback

### Analytics
- Topic mastery heatmap
- 30-day performance trajectory
- Strength/weakness breakdown
- Time spent analysis

### AI Mentor
- Real-time chat interface
- Floating chat widget
- Message history
- Personalized recommendations

### Planning
- Weekly task scheduling
- Task completion tracking
- Estimated time allocations

## 🔐 Authentication Flow

1. User enters credentials on `/login`
2. `authService.login()` is called
3. On success, `authStore` saves token and user
4. `apiClient` automatically includes token in headers
5. Protected routes check `useAuthStore().isAuthenticated`
6. Invalid auth redirects to `/login`

## 🧪 Testing

Tests are configured with **Vitest** and can be run:

```bash
npm run test         # Run once
npm run test:watch   # Watch mode
```

Place test files alongside components with `.test.ts(x)` extension.

## 📋 Checklist for Backend Integration

- [ ] Update `VITE_API_BASE_URL` to backend URL
- [ ] Replace mock responses in `services/` with real API calls
- [ ] Implement JWT token refresh logic in `apiClient`
- [ ] Add error boundary components
- [ ] Setup environment-specific configs (.env.development, .env.production)
- [ ] Configure CORS on backend
- [ ] Setup backend-side field validation
- [ ] Implement actual file upload (if needed)
- [ ] Setup WebSocket for real-time mentor (if needed)
- [ ] Add error logging/monitoring (Sentry, LogRocket, etc.)

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY frontend/package.json .
RUN npm install
COPY frontend/src ./src
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

### GitHub Pages / Static Hosting
```bash
# Build static site
npm run build

# Upload `dist/` folder to your hosting service
```

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/my-feature`
2. Follow module-based structure for new features
3. Keep API services isolated in `services/`
4. Use Zustand for local state, React Query for server state
5. Add types to `types/index.ts` for domain models
6. Test before committing

## 📚 Additional Resources

- [Vite Docs](https://vitejs.dev)
- [React 18 Docs](https://react.dev)
- [React Router v6](https://reactrouter.com)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Zustand](https://github.com/pmndrs/zustand)
- [React Query](https://tanstack.com/query)

## 📝 License

MIT

---

**Ready for backend integration!** 🚀
The frontend is completely decoupled from the backend and ready to integrate with Node.js Express, Python FastAPI, or any REST API backend.
