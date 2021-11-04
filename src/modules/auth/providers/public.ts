import AuthProvider from '../provider';
import type { IAuthenticationResult } from '../provider';

export default class PublicAuthProvider extends AuthProvider {
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	authorizeHttpRequests(): void {}

	authenticate(): Promise<IAuthenticationResult> {
		return Promise.resolve({
			accessToken: 'access',
			refreshToken: 'refresh',
		});
	}

	refreshAccessToken(): Promise<IAuthenticationResult> {
		return Promise.resolve({
			accessToken: 'access',
			refreshToken: 'refresh',
		});
	}

	logout(): Promise<void> {
		return Promise.resolve();
	}
}
