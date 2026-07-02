export interface LoginValues {
  email: string;
  password: string;
}

export interface LoginResponse {
  session: string;
}

export interface LogoutResponse {
  success: boolean;
}

export interface RegisterValues extends LoginValues {
  name: string;
}

export interface RegisterResponse {
  id: string;
  email: string;
  name: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}
