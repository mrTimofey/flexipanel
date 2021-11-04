/* eslint-disable max-classes-per-file */
export interface ICredentials {
	login: string;
	password: string;
}

export interface IAuthenticationResult {
	accessToken: string;
	refreshToken: string;
}

export default abstract class AuthProvider {
	abstract authenticate(credentials: ICredentials): Promise<IAuthenticationResult>;
	abstract authorizeHttpRequests(token: string | null, refreshToken?: string, onRefresh?: (tokens: IAuthenticationResult) => void): void;
	abstract refreshAccessToken(refreshToken: string): Promise<IAuthenticationResult>;
	abstract logout(): Promise<void>;
}

export class WrongCredentialsError extends Error {}
