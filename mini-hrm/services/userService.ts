import { AddEmployeePayload, ApiResponse, Employee } from '@/types';
import { employeeService, INITIAL_EMPLOYEES, mapBackendUserToEmployee } from './employeeService';

export { INITIAL_EMPLOYEES, mapBackendUserToEmployee };

export const userService = {
  getEmployees(): Promise<ApiResponse<Employee[]>> {
    return employeeService.getEmployees();
  },

  addEmployee(payload: AddEmployeePayload): Promise<ApiResponse<Employee[]>> {
    return employeeService.addEmployee(payload);
  },

  updateEmployee(id: string, updatedFields: Partial<Employee>): Promise<ApiResponse<Employee[]>> {
    return employeeService.updateEmployee(id, updatedFields);
  },

  deleteEmployee(id: string): Promise<ApiResponse<Employee[]>> {
    return employeeService.deleteEmployee(id);
  },
};
