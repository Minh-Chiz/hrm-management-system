export interface Employee {
  id: string;
  name: string;
  role: 'employee' | 'teamlead';
  email: string;
  avatar: string;
  status: 'Active' | 'Inactive';
  accentColor: string;
  password?: string;
  specialization: string;
  team?: string;
  phone?: string;
}

export interface AddEmployeePayload {
  name: string;
  email: string;
  password: string;
  role: 'employee' | 'teamlead';
  specialization: string;
  phone?: string;
}
