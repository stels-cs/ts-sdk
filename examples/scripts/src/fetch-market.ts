import { createPublicClient } from '@polymarket-client-open/client';
import { never } from './lib/assert';

const client = createPublicClient();

const { items } = await client
  .listMarkets({
    pageSize: 3,
  })
  .firstPage();

const marketByUrl = await client.fetchMarket({
  url: `https://polymarket.com/market/${items[0]?.slug ?? never('No slug found for market')}`,
});

const marketBySlug = await client.fetchMarket({
  slug: items[1]?.slug ?? never('No slug found for market'),
});

const marketById = await client.fetchMarket({
  id: items[2]?.id ?? never('No active market found'),
});

console.log(`URL lookup: ${marketByUrl.question ?? marketByUrl.id}`);
console.log(`Slug lookup: ${marketBySlug.question ?? marketBySlug.id}`);
console.log(`ID lookup: ${marketById.question ?? marketById.id}`);
