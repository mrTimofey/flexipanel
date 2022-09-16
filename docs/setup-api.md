# Setup API integration

To configure authorization and data protocol used by your backend API go to the `src/main.ts`. There we will use an `app` object as a starting point to configure everything you need.

## HTTP client

HTTP client is a fetch/JSON based client by default. It stringifies/parses JSON request/response bodies. If you need something different you can make your own HTTP client. You can just omit this section otherwise.

Anyway keep in mind that any client you will use shouldn't make any assumptions about data structures returned by a server or passed as a request body. It only (de)serializes raw data. We will cover a data structure part later.

```typescript
// src/main.ts

import App from 'flexipanel/dist/main';

const app = new App();

// this is a DI/IoC container where you will customize or configure standard Flexipanel modules
const container = app.getIocContainer();

// built-in fetch/JSON client
import FetchJsonClient from 'flexipanel/dist/modules/http/fetch-json-client';
// abstract http client which is used to obtain an actual http client from the container AND as a base class for your own implementation
import HttpClient from 'flexipanel/dist/modules/http';
import type { IHttpRequest, IHttpResponse, IUploadRequest } from 'flexipanel/dist/modules/http';
// this is needed only for your constructor
import { inject } from 'mini-ioc';

// here is a copy of the FetchJsonClient client implementation, you can use it as a reference
// or you can extend FetchJsonClient itself instead of HttpClient if you just want to make some tweaks on top of it
class MySpecialHttpClient extends HttpClient {
  // implement a constructor if you need something injected from the container
  constructor(
    // IMPORTANT! inject function can not be used outside a constructor!
    protected someClass = inject(SomeClass),
    protected someOtherClass = inject(SomeOtherClass)
  ) {
    // initialization
  }

  /**
   * Actual request sending implementation.
   * @param req request data object
   */
  protected sendRequest<T>(req: IHttpRequest): Promise<IHttpResponse<T>> {
    return window
      .fetch(url, {
        method,
        body: reqBody == null ? null : JSON.stringify(reqBody),
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        credentials: 'include',
      })
      .then(async (res) => {
        const contentType = res.headers.get('Content-Type');
        let body = null;
        if (contentType && res.status !== 204 && contentType.startsWith('application') && contentType.includes('json')) {
          body = await res.json();
        }
        return {
          headers: res.headers,
          status: res.status,
          statusText: res.statusText,
          body,
        };
      });
  }

  /**
   * Actual file uploading request implementation.
   * @param req request data
   */
  protected sendFile<T>(req: IUploadRequest): Promise<IHttpResponse<T>> {
    return new Promise((resolve, reject) => {
      const body = new FormData();
      body.append('file', blob);
      const xhr = new XMLHttpRequest();
      xhr.withCredentials = true;
      xhr.addEventListener('load', () => {
        const contentType = xhr.getResponseHeader('Content-Type');
        const isJson = contentType && contentType.startsWith('application') && contentType.includes('json');
        resolve({
          body: isJson ? JSON.parse(xhr.response) : null,
          headers: {
            get(key: string) {
              return xhr.getResponseHeader(key);
            },
            has(key: string) {
              return !!xhr.getResponseHeader(key);
            },
          },
          status: xhr.status,
          statusText: xhr.statusText,
        });
      });
      xhr.addEventListener('error', (err) => reject(err));
      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => onProgress(e));
        xhr.upload.addEventListener('load', (e) => onProgress(e));
      }
      xhr.open(method, url);
      Object.entries(headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });
      xhr.send(body);
    });
  }
}

container.bind(HttpClient, MySpecialHttpClient)

```

## Authorization

```typescript
// src/main.ts

import App from 'flexipanel/dist/main';

const app = new App();

// this is a DI/IoC container where you will customize or configure standard Flexipanel modules
const container = app.getIocContainer();

/**
 * Public access without authorization
 */

// base abstract class for authorization logic
import AuthProvider from 'flexipanel/dist/modules/auth/provider';
// no-auth provider (just shows you the dashboard without any login page)
import PublicAuthProvider from 'flexipanel/dist/modules/auth/providers/public';

container.bind(AuthProvider, PublicAuthProvider);

/**
 * Built-in token authorization
 */

// base class for authorization logic
import AuthProvider from 'flexipanel/dist/modules/auth/provider';
// HTTP token authorization implementation with refresh
import HttpTokenAuthProvider from 'flexipanel/dist/modules/auth/providers/http-token';

// configure http token provider
container.registerResolver(AuthProvider, (ctor, ioc) => {
  // create an instance using container...
  const httpTokenProvider = ioc.create(HttpTokenAuthProvider);
  // ...then add customizations
  httpTokenProvider.setHttpEndpoints({
    // where you want to send user's login/password
    authenticate: '/api/auth', // default
    // where you want to refresh an access token using a remember token
    // pass empty string if you don't use refresh tokens
    refresh: '/api/auth/refresh', // default
    // where you want to cleanup user data on logout
    logout: '', // default
  });
  httpTokenProvider.setHttpBodyKeys({
    // keys returned by your API
    accessToken: 'token', // default
    refreshToken: 'refresh_token', // default
    // request body keys for login/password request
    login: 'username', // default
    password: 'password', // default
    // request body key for refresh token (set to empty string to use same as refreshToken)
    refreshTokenInRequestBody: '', // default
  });
  // token is passed as Authorization: Bearer {token} header for every request by default
  // you can replace authorizeRequest method with an empty function if you use cookies
  // or make your own implementation if you pass tokens differently
  httpTokenProvider.authorizeRequest = (req, token) => {
    // your code
    // modify headers/body using the `req` object
    // `token` is a token string itself
  };
  return httpTokenProvider;
});

/**
 * Custom authorization provider
 */

import type { ICredentials, IAuthenticationResult } from 'flexipanel/dist/modules/auth/provider';
import type { IHttpRequest, IHttpResponse } from 'flexipanel/dist/modules/http';
import AuthProvider, { WrongCredentialsError } from 'flexipanel/dist/modules/auth/provider';
// this is needed only for your constructor
import { inject } from 'mini-ioc';

// you can make your own provider class by extending AuthProvider (or any other built-in provider)
class MySpecialAuthProvider extends AuthProvider {
  // implement a constructor if you need something injected from the container
  // if you need just an http client - don't define a constructor since this.http is injected by the parent class
  constructor(
    // IMPORTANT! inject function can not be used outside a constructor!
    protected someClass = inject(SomeClass),
    protected someOtherClass = inject(SomeOtherClass)
  ) {
    super();
    // initialization
  }

  async authenticate(credentials: ICredentials): Promise<IAuthenticationResult> {
    // do authentication request with provided credentials
    // you can use `this.http` everywhere within class methods to make http requests
    await this.http.post('/login', {
      really: {
        really: {
          deep: {
            object: {
              credentials
            }
          }
        }
      }
    });
  }
  logout(): Promise<void> {
    // do logout for current session
    // just return Promise.resolve() if just erasing an access token from the localStorage is sufficient
    return Promise.resolve();
  }
  authorizeRequest(req: IHttpRequest, token: string): void {
    // modify http request to make server recognize current session
    req.headers.Authorization = `Bearer ${token}`;
  }
  isRequestRecoverable(reqData: { req: IHttpRequest; res: IHttpResponse<unknown> | null }): boolean {
    // check request and response
    // return false if user has to enter login/password
    // return true if we can recover the session automatically
  }
  protected recoverAccessToken(refreshToken: string): Promise<IAuthenticationResult> {
    // do authentication request with provided refresh token
  }
}

// from now on all the authorization is controlled by your implementation :)
container.bind(AuthProvider, MySpecialAuthProvider);

app.mount('#app');
```

## Entities and data structure

Now the most exciting part. We will define an entity adapter which is used for CRUD operations needed for your actual data.

Flexipanel provides a ready-to-use [JSON:API](https://jsonapi.org/) adapter. You need your own adapter if your server uses different approach. Adapters can be defined per-entity so it is OK to have multiple adapters.

```typescript
// src/main.ts

import App from 'flexipanel/dist/main';

const app = new App();

// this is a DI/IoC container where you will customize or configure standard Flexipanel modules
const container = app.getIocContainer();

import type IAdapter from 'flexipanel/dist/modules/entity/adapter';
import type { IListParams, IListData, IItemParams, IItemData } from 'flexipanel/dist/modules/entity/adapter';
import { ValidationError } from 'flexipanel/dist/modules/entity/adapter';
import adaptersCollection from 'flexipanel/dist/modules/entity/adapters';
import HttpClient from 'flexipanel/dist/modules/http';

class MySpecialAdapter implements IAdapter {
  // implement a constructor if you need something injected from the container
  constructor(
    // IMPORTANT! inject function can not be used outside a constructor!
    protected http = inject(HttpClient),
    protected someClass = inject(SomeClass),
    protected someOtherClass = inject(SomeOtherClass)
  ) {
    // initialization
  }

  // endpoint is defined for each entity and passed to any method here
  // if you use jsonApi adapter there will be just an API URL prefix, for other adapters it is specific to your application

  getList(endpoint: string, params: IListParams): Promise<IListData> {
    // params contain everything related to list request: filters, sorting, pagination, etc.
    // there you can make a request for entity listing
    const res = this.http.get(`${endpoint}?filter=${JSON.stringify(params.filters)}&offset=${params.offset}&limit=${params.limit}&sort=${JSON.stringify(params.sort)}`); // just an example
    return Promise.resolve({
      // entity items
      items: [
        {
          // entity item data (example: name, surname, email for user)
        },
        // ...
      ],
      // pagination data
      offset: 0,
      limit: 25,
      total: 999,
    });
  }

  getItem(endpoint: string, params: IItemParams): Promise<IItemData> {
    // params contain identifier and other data to query a single item
    // there you can make a request for entity listing
    const res = this.http.get(`${endpoint}/${params.id}`); // just an example
    return Promise.resolve({
      item: {
        // entity item data (example: name, surname, email for user)
      },
      relatedItems: {
        relatedEntityField: {
          relatedEntityIdentifier: {
            // related entity item data (example: name, surname, email for user)
          },
          // ...
        },
        // ...
      }
    });
  }

  deleteItem(endpoint: string, id: string): Promise<void> {
    // make a request to delete item
    this.http.delete(`${endpoint}/${id}`); // just an example
    return Promise.resolve();
  }

  saveItem(endpoint: string, item: Record<string, unknown>, id?: string): Promise<IItemData> {
    // make a request to create (if id is omitted) or update (if id is present) item
    const res = id == null ? this.http.post(endpoint, item) : this.http.patch(`${endpoint}/${id}`, item); // just an example
    // check validation errors
    throw new ValidationError({
      field: ['Error 1 description', 'Error 2 description'],
      // ...
    }, 'Some fields contain incorrect values');
    // return item data if everything OK
    return Promise.resolve({
      item: {
        // entity item data (example: name, surname, email for user)
      },
      relatedItems: {
        relatedEntityField: {
          relatedEntityIdentifier: {
            // related entity item data (example: name, surname, email for user)
          },
          // ...
        },
        // ...
      }
    });
  }
}

// register the adapter class named 'mySpecialAdapter'
adaptersCollection.mySpecialAdapter = () => Promise.resolve(MySpecialAdapter);
// OR import your adapter module asynchronously
adaptersCollection.mySpecialAdapter = () => import('./my-special-adapter').then((module) => module.default);

// you can make your adapter a default one
import { entityMetaDefaults } from 'flexipanel/dist/modules/entity';
entityMetaDefaults.apiType = 'mySpecialAdapter'; // jsonApi by default
```
