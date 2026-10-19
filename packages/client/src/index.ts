import type { ServiceClient as ServiceClientInstance } from './ServiceClient';

export type * from '@polymarket-client-open/bindings';
export {
  CommentParentEntityType,
  OrderSide,
  OrderType,
} from '@polymarket-client-open/bindings';
export type * from '@polymarket-client-open/bindings/clob';
export {
  AssetType,
  NotificationType,
  OrderPostStatus,
  OrderResponseErrorCode,
  RewardMarketSort,
  SignatureType,
} from '@polymarket-client-open/bindings/clob';
export type * from '@polymarket-client-open/bindings/data';
export {
  ActivityType,
  TokenModule,
} from '@polymarket-client-open/bindings/data';
export type * from '@polymarket-client-open/bindings/gamma';
export {
  ComboKnownStatus,
  MarketResolutionStatus,
  ProtocolVersion,
  TeamOrdering,
  WalletType,
} from '@polymarket-client-open/bindings/gamma';
/** @experimental This API may change in a breaking way in any release, including patch releases. */
export type * from '@polymarket-client-open/bindings/perps';
/** @experimental This API may change in a breaking way in any release, including patch releases. */
export {
  PerpsDepositStatus,
  PerpsInstrumentCategory,
  PerpsInstrumentType,
  PerpsInternalTransferDirection,
  PerpsKlineInterval,
  PerpsKnownCancelOrderErrorCode,
  PerpsKnownInternalTransferType,
  PerpsKnownWithdrawalStatus,
  PerpsLiquidationMethod,
  PerpsLiquidityRole,
  PerpsMarginType,
  PerpsNotificationOrderType,
  PerpsNotificationType,
  PerpsOrderStatus,
  PerpsPositionSnapshotMarkerKind,
  PerpsPositionSnapshotStatus,
  PerpsSide,
  PerpsSortDirection,
  PerpsTimeInForce,
} from '@polymarket-client-open/bindings/perps';
export type * from '@polymarket-client-open/bindings/relayer';
export * from './abis';
export { isWalletDeployed, SearchSort } from './actions';
export type {
  RelayerApiKeyConfig,
  RemoteBuilderSigningConfig,
} from './authorization';
export { relayerApiKey, remoteBuilderSigning } from './authorization';
export type * from './clients';
export {
  CreateSecureClientError,
  createPublicClient,
  createSecureClient,
  SetupGaslessWalletError,
} from './clients';
export * from './decorators';
export * from './environments';
export * from './errors';
export * from './hmac';
export type * from './pagination';
export type {
  RateLimitBucket,
  RateLimitUpdate,
  RateLimitUpdateListener,
} from './rate-limit';
/** @experimental This API may change in a breaking way in any release, including patch releases. */
export type { Fetch, RequestOptions } from './request-options';
/**
 * Service client returned by the experimental `predictions` getter.
 *
 * @experimental For the polymarket.com UI. External consumers should not adopt this API. Breaking changes may occur in any release, including patch releases.
 */
export type ServiceClient = ServiceClientInstance;
export { deployDepositWallet } from './actions/gasless';
/** @experimental See {@link ServiceClient}. */
export type {
  ServiceClientDeleteOptions,
  ServiceClientGetOptions,
  ServiceClientJsonResponseOptions,
  ServiceClientNonJsonResponseOptions,
  ServiceClientNonJsonResponseType,
  ServiceClientPatchOptions,
  ServiceClientPostOptions,
  ServiceClientRequestOptions,
  ServiceClientResponse,
  ServiceClientResponseOptions,
  ServiceClientResponseType,
} from './ServiceClient';
export { ServiceClientRequestError } from './ServiceClient';
export * from './types';
export {
  type AccountIdentity,
  deriveBeaconDepositWalletAddress,
  deriveUupsDepositWalletAddress,
  resolveAccountIdentity,
  SignerType,
} from './wallet';
