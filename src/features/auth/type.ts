export interface LoginRequest {
  email: string;
  password: string;
}

export interface GoogleLoginRequest {
  idToken: string;
}

export interface RegisterRequest {
  userName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface User {
  uid: string;
  userName: string;
  email: string;
  role: "CUSTOMER" | "STAFF" | "ADMIN";
  avatarUrl?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

export interface RegisterResponse {
  message: string;
}

export interface MessageResponse {
  message: string;
}
