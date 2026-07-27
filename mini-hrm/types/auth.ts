export type UserRole = 'employee' | 'teamlead' | 'admin';

export interface AuthUser {
  id?: string;
  username: string;
  name: string;
  role: UserRole;
  position?: string;
  companyCode: string;
  specialization: string;
  email?: string;
  phone?: string;
  team?: string;
  avatar?: string;
}

export interface LoginPayload {
  companyCode: string;
  username: string;
  password: string;
}
