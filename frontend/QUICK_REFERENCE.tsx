/**
 * FRONTEND QUICK REFERENCE - Common Patterns & Usage Examples
 * 
 * Copy-paste ready code snippets for common frontend patterns
 * used throughout the new component system.
 */

// ==============================================================================
// API INTEGRATION EXAMPLES
// ==============================================================================

/**
 * Example 1: Fetching Data with Loading & Error States
 */
import { useState, useEffect } from 'react';
import { apiClient } from '@/services/apiClient';

export function DataFetchingExample() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get('/practice/topics/DSA');
        setData(response);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      {loading && <SkeletonLoader />}
      {error && <div className="text-red-600">Error: {error}</div>}
      {data && <div>Data: {JSON.stringify(data)}</div>}
    </div>
  );
}

/**
 * Example 2: Posting Data (Form Submission)
 */
export async function submitPracticeCode(
  problemId: string,
  code: string,
  language: string
) {
  try {
    const result = await apiClient.post('/practice/submit', {
      problemId,
      code,
      language,
      timestamp: new Date().toISOString(),
    });
    return result;
  } catch (error) {
    console.error('Submission error:', error);
    throw error;
  }
}

/**
 * Example 3: Paginated Queries
 */
export async function getProblemsList(
  difficulty: 'easy' | 'medium' | 'hard',
  page: number = 1,
  pageSize: number = 20
) {
  return apiClient.get('/practice/problems', {
    params: {
      difficulty,
      page,
      pageSize,
    },
  });
}

/**
 * Example 4: File Upload
 */
export async function uploadProfilePicture(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  return apiClient.post('/user/profile/picture', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

// ==============================================================================
// DARK MODE INTEGRATION EXAMPLES
// ==============================================================================

/**
 * Example 5: Using Theme in Component
 */
import { useThemeStore } from '@/store/themeStore';

export function ThemeAwareComponent() {
  const { isDark } = useThemeStore();

  return (
    <div
      className={`p-6 rounded-lg transition-colors ${
        isDark
          ? 'bg-slate-800 text-white border border-slate-700'
          : 'bg-white text-slate-900 border border-slate-200'
      }`}
    >
      <h2 className={isDark ? 'text-white' : 'text-slate-900'}>Content</h2>
    </div>
  );
}

/**
 * Example 6: Dynamic Color Mapping
 */
function getSeverityColor(
  severity: 'low' | 'medium' | 'high' | 'critical',
  isDark: boolean
) {
  const colorMap = {
    low: isDark ? 'text-green-400' : 'text-green-600',
    medium: isDark ? 'text-yellow-400' : 'text-yellow-600',
    high: isDark ? 'text-orange-400' : 'text-orange-600',
    critical: isDark ? 'text-red-400' : 'text-red-600',
  };
  return colorMap[severity];
}

/**
 * Example 7: Theme Toggle Button
 */
export function ThemeToggle() {
  const { isDark, toggleTheme } = useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
    >
      {isDark ? '☀️ Light' : '🌙 Dark'}
    </button>
  );
}

// ==============================================================================
// STATE MANAGEMENT EXAMPLES
// ==============================================================================

/**
 * Example 8: Creating a Custom Zustand Store
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PracticeState {
  selectedTopic: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  setSelectedTopic: (topic: string) => void;
  setDifficulty: (difficulty: 'easy' | 'medium' | 'hard') => void;
}

export const usePracticeStore = create<PracticeState>()(
  persist(
    (set) => ({
      selectedTopic: null,
      difficulty: 'medium',
      setSelectedTopic: (topic) => set({ selectedTopic: topic }),
      setDifficulty: (difficulty) => set({ difficulty }),
    }),
    {
      name: 'practice-store',
    }
  )
);

/**
 * Example 9: Using Custom Store in Component
 */
export function PracticeSelector() {
  const { selectedTopic, difficulty, setSelectedTopic, setDifficulty } =
    usePracticeStore();

  return (
    <div>
      <select
        value={selectedTopic || ''}
        onChange={(e) => setSelectedTopic(e.target.value)}
      >
        <option value="">Select Topic</option>
        <option value="arrays">Arrays</option>
        <option value="graphs">Graphs</option>
      </select>

      <select
        value={difficulty}
        onChange={(e) =>
          setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')
        }
      >
        <option value="easy">Easy</option>
        <option value="medium">Medium</option>
        <option value="hard">Hard</option>
      </select>
    </div>
  );
}

// ==============================================================================
// FORM HANDLING EXAMPLES
// ==============================================================================

/**
 * Example 10: Form with Validation
 */
interface ConnectPlatformForm {
  platform: string;
  username: string;
}

export function ConnectPlatformForm() {
  const [form, setForm] = useState<ConnectPlatformForm>({
    platform: '',
    username: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.platform) newErrors.platform = 'Platform required';
    if (!form.username) newErrors.username = 'Username required';
    if (form.username.length < 3)
      newErrors.username = 'Username must be at least 3 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await apiClient.post(`/integrations/${form.platform}/connect`, {
        username: form.username,
      });
      alert('Connected successfully!');
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={form.platform}
        onChange={(e) => setForm({ ...form, platform: e.target.value })}
        placeholder="Platform"
      />
      {errors.platform && <span className="text-red-600">{errors.platform}</span>}

      <input
        value={form.username}
        onChange={(e) => setForm({ ...form, username: e.target.value })}
        placeholder="Username"
      />
      {errors.username && <span className="text-red-600">{errors.username}</span>}

      <button type="submit" disabled={submitting}>
        {submitting ? 'Connecting...' : 'Connect'}
      </button>

      {errors.submit && <div className="text-red-600">{errors.submit}</div>}
    </form>
  );
}

// ==============================================================================
// RESPONSIVE DESIGN EXAMPLES
// ==============================================================================

/**
 * Example 11: Responsive Grid Layout
 */
export function ResponsiveGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* 1 column on mobile, 2 on tablet, 3 on desktop */}
      <div>Card 1</div>
      <div>Card 2</div>
      <div>Card 3</div>
    </div>
  );
}

/**
 * Example 12: Hide/Show on Different Screens
 */
export function ResponsiveVisibility() {
  return (
    <>
      {/* Only visible on mobile */}
      <div className="md:hidden">Mobile Navigation</div>

      {/* Hidden on mobile, visible on tablet and up */}
      <div className="hidden md:block">Desktop Navigation</div>

      {/* Only visible on desktop */}
      <div className="hidden lg:block">Large Desktop Content</div>
    </>
  );
}

// ==============================================================================
// LOADING & SKELETON STATES
// ==============================================================================

/**
 * Example 13: Skeleton Loader Pattern
 */
export function SkeletonCard() {
  return (
    <div className="bg-slate-800 p-4 rounded-lg animate-pulse">
      <div className="h-4 bg-slate-700 rounded w-3/4 mb-4"></div>
      <div className="h-4 bg-slate-700 rounded w-1/2 mb-4"></div>
      <div className="h-4 bg-slate-700 rounded w-5/6"></div>
    </div>
  );
}

/**
 * Example 14: Conditional Rendering with Skeleton
 */
export function CardWithSkeleton({ data, loading }: any) {
  return loading ? (
    <SkeletonCard />
  ) : (
    <div className="bg-white p-4 rounded-lg">
      <h3>{data.title}</h3>
      <p>{data.description}</p>
    </div>
  );
}

// ==============================================================================
// ERROR HANDLING EXAMPLES
// ==============================================================================

/**
 * Example 15: Error Boundary (Wrap around components)
 */
import React from 'react';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Example 16: Using Error Boundary
 */
export function App() {
  return (
    <ErrorBoundary>
      <MyComponent />
    </ErrorBoundary>
  );
}

// ==============================================================================
// FILTERING & SORTING EXAMPLES
// ==============================================================================

/**
 * Example 17: Filter List by Type
 */
export function FilteredList({ items, filterType }: any) {
  const filtered = items.filter((item) => {
    if (filterType === 'completed') return item.completed;
    if (filterType === 'pending') return !item.completed;
    return true;
  });

  return (
    <ul>
      {filtered.map((item) => (
        <li key={item.id}>{item.title}</li>
      ))}
    </ul>
  );
}

/**
 * Example 18: Sort by Multiple Fields
 */
export function SortedList({ items, sortBy, sortOrder }: any) {
  const sorted = [...items].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];

    if (typeof aVal === 'string') {
      return sortOrder === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }

    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
  });

  return (
    <ul>
      {sorted.map((item) => (
        <li key={item.id}>{item.title}</li>
      ))}
    </ul>
  );
}

// ==============================================================================
// UTILITY FUNCTIONS
// ==============================================================================

/**
 * Example 19: Format Timestamp
 */
export function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minutes ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} days ago`;

  return date.toLocaleDateString();
}

/**
 * Example 20: Calculate Score Color
 */
export function getScoreColor(score: number, isDark: boolean): string {
  if (score >= 80) return isDark ? 'text-green-400' : 'text-green-600';
  if (score >= 60) return isDark ? 'text-blue-400' : 'text-blue-600';
  if (score >= 40) return isDark ? 'text-yellow-400' : 'text-yellow-600';
  return isDark ? 'text-red-400' : 'text-red-600';
}

// ==============================================================================
// PERFORMANCE OPTIMIZATION EXAMPLES
// ==============================================================================

/**
 * Example 21: Memoized Component
 */
import { memo } from 'react';

const ExpensiveComponent = memo(function ExpensiveComponent({ data }: any) {
  // This component only re-renders when `data` prop changes
  return <div>{data.title}</div>;
});

/**
 * Example 22: useMemo for Expensive Calculations
 */
import { useMemo } from 'react';

export function ListWithCalculation({ items }: any) {
  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.value, 0),
    [items]
  );

  return <div>Total: {total}</div>;
}

/**
 * Example 23: useCallback for Event Handlers
 */
import { useCallback } from 'react';

export function ListWithCallback({ items, onItemClick }: any) {
  const handleClick = useCallback(
    (id: string) => {
      onItemClick(id);
    },
    [onItemClick]
  );

  return (
    <ul>
      {items.map((item) => (
        <li key={item.id} onClick={() => handleClick(item.id)}>
          {item.title}
        </li>
      ))}
    </ul>
  );
}

// ==============================================================================
// TESTING EXAMPLES
// ==============================================================================

/**
 * Example 24: Testing API Call
 */
import { vi } from 'vitest';

describe('ComponentWithAPI', () => {
  it('should fetch and display data', async () => {
    // Mock the API
    vi.mocked(apiClient.get).mockResolvedValue({
      data: [{ id: 1, title: 'Test' }],
    });

    // Render and test
    const { getByText } = render(<DataFetchingExample />);
    expect(getByText('Test')).toBeInTheDocument();
  });
});

/**
 * Example 25: Testing Dark Mode
 */
describe('ThemeAwareComponent', () => {
  it('should apply dark styles when theme is dark', () => {
    const store = useThemeStore.getState();
    store.setTheme('dark');

    const { container } = render(<ThemeAwareComponent />);
    expect(container.querySelector('div')).toHaveClass('bg-slate-800');
  });
});

export {};
