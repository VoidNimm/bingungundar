import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { createTauriStorage } from '@/lib/storage/zustand-storage'

export interface Task {
  id: string;
  title: string;
  subject?: string;
  dueDate: string;
  completed: boolean;
  type: 'Tugas' | 'Lainnya';
  progress?: number;
}

interface TaskState {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'completed' | 'progress'>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  updateTaskProgress: (id: string, progress: number) => void;
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set) => ({
      tasks: [],
      addTask: (task) => set((state) => ({ 
        tasks: [...state.tasks, { ...task, id: crypto.randomUUID(), completed: false, progress: 0 }] 
      })),
      toggleTask: (id) => set((state) => ({
        tasks: state.tasks.map(t => {
          if (t.id === id) {
            const willComplete = !t.completed;
            return { 
              ...t, 
              completed: willComplete, 
              progress: willComplete ? 100 : (t.progress === 100 ? 0 : t.progress) 
            };
          }
          return t;
        })
      })),
      deleteTask: (id) => set((state) => ({
        tasks: state.tasks.filter(t => t.id !== id)
      })),
      updateTaskProgress: (id, progress) => set((state) => ({
        tasks: state.tasks.map(t => {
          if (t.id === id) {
            return { ...t, progress, completed: progress === 100 };
          }
          return t;
        })
      }))
    }),
    { 
      name: 'baak-dashboard-tasks',
      storage: createJSONStorage(() => createTauriStorage('tasks.json'))
    }
  )
)
