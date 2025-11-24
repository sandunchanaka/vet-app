export interface UserType {
  user_type_id: number;
  user_type_name: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  phone_number?: string;
  password?: string;
  user_type: number;
  remember_token?: string;
  created_date: string;
  created_user?: number;
  updated_date: string;
  updated_user?: number;
  is_active: boolean;
  user_type_name?: string; // For joined queries
}

export interface UserRegistration {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  business_name?: string;
  website?: string;
  password: string;
  confirm_password: string;
  user_type?: number;
}

export interface UserLogin {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
}