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

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}
