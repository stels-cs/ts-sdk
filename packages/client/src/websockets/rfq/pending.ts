import { setNonBlockingTimeout } from '@polymarket-client-open/types';
import { TimeoutError } from '../../errors';

type PendingResponse<T> = {
  promise: Promise<T>;
  reject(error: Error): void;
  resolve(value: T): void;
};

export class PendingResponses {
  readonly #pending = new Map<string, PendingResponse<unknown>[]>();
  readonly #timeoutMs: number;

  constructor(timeoutMs: number) {
    this.#timeoutMs = timeoutMs;
  }

  waitFor<T>(key: string, timeoutMessage: string): Promise<T> {
    const pending = createPending<T>();
    let promise!: Promise<T>;
    const timeout = setNonBlockingTimeout(() => {
      this.remove(key, promise);
      pending.reject(new TimeoutError(timeoutMessage));
    }, this.#timeoutMs);
    promise = pending.promise.finally(() => clearTimeout(timeout));
    const entries = this.#pending.get(key) ?? [];
    entries.push({ ...pending, promise } as PendingResponse<unknown>);
    this.#pending.set(key, entries);
    return promise;
  }

  resolve<T>(key: string, value: T): void {
    const entries = this.#pending.get(key);
    const pending = entries?.shift();
    if (pending === undefined) return;
    if (entries !== undefined && entries.length === 0) {
      this.#pending.delete(key);
    }
    pending.resolve(value);
  }

  reject(key: string, error: Error): void {
    const entries = this.#pending.get(key);
    const pending = entries?.shift();
    if (pending === undefined) return;
    if (entries !== undefined && entries.length === 0) {
      this.#pending.delete(key);
    }
    pending.reject(error);
  }

  remove<T>(key: string, promise: Promise<T>): void {
    const entries = this.#pending.get(key);
    if (entries === undefined) return;
    const remaining = entries.filter((entry) => entry.promise !== promise);
    if (remaining.length === 0) {
      this.#pending.delete(key);
    } else {
      this.#pending.set(key, remaining);
    }
  }

  rejectAll(error: Error): void {
    for (const entries of this.#pending.values()) {
      for (const pending of entries) {
        pending.reject(error);
      }
    }
    this.#pending.clear();
  }
}

function createPending<T>(): PendingResponse<T> {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}
