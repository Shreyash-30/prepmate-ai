# PrepIntel - Technical Interview Preparation Platform

A modern, scalable React + TypeScript + Tailwind CSS frontend for PrepIntel, a comprehensive technical interview preparation platform.

## 🚀 Quick Start

```bash
cd frontend
npm install
npm run dev
```

The application will start on `http://localhost:8080`

## 📁 Project Structure

The project is organized with a modular, feature-based architecture:

```
frontend/
├── src/
│   ├── app/                    # Application root
│   │   ├── App.tsx             # Root component with providers
│   │   ├── router.tsx          # Centralized lazy-loaded routes
│   │   └── providers.tsx       # Global providers
│   │
│   ├── modules/                # Feature modules (domain-driven)
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── roadmap/
│   │   ├── practice/
│   │   ├── mock-interview/
│   │   ├── analytics/
│   │   ├── mentor/
│   │   ├── planning/
│   │   └── settings/
│   │
│   ├── layouts/                # Reusable layouts
│   ├── components/             # UI components (45+ shadcn)
│   ├── services/               # API service layer
│   ├── store/                  # Zustand state management
│   ├── hooks/                  # Custom React hooks
│   ├── utils/                  # Global utilities
│   └── types/                  # TypeScript definitions
```

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests
- `npm run lint` - Run ESLint

## 🎨 Technology Stack

- React 18 with TypeScript
- Vite for fast development
- Tailwind CSS for styling
- shadcn/ui components
- React Router v6
- Zustand for state management
- React Query for server state
- React Hook Form for validation

## 🔌 API Integration

API services are in `src/services/`. Each service has template comments for switching from mock to real API calls.

Create `.env` based on `.env.example`:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_AI_SERVICE_URL=http://localhost:5000
VITE_ENABLE_MOCK_API=true
```

## 📦 Build for Production

```bash
npm run build
```

Upload the `dist/` folder to your hosting service.

## 📚 Documentation

- [FILE_INVENTORY.md](./FILE_INVENTORY.md) - Complete file reference
- [REFACTORING_GUIDE.md](./REFACTORING_GUIDE.md) - Architecture & patterns
- [REFACTORING_COMPLETE.md](./REFACTORING_COMPLETE.md) - Completion summary

## 📝 Features

- ✅ Modular feature-based architecture
- ✅ Type-safe with TypeScript
- ✅ Lazy-loaded routes
- ✅ Dark mode support
- ✅ Responsive design
- ✅ Mock API ready for integration
- ✅ JWT authentication
- ✅ State persistence with localStorage

## 🚀 Deployment

1. Build: `npm run build`
2. Upload `dist/` to hosting
3. Configure environment variables
4. Update API URLs in `.env`

---

**Status**: Production-Ready ✅
