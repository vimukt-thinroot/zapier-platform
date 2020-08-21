// this is a .ts file instead of a .d.ts file so that not everything is exported

/// <reference types="node" />

import { Agent } from 'http';

// internal only
// export const integrationTestHandler: () => any;
// export const createAppHandler: (appRaw: object) => any

type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'OPTIONS'
  | 'HEAD';

export interface Bundle<InputData = {}> {
  authData: { [x: string]: string };
  inputData: InputData extends undefined ? { [x: string]: unknown } : InputData;
  inputDataRaw: { [x: string]: string };
  meta: {
    isFillingDynamicDropdown: boolean;
    isLoadingSample: boolean;
    isPopulatingDedupe: boolean;
    isTestingAuth: boolean;
    limit: number;
    page: number;
    zap?: { id: string };
  };
  rawRequest?: Partial<{
    method: HttpMethod;
    querystring: string;
    headers: { [x: string]: string };
    content: string;
  }>;
  cleanedRequest?:
    | Partial<{
        method: HttpMethod;
        querystring: { [x: string]: string };
        headers: { [x: string]: string };
        content: { [x: string]: string };
      }>
    | any;
  subscribeData?: { id: string };
  targetUrl?: string;
}

declare class AppError extends Error {
  constructor(message: string, code?: string, status?: number);
}
declare class HaltedError extends Error {}
declare class ExpiredAuthError extends Error {}
declare class RefreshAuthError extends Error {}

// copied http stuff from external typings
export interface HttpRequestOptions {
  agent?: Agent;
  body?: string | Buffer | NodeJS.ReadableStream | object;
  compress?: boolean;
  follow?: number;
  form?: object;
  headers?: { [name: string]: string };
  json?: object | any[];
  method?: HttpMethod;
  params?: object;
  raw?: boolean;
  redirect?: 'manual' | 'error' | 'follow';
  removeMissingValuesFrom?: {
    params?: boolean;
    body?: boolean;
  };
  size?: number;
  timeout?: number;
  url?: string;
  skipThrowForStatus?: boolean;
}

interface BaseHttpResponse {
  status: number;
  headers: { [key: string]: string };
  getHeader(key: string): string | undefined;
  throwForStatus(): void;
  skipThrowForStatus: boolean;
  request: HttpRequestOptions;
}

export interface HttpResponse extends BaseHttpResponse {
  content: string;
  data?: object;
  /** @deprecated use `response.data` instead. */
  json?: object;
}

export interface RawHttpResponse extends BaseHttpResponse {
  content: Buffer;
  json: Promise<object | undefined>;
  body: NodeJS.ReadableStream;
}

type DehydrateFunc = <T>(
  func: (z: ZObject, bundle: Bundle<T>) => unknown,
  inputData: object
) => string;

export interface ZObject {
  request: {
    // most specific overloads go first
    (url: string, options: HttpRequestOptions & { raw: true }): Promise<
      RawHttpResponse
    >;
    (options: HttpRequestOptions & { raw: true; url: string }): Promise<
      RawHttpResponse
    >;

    (url: string, options?: HttpRequestOptions): Promise<HttpResponse>;
    (options: HttpRequestOptions & { url: string }): Promise<HttpResponse>;
  };

  console: Console;

  dehydrate: DehydrateFunc;
  dehydrateFile: DehydrateFunc;

  cursor: {
    get: () => Promise<string>;
    set: (cursor: string) => Promise<null>;
  };
  generateCallbackUrl: () => string;

  /**
   * turns a file or request into a file into a publicly accessible url
   */
  stashFile: {
    (
      input: string | Buffer | NodeJS.ReadableStream,
      knownLength?: number,
      filename?: string,
      contentType?: string
    ): string;
    (input: Promise<RawHttpResponse>): string;
    (input: Promise<string>): string;
  };

  JSON: {
    /**
     * Acts a lot like regular `JSON.parse`, but throws a nice error for improper json input
     */
    parse: (text: string) => ReturnType<JSON['parse']>;
    stringify: typeof JSON.stringify;
  };

  /**
   * Easily hash data using node's crypto package
   * @param algorithm probably 'sha256', see [this](https://nodejs.org/api/crypto.html#crypto_crypto_createhash_algorithm_options) for more options
   * @param data the data you want to hash
   * @param encoding defaults to 'hex'
   * @param input_encoding defaults to 'binary'
   */
  hash: (
    algorithm: string,
    data: string,
    encoding?: string,
    input_encoding?: string
  ) => string;

  errors: {
    Error: typeof AppError;
    HaltedError: typeof HaltedError;
    ExpiredAuthError: typeof ExpiredAuthError;
    RefreshAuthError: typeof RefreshAuthError;
  };
}