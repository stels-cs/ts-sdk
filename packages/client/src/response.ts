import {
  err,
  ok,
  type Result,
  ResultAsync,
} from '@polymarket-client-open/types';
import type { z } from 'zod';
import { UnexpectedResponseError } from './errors';

export function validateWith<TReturnType>(schema: z.ZodType<TReturnType>) {
  return function validateResponse(
    response: Response,
  ): ResultAsync<TReturnType, UnexpectedResponseError> {
    return ResultAsync.fromPromise(
      response.json(),
      () =>
        new UnexpectedResponseError(
          `Received non-JSON response from ${response.url}`,
        ),
    ).andThen((payload) => parseResponse(response.url, schema, payload));
  };
}

export function readBlob(
  response: Response,
): ResultAsync<Blob, UnexpectedResponseError> {
  return ResultAsync.fromPromise(
    response.blob(),
    () =>
      new UnexpectedResponseError(
        `Received unreadable binary response from ${response.url}`,
      ),
  );
}

function parseResponse<TReturnType>(
  endpoint: string,
  schema: z.ZodType<TReturnType>,
  response: unknown,
): Result<TReturnType, UnexpectedResponseError> {
  const result = schema.safeParse(response);

  if (result.success) {
    return ok(result.data);
  }

  return err(UnexpectedResponseError.fromZodError(result.error, { endpoint }));
}
