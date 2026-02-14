import type { Task, TopicProgress, ReadinessScore, DailyActivity, Problem, ChatMessage } from '@/types';

// Mock data generators — replace with real API calls to /api/* endpoints

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export const api = {
  auth: {
    login: async (email: string, password: string) => {
      await delay(500);
      return { token: 'mock-jwt', user: { id: '1', email, name: 'Alex Chen', onboarded: true } };
    },
    signup: async (name: string, email: string, password: string) => {
      await delay(500);
      return { token: 'mock-jwt', user: { id: '1', email, name, onboarded: false } };
    },
  },

  dashboard: {
    getReadiness: async (): Promise<ReadinessScore> => {
      await delay(300);
      return { overall: 72, dsa: 78, os: 65, dbms: 70, cn: 60, oops: 82 };
    },
    getTodayTasks: async (): Promise<Task[]> => {
      await delay(300);
      return [
        { id: '1', title: 'Solve 2 Graph problems', type: 'practice', topic: 'Graphs', difficulty: 'medium', estimated_minutes: 45, completed: false, due_date: new Date().toISOString() },
        { id: '2', title: 'Revise Dynamic Programming patterns', type: 'revision', topic: 'DP', difficulty: 'hard', estimated_minutes: 30, completed: false, due_date: new Date().toISOString() },
        { id: '3', title: 'Learn B-Trees in DBMS', type: 'learn', topic: 'DBMS', difficulty: 'medium', estimated_minutes: 25, completed: true, due_date: new Date().toISOString() },
        { id: '4', title: 'Binary Search revision', type: 'revision', topic: 'Binary Search', difficulty: 'easy', estimated_minutes: 20, completed: false, due_date: new Date().toISOString() },
        { id: '5', title: 'Mock Interview: Arrays & Strings', type: 'mock', topic: 'Arrays', difficulty: 'medium', estimated_minutes: 60, completed: false, due_date: new Date().toISOString() },
      ];
    },
    getWeakTopics: async (): Promise<string[]> => {
      await delay(200);
      return ['Dynamic Programming', 'Graph Theory', 'Network Protocols', 'Normalization'];
    },
    getActivity: async (): Promise<DailyActivity[]> => {
      await delay(300);
      const data: DailyActivity[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        data.push({
          date: d.toISOString().split('T')[0],
          problems_solved: Math.floor(Math.random() * 8) + 1,
          hours_studied: +(Math.random() * 4 + 1).toFixed(1),
          topics_covered: Math.floor(Math.random() * 4) + 1,
        });
      }
      return data;
    },
  },

  roadmap: {
    getTopics: async (category: string): Promise<TopicProgress[]> => {
      await delay(300);
      const topics: Record<string, string[]> = {
        DSA: ['Arrays', 'Linked Lists', 'Stacks', 'Queues', 'Trees', 'Graphs', 'Dynamic Programming', 'Binary Search', 'Sorting', 'Hashing', 'Heaps', 'Tries', 'Greedy', 'Backtracking', 'Sliding Window'],
        OS: ['Processes', 'Threads', 'Scheduling', 'Memory Management', 'Virtual Memory', 'File Systems', 'Deadlocks', 'Synchronization'],
        DBMS: ['ER Model', 'Normalization', 'SQL', 'Transactions', 'Indexing', 'B-Trees', 'Concurrency Control', 'Recovery'],
        CN: ['OSI Model', 'TCP/IP', 'HTTP', 'DNS', 'Routing', 'Network Security', 'Sockets', 'Protocols'],
        OOPs: ['Classes', 'Inheritance', 'Polymorphism', 'Abstraction', 'Encapsulation', 'SOLID Principles', 'Design Patterns'],
      };
      const masteryLevels: Array<'strong' | 'improving' | 'weak' | 'not_started'> = ['strong', 'improving', 'weak', 'not_started'];
      return (topics[category] || []).map((name, i) => ({
        id: `${category}-${i}`,
        name,
        category,
        mastery: masteryLevels[i % 4],
        problems_solved: Math.floor(Math.random() * 20),
        total_problems: 20,
        last_practiced: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString(),
        confidence: Math.floor(Math.random() * 100),
      }));
    },
  },

  practice: {
    getProblems: async (topic?: string): Promise<Problem[]> => {
      await delay(300);
      return [
        { id: '1', title: 'Two Sum', difficulty: 'easy', topic: 'Arrays', platform: 'LeetCode', solved: true },
        { id: '2', title: 'Longest Substring Without Repeating', difficulty: 'medium', topic: 'Sliding Window', platform: 'LeetCode', solved: false },
        { id: '3', title: 'Merge K Sorted Lists', difficulty: 'hard', topic: 'Heaps', platform: 'LeetCode', solved: false },
        { id: '4', title: 'Course Schedule', difficulty: 'medium', topic: 'Graphs', platform: 'LeetCode', solved: true },
        { id: '5', title: 'Coin Change', difficulty: 'medium', topic: 'DP', platform: 'LeetCode', solved: false },
        { id: '6', title: 'Valid Parentheses', difficulty: 'easy', topic: 'Stacks', platform: 'LeetCode', solved: true },
      ];
    },
  },

  analytics: {
    getHeatmapData: async () => {
      await delay(300);
      const topics = ['Arrays', 'DP', 'Graphs', 'Trees', 'Sorting', 'Binary Search', 'Stacks', 'Heaps', 'Tries', 'Greedy'];
      return topics.map(t => ({ topic: t, mastery: Math.floor(Math.random() * 100) }));
    },
    getTrajectory: async (): Promise<{ date: string; score: number }[]> => {
      await delay(300);
      const data = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        data.push({ date: d.toISOString().split('T')[0], score: Math.min(100, 40 + Math.floor(i * 1.2 + Math.random() * 10)) });
      }
      return data.map((d, i) => ({ ...d, score: Math.min(100, 45 + i * 1.5 + Math.floor(Math.random() * 5)) }));
    },
  },

  mentor: {
    chat: async (message: string): Promise<ChatMessage> => {
      await delay(800);
      const responses = [
        "Based on your recent practice, I'd recommend focusing on Dynamic Programming patterns. Start with the classic problems: Fibonacci, Climbing Stairs, then move to Knapsack variations.",
        "Your Graph skills are improving! Try solving 2-3 BFS/DFS problems daily. I suggest starting with 'Number of Islands' and 'Clone Graph'.",
        "Great progress on Arrays! Consider moving to more advanced topics like Sliding Window and Two Pointers to strengthen your problem-solving toolkit.",
        "For your upcoming mock interviews, practice explaining your thought process out loud. This helps with the communication aspect that interviewers value.",
      ];
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date().toISOString(),
      };
    },
  },

  planning: {
    getTasks: async (): Promise<Task[]> => {
      await delay(300);
      const tasks: Task[] = [];
      for (let day = 0; day < 7; day++) {
        const d = new Date();
        d.setDate(d.getDate() + day);
        tasks.push(
          { id: `p-${day}-1`, title: `Practice ${['Arrays', 'DP', 'Graphs', 'Trees', 'Sorting', 'Heaps', 'Stacks'][day]}`, type: 'practice', topic: ['Arrays', 'DP', 'Graphs', 'Trees', 'Sorting', 'Heaps', 'Stacks'][day], difficulty: 'medium', estimated_minutes: 45, completed: day < 1, due_date: d.toISOString() },
          { id: `p-${day}-2`, title: `Revise ${['Linked Lists', 'Binary Search', 'Queues', 'Tries', 'Hashing', 'Greedy', 'Backtracking'][day]}`, type: 'revision', topic: ['Linked Lists', 'Binary Search', 'Queues', 'Tries', 'Hashing', 'Greedy', 'Backtracking'][day], difficulty: 'easy', estimated_minutes: 20, completed: false, due_date: d.toISOString() },
        );
      }
      return tasks;
    },
  },
};
