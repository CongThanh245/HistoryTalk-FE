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
  newPassword: string;
  confirmPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface User {
  uid: string;
  userName: string;
  email: string;
  role: "CUSTOMER" | "CONTENT_ADMIN" | "SYSTEM_ADMIN" | "SCHOOL_ADMIN" | "TEACHER" | "SCHOOL_STUDENT";
  avatarUrl?: string;
  fullName?: string | null;
  tierId?: string | null;
  tierTitle?: string | null;
  token?: number;
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
  isNewUser?: boolean;
}

export interface RegisterResponse {
  emailVerified?: boolean;
  message: string;
}

export interface MessageResponse {
  message: string;
}
