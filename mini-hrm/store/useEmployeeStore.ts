import { create } from 'zustand';
import { userService } from '@/services';
import { Employee } from '@/types';

interface EmployeeState {
  employees: Employee[];
  isLoading: boolean;

  fetchEmployees: () => Promise<void>;
  addEmployee: (
    name: string,
    email: string,
    password: string,
    role: 'employee' | 'teamlead',
    specialization: string
  ) => Promise<void>;
  updateEmployee: (id: string, updatedFields: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  setEmployees: (employees: Employee[]) => void;
}

export const useEmployeeStore = create<EmployeeState>((set) => ({
  employees: [],
  isLoading: false,

  fetchEmployees: async () => {
    set({ isLoading: true });
    try {
      const res = await userService.getEmployees();
      if (res.success && res.data) {
        set({ employees: res.data });
      }
    } catch (e) {
      console.error('[useEmployeeStore] Error fetching employees:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  addEmployee: async (name, email, password, role, specialization) => {
    const res = await userService.addEmployee({ name, email, password, role, specialization });
    if (res.success && res.data) set({ employees: res.data });
  },

  updateEmployee: async (id, updatedFields) => {
    const res = await userService.updateEmployee(id, updatedFields);
    if (res.success && res.data) set({ employees: res.data });
  },

  deleteEmployee: async (id) => {
    const res = await userService.deleteEmployee(id);
    if (res.success && res.data) set({ employees: res.data });
  },

  setEmployees: (employees) => set({ employees }),
}));
