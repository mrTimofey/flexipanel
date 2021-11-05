import AuthProvider, { WrongCredentialsError } from '../provider';
import type { IAuthenticationResult, ICredentials } from '../provider';
import type { IHttpRequest, IHttpResponse } from '../../http/http-client';

interface IHttpBodyKeys {
	accessToken: string;
	refreshToken: string;
	login: string;
	password: string;
	refreshTokenInRequestBody: string;
}

interface IHttpEndpoints {
	authenticate: string;
	refresh: string;
	logout: string;
}

export default class HttpTokenAuthProvider extends AuthProvider {
	protected httpBodyKeys: IHttpBodyKeys = {
		accessToken: import.meta.env.AUTH_ACCESS_TOKEN_KEY || 'token',
		refreshToken: import.meta.env.AUTH_REFRESH_TOKEN_KEY || 'refresh_token',
		login: import.meta.env.AUTH_LOGIN_KEY || 'username',
		password: import.meta.env.AUTH_PASSWORD_KEY || 'password',
		// refreshToken is used by default
		refreshTokenInRequestBody: import.meta.env.AUTH_REFRESH_TOKEN_REQUEST_KEY || '',
	};

	protected httpEndpoints: IHttpEndpoints = {
		authenticate: import.meta.env.AUTH_AUTHENTICATE_ENDPOINT || '/api/auth',
		refresh: import.meta.env.AUTH_REFRESH_ENDPOINT || '/api/auth/refresh',
		logout: import.meta.env.AUTH_LOGOUT_ENDPOINT || '',
	};

	/**
	 * Set object keys for request/response body used as user name, password, access token and remember token.
	 * @param keys key mappings
	 */
	setHttpEndpoints(endpoints: Partial<IHttpEndpoints>): void {
		Object.assign(this.httpEndpoints, endpoints);
	}

	/**
	 * Set object keys for request/response body used as user name, password, access token and remember token.
	 * @param keys key mappings
	 */
	setHttpBodyKeys(keys: Partial<IHttpBodyKeys>): void {
		Object.assign(this.httpBodyKeys, keys);
	}

	private authResponse({ status, body }: IHttpResponse<Record<string, string>>): IAuthenticationResult {
		if (status >= 200 && status < 300) {
			return {
				accessToken: `${body[this.httpBodyKeys.accessToken] || ''}`,
				refreshToken: `${body[this.httpBodyKeys.refreshToken] || ''}`,
			};
		}
		throw new WrongCredentialsError();
	}

	async authenticate(credentials: ICredentials): Promise<IAuthenticationResult> {
		return this.authResponse(
			// TODO customize endpoint
			await this.http.post(this.httpEndpoints.authenticate, {
				[this.httpBodyKeys.login]: credentials.login,
				[this.httpBodyKeys.password]: credentials.password,
			}),
		);
	}

	authorizeRequest(req: IHttpRequest, token: string): void {
		req.headers.Authorization = `Bearer ${token}`;
	}

	isRequestRecoverable({ req, res }: { req: IHttpRequest; res: IHttpResponse<unknown> | null }): boolean {
		return (
			// recover when response is successfully received
			!!res &&
			// recover only after 401 or 403 response
			[401, 403].includes(res.status) &&
			// dont recover POST requests to auth endpoints
			(!Object.values(this.httpEndpoints).includes(req.url) || req.method !== 'POST')
		);
	}

	async recoverAccessToken(refreshToken: string): Promise<IAuthenticationResult> {
		return this.authResponse(
			await this.http.post<Record<string, string>>(this.httpEndpoints.refresh, {
				[this.httpBodyKeys.refreshTokenInRequestBody || this.httpBodyKeys.refreshToken]: refreshToken,
			}),
		);
	}

	async logout(): Promise<void> {
		if (this.httpEndpoints.logout) {
			await this.http.post(this.httpEndpoints.logout);
		}
	}
}
