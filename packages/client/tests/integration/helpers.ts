import type {
  AcceptedOrderResponse,
  OrderResponse,
} from '@polymarket-client-open/bindings/clob';
import type { Page, Paginated } from '@polymarket-client-open/client';
import {
  expectNonEmptyArray,
  type NonEmptyArray,
} from '@polymarket-client-open/types';
import { expect } from 'vitest';

export function expectAcceptedOrderResponse(
  response: OrderResponse,
): AcceptedOrderResponse {
  expect(response.ok).toBe(true);

  if (!response.ok) {
    throw new Error(
      `Expected accepted order response, received: ${response.code}`,
    );
  }

  return response;
}

export function expectNonEmptyPage<T>(
  page: Page<T[]>,
): Omit<Page<T[]>, 'items'> & { items: NonEmptyArray<T> } {
  return {
    ...page,
    items: expectNonEmptyArray(page.items),
  };
}

export async function expectPageWindow<T>(
  paginator: Paginated<T[]>,
  firstPage: Pick<Page<unknown>, 'nextCursor'>,
  additionalPages: number,
): Promise<void> {
  let remainingPages = additionalPages;

  for await (const _page of paginator.from(firstPage.nextCursor)) {
    if (--remainingPages === 0) {
      break;
    }
  }
}
