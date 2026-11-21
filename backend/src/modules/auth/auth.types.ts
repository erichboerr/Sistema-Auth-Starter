export interface AuthTokens {
  accessToken: string;
}

export interface AccessTokenPayload {
  sub: string;
  sid: string;
  role: string;
  type: "access";
}

export interface LoginInput {
  email: string;
  password: string;
  mfaCode?: string;
  recoveryCode?: string;
}
