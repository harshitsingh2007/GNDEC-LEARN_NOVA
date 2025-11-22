import { create } from 'zustand';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  avatar?: string;
  xp: number;
  level: number;
  streak: number;
  rank: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  progress: number;
  thumbnail?: string;
  instructor?: string;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  courseId: string;
  duration: number;
  completed: boolean;
  content?: string;
  videoUrl?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  category: string;
}

export interface Quiz {
  id: string;
  title: string;
  topic: string;
  questions: number;
  timeLimit?: number;
  xpReward: number;
}

interface AppState {
  user: User | null;
  courses: Course[];
  tasks: Task[];
  quizzes: Quiz[];
  setUser: (user: User | null) => void;
  addTask: (task: Task) => void;
  toggleTaskComplete: (taskId: string) => void;
  updateUserXP: (xp: number) => void;
  updateStreak: (streak: number) => void;
}

// Mock data
const mockUser: User = {
  id: '1',
  name: 'Alex Johnson',
  email: 'alex@learnnova.com',
  role: 'student',
  xp: 2450,
  level: 12,
  streak: 7,
  rank: 'Gold',
};

const mockCourses: Course[] = [
  {
    id: '1',
    title: 'Advanced Machine Learning',
    description: 'Master deep learning and neural networks',
    category: 'AI & ML',
    progress: 68,
    instructor: 'Dr. Sarah Chen',
    lessons: [],
  },
  {
    id: '2',
    title: 'Web Development Masterclass',
    description: 'Full-stack development with React and Node.js',
    category: 'Development',
    progress: 45,
    instructor: 'John Smith',
    lessons: [],
  },
  {
    id: '3',
    title: 'Data Structures & Algorithms',
    description: 'Ace your technical interviews',
    category: 'Computer Science',
    progress: 82,
    instructor: 'Prof. Michael Brown',
    lessons: [],
  },
];

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Complete ML Assignment 4',
    description: 'Neural networks implementation',
    dueDate: new Date('2025-11-15'),
    completed: false,
    priority: 'high',
    category: 'AI & ML',
  },
  {
    id: '2',
    title: 'Review React Hooks',
    description: 'Prepare for quiz on useState and useEffect',
    dueDate: new Date('2025-11-12'),
    completed: false,
    priority: 'medium',
    category: 'Development',
  },
];

const mockQuizzes: Quiz[] = [
  {
    id: '1',
    title: 'Machine Learning Fundamentals',
    topic: 'AI & ML',
    questions: 20,
    timeLimit: 30,
    xpReward: 150,
  },
  {
    id: '2',
    title: 'React Components Quiz',
    topic: 'Development',
    questions: 15,
    timeLimit: 20,
    xpReward: 100,
  },
];

export const useStore = create<AppState>((set) => ({
  user: mockUser,
  courses: mockCourses,
  tasks: mockTasks,
  quizzes: mockQuizzes,
  setUser: (user) => set({ user }),
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  toggleTaskComplete: (taskId) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      ),
    })),
  updateUserXP: (xp) =>
    set((state) => ({
      user: state.user ? { ...state.user, xp: state.user.xp + xp } : null,
    })),
  updateStreak: (streak) =>
    set((state) => ({
      user: state.user ? { ...state.user, streak } : null,
    })),
}));
