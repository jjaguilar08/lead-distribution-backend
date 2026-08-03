/** Request body for POST /api/auth/login. */
export interface LoginRequestDto {
  email: string;
  password: string;
}

/** Publicly safe user shape returned to clients. */
export interface AuthenticatedUserDto {
  id: number;
  email: string;
}

/** Result of a successful login: the JWT to set as a cookie plus the user. */
export interface LoginResultDto {
  token: string;
  user: AuthenticatedUserDto;
}
