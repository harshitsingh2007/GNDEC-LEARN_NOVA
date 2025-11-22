import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AdminNotificationPrefs = {
  newSubmissions: boolean;
  studentMessages: boolean;
  courseUpdates: boolean;
  // Local counters to detect new events since last check
  lastSubmissionCountByAssignment: Record<string, number>;
};

type Actions = {
  setNewSubmissions: (v: boolean) => void;
  setStudentMessages: (v: boolean) => void;
  setCourseUpdates: (v: boolean) => void;
  setAssignmentSubmissionCount: (assignmentId: string, count: number) => void;
  resetCounts: () => void;
};

const defaultState: AdminNotificationPrefs = {
  newSubmissions: true,
  studentMessages: true,
  courseUpdates: false,
  lastSubmissionCountByAssignment: {},
};

export const useAdminNotificationPrefs = create<AdminNotificationPrefs & Actions>()(
  persist(
    (set) => ({
      ...defaultState,
      setNewSubmissions: (v: boolean) => set({ newSubmissions: v }),
      setStudentMessages: (v: boolean) => set({ studentMessages: v }),
      setCourseUpdates: (v: boolean) => set({ courseUpdates: v }),
      setAssignmentSubmissionCount: (assignmentId: string, count: number) =>
        set((state) => ({
          lastSubmissionCountByAssignment: {
            ...state.lastSubmissionCountByAssignment,
            [assignmentId]: count,
          },
        })),
      resetCounts: () => set({ lastSubmissionCountByAssignment: {} }),
    }),
    {
      name: 'admin-notification-prefs',
      version: 1,
      partialize: (state) => ({
        newSubmissions: state.newSubmissions,
        studentMessages: state.studentMessages,
        courseUpdates: state.courseUpdates,
        lastSubmissionCountByAssignment: state.lastSubmissionCountByAssignment,
      }),
    }
  )
);


