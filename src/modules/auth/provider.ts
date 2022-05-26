/* eslint-disable max-classes-per-file */
import { inject } from 'mini-ioc';
import type { ErrorHandler, IHttpRequest, IHttpResponse, RequestInterceptor } from '../http';
import HttpClient from '../http';

export interface ICredentials {
	login: string;
	password: string;
}

export interface IAuthenticationResult {
	accessToken: string;
	refreshToken: string;
}

const recoveredMetadataKey = Symbol('RequestRecovered');

export default abstract class AuthProvider {
	abstract authenticate(credentials: ICredentials): Promise<IAuthenticationResult>;
	abstract logout(): Promise<void>;
	abstract authorizeRequest(req: IHttpRequest, token: string): void;
	abstract isRequestRecoverable(reqData: { req: IHttpRequest; res: IHttpResponse<unknown> | null }): boolean;
	protected abstract recoverAccessToken(refreshToken: string): Promise<IAuthenticationResult>;

	private requestInterceptor: RequestInterceptor | null = null;
	private recoverErrorHandler: ErrorHandler | null = null;
	private accessTokenRecoveryRequest: Promise<IAuthenticationResult> | null = null;

	constructor(protected http = inject(HttpClient)) {}

	public waitRecoveredAccessToken(refreshToken: string): Promise<IAuthenticationResult> {
		if (!this.accessTokenRecoveryRequest) {
			this.accessTokenRecoveryRequest = this.recoverAccessToken(refreshToken).then((data) => {
				this.accessTokenRecoveryRequest = null;
				return data;
			});
		}
		return this.accessTokenRecoveryRequest;
	}

	authorizeHttpRequests(token: string | null, refreshToken?: string, onRefresh?: (tokens: IAuthenticationResult) => void): void {
		if (this.requestInterceptor) {
			this.http.removeRequestInterceptor(this.requestInterceptor);
			this.requestInterceptor = null;
		}
		if (this.recoverErrorHandler) {
			this.http.removeErrorHandler(this.recoverErrorHandler);
			this.recoverErrorHandler = null;
		}

		if (!token) {
			return;
		}
		this.requestInterceptor = (req) => this.authorizeRequest(req, token);
		this.http.addRequestInterceptor(this.requestInterceptor);

		if (!refreshToken) {
			return;
		}
		this.recoverErrorHandler = async (err, retry) => {
			if (err.req.metadata[recoveredMetadataKey] === true || !this.isRequestRecoverable(err)) {
				return null;
			}
			const newTokens = await this.waitRecoveredAccessToken(refreshToken);
			this.authorizeHttpRequests(newTokens.accessToken, newTokens.refreshToken, onRefresh);
			if (onRefresh) {
				onRefresh(newTokens);
			}
			return retry({ ...err.req, metadata: { ...err.req.metadata, [recoveredMetadataKey]: true } });
		};
		this.http.addErrorHandler(this.recoverErrorHandler);
	}
}

export class WrongCredentialsError extends Error {}
