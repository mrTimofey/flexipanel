import { inject } from 'mini-ioc';
import AuthProvider, { WrongCredentialsError } from '../provider';
import type { IAuthenticationResult, ICredentials } from '../provider';
import type { ErrorHandler, IHttpResponse, RequestInterceptor } from '../../http/http-client';
import HttpClient from '../../http/http-client';

interface IHttpBodyKeys {
	accessToken: string;
	refreshToken: string;
	login: string;
	password: string;
	refreshTokenInRequestBody: string;
}

export default class HttpTokenAuthProvider extends AuthProvider {
	private requestInterceptor: RequestInterceptor | null = null;
	private refreshErrorHandler: ErrorHandler | null = null;

	protected static httpBodyKeys: IHttpBodyKeys = {
		accessToken: 'token',
		refreshToken: 'refresh_token',
		login: 'username',
		password: 'password',
		// refreshToken is used by default
		refreshTokenInRequestBody: '',
	};

	/**
	 * Set object keys for request/response body used as user name, password, access token and remember token.
	 * @param keys key mappings
	 */
	static setHttpBodyKeys(keys: Partial<IHttpBodyKeys>): void {
		Object.assign(HttpTokenAuthProvider.httpBodyKeys, keys);
	}

	constructor(protected http = inject(HttpClient)) {
		super();
	}

	private authResponse({ status, body }: IHttpResponse<Record<string, string>>): IAuthenticationResult {
		if (status >= 200 && status < 300) {
			return {
				accessToken: `${body[HttpTokenAuthProvider.httpBodyKeys.accessToken] || ''}`,
				refreshToken: `${body[HttpTokenAuthProvider.httpBodyKeys.refreshToken] || ''}`,
			};
		}
		throw new WrongCredentialsError();
	}

	async authenticate(credentials: ICredentials): Promise<IAuthenticationResult> {
		return this.authResponse(
			// TODO customize endpoint
			await this.http.post('/api/identity/login', {
				[HttpTokenAuthProvider.httpBodyKeys.login]: credentials.login,
				[HttpTokenAuthProvider.httpBodyKeys.password]: credentials.password,
			}),
		);
	}

	async refreshAccessToken(refreshToken: string): Promise<IAuthenticationResult> {
		return this.authResponse(
			await this.http.post('/api/identity/token/refresh', {
				[HttpTokenAuthProvider.httpBodyKeys.refreshTokenInRequestBody || HttpTokenAuthProvider.httpBodyKeys.refreshToken]: refreshToken,
			}),
		);
	}

	// TODO refactor
	authorizeHttpRequests(token: string | null, refreshToken?: string, onRefresh?: (tokens: IAuthenticationResult) => void): void {
		if (this.requestInterceptor) {
			this.http.removeRequestInterceptor(this.requestInterceptor);
			this.requestInterceptor = null;
		}
		if (!token) {
			return;
		}
		this.requestInterceptor = (req) => {
			req.headers.Authorization = `Bearer ${token}`;
		};
		this.http.addRequestInterceptor(this.requestInterceptor);

		if (this.refreshErrorHandler) {
			this.http.removeErrorHandler(this.refreshErrorHandler);
			this.refreshErrorHandler = null;
		}
		if (!refreshToken) {
			return;
		}
		this.refreshErrorHandler = async (err) => {
			if (!err.res) {
				return null;
			}
			if (err.req.method === 'POST' && ['/api/identity/login', '/api/identity/token/refresh'].includes(err.req.url)) {
				return null;
			}
			if (err.res.status === 401 || err.res.status === 403) {
				const newTokens = await this.refreshAccessToken(refreshToken);
				this.authorizeHttpRequests(newTokens.accessToken, newTokens.refreshToken, onRefresh);
				if (onRefresh) {
					onRefresh(newTokens);
				}
				return this.http.fetch(err.req.url, err.req.method, err.req.body, err.req.headers);
			}
			return null;
		};
		this.http.addErrorHandler(this.refreshErrorHandler);
	}

	logout(): Promise<void> {
		return Promise.resolve();
	}
}
