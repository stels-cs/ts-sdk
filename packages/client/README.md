# `@polymarket-client-open/client`

`@polymarket-client-open/client` is the official TypeScript client for building on Polymarket.

## Installation

```bash
pnpm add @polymarket-client-open/client
```

## Usage

```ts
import { createPublicClient } from '@polymarket-client-open/client';

const client = createPublicClient();

const result = client.listMarkets({
  closed: false,
  pageSize: 3,
});

for await (const page of result) {
  // page.items: Market[] 
}
```

## License

MIT
