import {
  expectEvmAddress,
  expectEvmSignature,
  expectTxHash,
  type HexString,
  type TxHash,
} from '@polymarket-client-open/types';
import { ethers } from 'ethers-v5';
import {
  CancelledSigningError,
  SigningError,
  TransactionFailedError,
  TransportError,
} from './errors';
import type {
  Signer,
  TransactionHandle,
  TypedData,
  TypedDataPayload,
} from './types';

type EthersV5Signer = ethers.Signer & {
  _signTypedData(
    domain: TypedDataPayload['domain'],
    types: ReturnType<typeof removeEip712Domain>,
    value: TypedDataPayload['message'],
  ): Promise<string>;
};

export function signerFrom(signer: EthersV5Signer): Signer {
  return {
    getAddress() {
      return getAddress(signer);
    },
    signTypedData(payload) {
      return signTypedData(signer, payload);
    },
    signMessage(message) {
      return signMessage(signer, message);
    },
    async sendTransaction(request) {
      return new DirectTransactionHandle(
        await sendTransaction(signer, request),
      );
    },
  };
}

async function getAddress(signer: EthersV5Signer) {
  try {
    return expectEvmAddress(await signer.getAddress());
  } catch (error) {
    throw SigningError.fromError(error, 'Could not resolve signer address');
  }
}

async function sendTransaction(
  signer: EthersV5Signer,
  request: { chainId: number; data?: HexString; to: string; value?: bigint },
): Promise<ethers.providers.TransactionResponse> {
  try {
    return await signer.sendTransaction({
      chainId: request.chainId,
      data: request.data,
      to: request.to,
      value: request.value?.toString(),
    });
  } catch (error) {
    throwSigningWorkflowError(error);
  }
}

async function signTypedData(
  signer: EthersV5Signer,
  payload: TypedDataPayload,
) {
  try {
    return expectEvmSignature(
      await signer._signTypedData(
        payload.domain,
        removeEip712Domain(payload.types),
        payload.message,
      ),
    );
  } catch (error) {
    throwSigningWorkflowError(error);
  }
}

async function signMessage(signer: EthersV5Signer, message: HexString) {
  try {
    return expectEvmSignature(
      await signer.signMessage(ethers.utils.arrayify(message)),
    );
  } catch (error) {
    throwSigningWorkflowError(error);
  }
}

function removeEip712Domain(
  types: TypedData,
): Record<string, Array<{ name: string; type: string }>> {
  const entries = Object.entries(types).filter(
    ([name]) => name !== 'EIP712Domain',
  );

  return Object.fromEntries(
    entries.map(([name, fields]) => [
      name,
      fields.map((field) => ({ ...field })),
    ]),
  );
}

function throwSigningWorkflowError(error: unknown): never {
  if (isUserRejectedError(error)) {
    throw new CancelledSigningError('User rejected the signing request', {
      cause: error,
    });
  }

  throw SigningError.fromError(error);
}

function isUserRejectedError(
  error: unknown,
  seen = new Set<unknown>(),
): boolean {
  if (seen.has(error) || error === null || typeof error !== 'object') {
    return false;
  }

  seen.add(error);

  const candidate = error as {
    cause?: unknown;
    code?: unknown;
    error?: unknown;
  };

  return (
    // ethers v5 normalizes user-rejected wallet actions to ACTION_REJECTED,
    // but some provider-shaped errors can still surface the raw EIP-1193 4001.
    candidate.code === 4001 ||
    candidate.code === 'ACTION_REJECTED' ||
    isUserRejectedError(candidate.error, seen) ||
    isUserRejectedError(candidate.cause, seen)
  );
}

function isCallExceptionError(error: unknown): error is Error {
  return hasErrorCode(error, 'CALL_EXCEPTION');
}

function isTransactionReplacedError(error: unknown): error is Error & {
  cancelled: boolean;
  receipt: { transactionHash: string };
} {
  return hasErrorCode(error, 'TRANSACTION_REPLACED');
}

function hasErrorCode(error: unknown, code: string): error is Error {
  return (
    error instanceof Error &&
    'code' in error &&
    (error as { code?: unknown }).code === code
  );
}

class DirectTransactionHandle implements TransactionHandle {
  readonly transactionId = null;
  #transactionHash: TxHash;
  readonly #transaction: ethers.providers.TransactionResponse;

  constructor(transaction: ethers.providers.TransactionResponse) {
    this.#transaction = transaction;
    this.#transactionHash = expectTxHash(transaction.hash);
  }

  get transactionHash() {
    return this.#transactionHash;
  }

  async wait() {
    try {
      const receipt = await this.#transaction.wait();

      const transactionHash = expectTxHash(receipt.transactionHash);
      this.#transactionHash = transactionHash;

      return {
        transactionHash,
        transactionId: null,
      };
    } catch (error) {
      if (isTransactionReplacedError(error)) {
        if (error.cancelled) {
          throw TransportError.fromError(error);
        }

        const transactionHash = expectTxHash(error.receipt.transactionHash);
        this.#transactionHash = transactionHash;

        return {
          transactionHash,
          transactionId: null,
        };
      }

      if (isCallExceptionError(error)) {
        throw new TransactionFailedError(
          `Transaction ${this.#transactionHash} reverted`,
          { cause: error },
        );
      }

      throw TransportError.fromError(error);
    }
  }
}
