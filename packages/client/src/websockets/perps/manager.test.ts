import type { PerpsCredentials } from '@polymarket-client-open/bindings/perps';
import {
  expectEvmAddress,
  expectPrivateKey,
} from '@polymarket-client-open/types';
import { ws } from 'msw';
import { setupServer } from 'msw/node';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import { production } from '../../environments';
import { PerpsSessionManager } from './manager';

const perps = ws.link(production.perps.ws);
const server = setupServer();

const credentials = {
  expiresAt: Date.now() + 30 * 60_000,
  privateKey: expectPrivateKey(
    '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  ),
  proxy: expectEvmAddress('0x0000000000000000000000000000000000000001'),
  secret: 'secret',
} satisfies PerpsCredentials;

describe('PerpsSessionManager', () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'bypass' });
  });

  beforeEach(() => {
    mockSuccessfulSession();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  it('connects sessions through the manager lifecycle', async () => {
    const manager = new PerpsSessionManager({
      chainId: production.chainId,
      restUrl: production.perps.rest,
      wsUrl: production.perps.ws,
    });
    const session = await manager.connect(credentials);

    expect(session.credentials).toBe(credentials);

    await manager.shutdown();
    expect(session.closed).toBe(true);
  });

  it('closes sessions that finish connecting after manager close starts', async () => {
    server.resetHandlers();
    const connection = mockDelayedAuthSession();
    const manager = new PerpsSessionManager({
      chainId: production.chainId,
      restUrl: production.perps.rest,
      wsUrl: production.perps.ws,
    });

    const connect = manager.connect(credentials);
    await connection.waitForAuthFrame;
    const shutdown = manager.shutdown();

    await expect(manager.connect(credentials)).rejects.toThrow(
      'Perps session manager has been shut down.',
    );
    connection.resolveAuth();

    await expect(connect).rejects.toThrow();
    await shutdown;
    expect(connection.closeCount()).toBeGreaterThan(0);
  });

  it('rejects new sessions after manager close finishes', async () => {
    const manager = new PerpsSessionManager({
      chainId: production.chainId,
      restUrl: production.perps.rest,
      wsUrl: production.perps.ws,
    });

    await manager.shutdown();

    await expect(manager.connect(credentials)).rejects.toThrow(
      'Perps session manager has been shut down.',
    );
  });
});

function mockSuccessfulSession(): void {
  server.use(
    perps.addEventListener('connection', ({ client }) => {
      client.addEventListener('message', (event) => {
        const frame = JSON.parse(String(event.data));
        const data =
          frame.req === 'sub' ? [{ status: 'ok' }] : { status: 'ok' };
        client.send(
          JSON.stringify({
            id: frame.id,
            data,
          }),
        );
      });
    }),
  );
}

function mockDelayedAuthSession(): {
  closeCount: () => number;
  resolveAuth: () => void;
  waitForAuthFrame: Promise<void>;
} {
  let closeCount = 0;
  let resolveAuth!: () => void;
  let authFrameReceived!: () => void;
  const waitForAuthFrame = new Promise<void>((resolve) => {
    authFrameReceived = resolve;
  });
  const waitForAuthResolution = new Promise<void>((resolve) => {
    resolveAuth = resolve;
  });

  server.use(
    perps.addEventListener('connection', ({ client }) => {
      client.addEventListener('close', () => {
        closeCount += 1;
      });

      client.addEventListener('message', (event) => {
        const frame = JSON.parse(String(event.data));

        if (frame.op?.type === 'auth') {
          authFrameReceived();
          void waitForAuthResolution.then(() => {
            client.send(
              JSON.stringify({
                id: frame.id,
                data: { status: 'ok' },
              }),
            );
          });
          return;
        }

        const data =
          frame.req === 'sub' ? [{ status: 'ok' }] : { status: 'ok' };
        client.send(
          JSON.stringify({
            id: frame.id,
            data,
          }),
        );
      });
    }),
  );

  return {
    closeCount: () => closeCount,
    resolveAuth,
    waitForAuthFrame,
  };
}
