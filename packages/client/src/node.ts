import process from 'node:process';
import { invariant } from '@polymarket-client-open/types';

import { SigningError } from './errors';
import { buildHmacSignature } from './hmac';
import type { ApiKeyAuthorization, ApiKeyAuthorizationRequest } from './types';

invariant(
  process.release.name === 'node',
  'The @polymarket-client-open/client/node entrypoint requires a Node.js runtime.',
);
invariant(
  typeof window === 'undefined' && typeof document === 'undefined',
  'The @polymarket-client-open/client/node entrypoint cannot be imported in a browser-like runtime.',
);

export type BuilderApiKeyCreds = {
  key: string;
  secret: string;
  passphrase: string;
};

export function builderApiKey(
  options: BuilderApiKeyCreds,
): ApiKeyAuthorization {
  return new LocalBuilderApiKey(options);
}

class LocalBuilderApiKey implements ApiKeyAuthorization {
  readonly #credentials: BuilderApiKeyCreds;

  constructor(credentials: BuilderApiKeyCreds) {
    this.#credentials = credentials;
  }

  get isBuilderKey(): boolean {
    return true;
  }

  get supportGasless(): boolean {
    return true;
  }

  async authorize(request: ApiKeyAuthorizationRequest): Promise<HeadersInit> {
    return this.#authorize(request);
  }

  async #authorize(request: ApiKeyAuthorizationRequest): Promise<HeadersInit> {
    try {
      const timestamp = Math.floor(Date.now() / 1000);

      return {
        POLY_BUILDER_API_KEY: this.#credentials.key,
        POLY_BUILDER_PASSPHRASE: this.#credentials.passphrase,
        POLY_BUILDER_SIGNATURE: await buildHmacSignature(
          this.#credentials.secret,
          timestamp,
          request.method,
          request.path,
          request.body,
        ),
        POLY_BUILDER_TIMESTAMP: `${timestamp}`,
      };
    } catch (error) {
      throw SigningError.fromError(
        error,
        'Could not sign the builder-authenticated request',
      );
    }
  }
}
