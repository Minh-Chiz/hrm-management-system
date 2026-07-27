import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '@/config/api';
import { AddEmployeePayload, ApiResponse, Employee } from '@/types';
import { simulateDelay, fetchWithAuth } from './apiUtils';

const STORAGE_KEY_EMPLOYEES = '@hrm_employees';

export const INITIAL_EMPLOYEES: Employee[] = [
  { id: '1', name: 'Trần Văn A', role: 'employee', email: 'nhanvien@vp.com', avatar: 'TA', status: 'Active', accentColor: '#00e475', specialization: 'Frontend', team: 'Frontend' },
  { id: '2', name: 'Nguyễn Thị B', role: 'employee', email: 'nguyenthib@vp.com', avatar: 'NB', status: 'Active', accentColor: '#849396', specialization: 'Mobile', team: 'Frontend' },
  { id: '3', name: 'Lê Hoàng Dương', role: 'teamlead', email: 'leader@vp.com', avatar: 'HD', status: 'Active', accentColor: '#00daf3', specialization: 'Frontend', team: 'Frontend' },
  { id: '4', name: 'Phạm Minh D', role: 'employee', email: 'phamminhd@vp.com', avatar: 'PD', status: 'Active', accentColor: '#00e475', specialization: 'Backend', team: 'Backend' },
  { id: '5', name: 'Hoàng Thu E', role: 'employee', email: 'hoangthu@vp.com', avatar: 'TE', status: 'Inactive', accentColor: '#849396', specialization: 'Tester', team: 'Backend' },
  { id: '6', name: 'Vũ Lan F', role: 'teamlead', email: 'vulan@vp.com', avatar: 'VF', status: 'Active', accentColor: '#00daf3', specialization: 'Backend', team: 'Backend' },
  { id: '7', name: 'Đỗ Anh G', role: 'employee', email: 'doanhg@vp.com', avatar: 'AG', status: 'Active', accentColor: '#ff80ab', specialization: 'UI/UX Design', team: 'Design' },
  { id: '8', name: 'Ngô Quốc H', role: 'employee', email: 'ngoquoch@vp.com', avatar: 'QH', status: 'Active', accentColor: '#00e5ff', specialization: 'Mobile', team: 'Frontend' },
  { id: '9', name: 'Lý Mỹ I', role: 'employee', email: 'lymyi@vp.com', avatar: 'MI', status: 'Inactive', accentColor: '#849396', specialization: 'UI/UX Design', team: 'Design' },
  { id: '10', name: 'Bùi Tiến J', role: 'teamlead', email: 'buitienj@vp.com', avatar: 'TJ', status: 'Active', accentColor: '#ffeb3b', specialization: 'UI/UX Design', team: 'Design' },
  { id: '11', name: 'Trần Thị K', role: 'employee', email: 'tranthik@vp.com', avatar: 'TK', status: 'Active', accentColor: '#00e475', specialization: 'Frontend', team: 'Frontend' },
  { id: '12', name: 'Nguyễn Văn L', role: 'employee', email: 'nguyenvanl@vp.com', avatar: 'VL', status: 'Active', accentColor: '#849396', specialization: 'Frontend', team: 'Frontend' },
  { id: '13', name: 'Lê Văn M', role: 'employee', email: 'levanm@vp.com', avatar: 'VM', status: 'Active', accentColor: '#00e475', specialization: 'Backend', team: 'Backend' },
  { id: '14', name: 'Phan Thanh N', role: 'employee', email: 'phanthanhn@vp.com', avatar: 'TN', status: 'Active', accentColor: '#849396', specialization: 'Backend', team: 'Backend' },
  { id: '15', name: 'Đặng Văn O', role: 'teamlead', email: 'dangvano@vp.com', avatar: 'VO', status: 'Active', accentColor: '#00daf3', specialization: 'Mobile', team: 'Mobile' },
  { id: '16', name: 'Trịnh Thị P', role: 'employee', email: 'trinhthip@vp.com', avatar: 'TP', status: 'Active', accentColor: '#849396', specialization: 'Mobile', team: 'Mobile' },
  { id: '17', name: 'Lâm Văn Q', role: 'teamlead', email: 'lamvanq@vp.com', avatar: 'VQ', status: 'Active', accentColor: '#00daf3', specialization: 'Tester', team: 'QA' },
  { id: '18', name: 'Phùng Thị R', role: 'employee', email: 'phungthir@vp.com', avatar: 'TR', status: 'Active', accentColor: '#849396', specialization: 'Tester', team: 'QA' },
  { id: '19', name: 'Đỗ Văn S', role: 'employee', email: 'dovans@vp.com', avatar: 'VS', status: 'Active', accentColor: '#00e475', specialization: 'Tester', team: 'QA' },
];

const mapBackendUserToEmployee = (user: any): Employee => {
  const initials = (user.name || '')
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((w: string) => w[0].toUpperCase())
    .join('');

  return {
    id: String(user.id),
    name: user.name,
    role: user.role,
    email: user.email,
    avatar: user.avatar || initials || '??',
    status: user.status || 'Active',
    accentColor: user.accentColor || '#00e475',
    specialization: user.specialization || '',
    team: user.team || '',
    phone: user.phone || '',
  };
};

export const userService = {
  /**
   * Fetch all employees
   */
  async getEmployees(): Promise<ApiResponse<Employee[]>> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await simulateDelay(300);
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY_EMPLOYEES);
        let data: Employee[] = stored ? (JSON.parse(stored) as Employee[]) : INITIAL_EMPLOYEES;

        // Auto-migrate employee id '3' to Lê Hoàng Dương if outdated in storage
        let needsSave = false;
        data = data.map((e) => {
          if (e.id === '3' && e.name !== 'Lê Hoàng Dương') {
            needsSave = true;
            return { ...e, name: 'Lê Hoàng Dương', role: 'teamlead', accentColor: '#00daf3' };
          }
          return e;
        });

        if (needsSave) {
          await AsyncStorage.setItem(STORAGE_KEY_EMPLOYEES, JSON.stringify(data));
        }

        return { success: true, data };
      } catch (e) {
        return { success: true, data: INITIAL_EMPLOYEES };
      }
    } else {
      const res = await fetchWithAuth<any[]>('/users');
      if (res.success && Array.isArray(res.data)) {
        const employees = res.data.map(mapBackendUserToEmployee);
        return { success: true, data: employees };
      }
      return { success: false, data: [], message: res.message };
    }
  },

  /**
   * Add a new employee
   */
  async addEmployee(payload: AddEmployeePayload): Promise<ApiResponse<Employee[]>> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await simulateDelay(300);
      const res = await this.getEmployees();
      const employees = res.data || INITIAL_EMPLOYEES;

      const initials = payload.name
        .trim()
        .split(' ')
        .filter(Boolean)
        .slice(-2)
        .map((w) => w[0].toUpperCase())
        .join('');

      const team = (payload.specialization === 'Frontend' || payload.specialization === 'Mobile') ? 'Frontend' : 'Backend';

      const newEmp: Employee = {
        id: String(Date.now()),
        name: payload.name,
        role: payload.role,
        email: payload.email,
        avatar: initials || '?',
        status: 'Active',
        accentColor: payload.role === 'teamlead' ? '#00daf3' : '#00e475',
        specialization: payload.specialization,
        password: payload.password,
        team,
      };

      const updated = [...employees, newEmp];
      await AsyncStorage.setItem(STORAGE_KEY_EMPLOYEES, JSON.stringify(updated));
      return { success: true, data: updated, message: 'Thêm nhân viên thành công' };
    } else {
      const team = (payload.specialization === 'Frontend' || payload.specialization === 'Mobile') ? 'Frontend' : 'Backend';
      const createRes = await fetchWithAuth<any>('/users', {
        method: 'POST',
        body: JSON.stringify({
          name: payload.name,
          email: payload.email,
          password: payload.password,
          role: payload.role,
          specialization: payload.specialization,
          team,
        }),
      });

      if (createRes.success) {
        return await this.getEmployees();
      }

      return { success: false, message: createRes.message };
    }
  },

  /**
   * Update employee details
   */
  async updateEmployee(id: string, updatedFields: Partial<Employee>): Promise<ApiResponse<Employee[]>> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await simulateDelay(300);
      const res = await this.getEmployees();
      const employees = res.data || INITIAL_EMPLOYEES;

      let fields = { ...updatedFields };
      if (fields.specialization) {
        fields.team = (fields.specialization === 'Frontend' || fields.specialization === 'Mobile') ? 'Frontend' : 'Backend';
      }

      const updated = employees.map((emp) =>
        emp.id === id ? { ...emp, ...fields } : emp
      );

      await AsyncStorage.setItem(STORAGE_KEY_EMPLOYEES, JSON.stringify(updated));
      return { success: true, data: updated, message: 'Cập nhật thành công' };
    } else {
      const updateRes = await fetchWithAuth<any>(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedFields),
      });

      if (updateRes.success) {
        return await this.getEmployees();
      }

      return { success: false, message: updateRes.message };
    }
  },

  /**
   * Delete employee by ID
   */
  async deleteEmployee(id: string): Promise<ApiResponse<Employee[]>> {
    if (API_CONFIG.USE_MOCK_DATA) {
      await simulateDelay(300);
      const res = await this.getEmployees();
      const employees = res.data || INITIAL_EMPLOYEES;
      const updated = employees.filter((emp) => emp.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY_EMPLOYEES, JSON.stringify(updated));
      return { success: true, data: updated, message: 'Đã xóa nhân viên' };
    } else {
      const delRes = await fetchWithAuth<any>(`/users/${id}`, { method: 'DELETE' });
      if (delRes.success) {
        return await this.getEmployees();
      }
      return { success: false, message: delRes.message };
    }
  },
};
