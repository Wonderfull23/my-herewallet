import { HereProviderRequest, HereProviderResult, HereProviderStatus } from "@here-wallet/core";
import { NearSnap, NearSnapAccount, TransactionSignRejected } from "@near-snap/sdk";

import { NearAccount } from "../src/core/near-chain/NearAccount";
import { ConnectType } from "../src/core/types";
import { storage } from "../src/core/Storage";
import LedgerSigner from "./ledger";

const snap = new NearSnap();

const sendResponse = async (id: string, data: HereProviderResult) => {
  const res = await fetch(`https://h4n.app/${id}/response`, {
    body: JSON.stringify({ data: JSON.stringify(data) }),
    headers: { "content-type": "application/json" },
    method: "POST",
  });

  if (!res.ok) throw Error();
};

export const connectLedger = async (
  account: { id: string; type: ConnectType; path?: string },
  requestId: string,
  request: HereProviderRequest,
  onConnected: (is: boolean) => void,
  onSigned: () => void,
  onNeedActivate: (v: string) => void
) => {
  try {
    const creds = storage.getAccount(account.id);
    const path = creds?.path || account.path;
    const ledger = new LedgerSigner(path, onConnected, onSigned);

    if (request.type === "sign") {
      const { address, publicKey } = await ledger.getAddress();
      await sendResponse(requestId, {
        type: ConnectType.Ledger,
        status: HereProviderStatus.FAILED,
        public_key: publicKey.toString(),
        payload: publicKey.toString(),
        account_id: address,
      });
      window.close();
      return;
    }

    if (request.type === "call") {
      const { address, publicKey } = await ledger.getAddress();
      const creds = storage.getAccount(address);
      const account = new NearAccount(address, ConnectType.Ledger, ledger, creds?.jwt);
      const isAccess = await account.getAccessKeyInfo(address, publicKey).catch(() => null);

      if (!isAccess) {
        onNeedActivate(address);
        return;
      }

      const result = await account.sendLocalTransactions(request.transactions, true);
      await sendResponse(requestId, {
        type: ConnectType.Ledger,
        status: HereProviderStatus.SUCCESS,
        public_key: publicKey.toString(),
        payload: result.map((t) => t).join(","),
        account_id: address,
        path: path,
      });
    }
  } catch (e) {
    onConnected(false);
    throw e;
  }
};

export const connectMetamask = async (accountId: string, requestId: string, request: HereProviderRequest) => {
  try {
    await snap.install();
    await sendResponse(requestId, {
      status: HereProviderStatus.APPROVING,
      type: ConnectType.Snap,
    });

    if (request.type === "sign") {
      if (!("recipient" in request)) throw Error();
      const result = await snap.signMessage({
        network: (request.network as any) || "mainnet",
        recipient: request.recipient,
        message: request.message,
        nonce: request.nonce,
      });

      if (result == null) throw Error();
      await sendResponse(requestId, {
        type: ConnectType.Snap,
        status: HereProviderStatus.SUCCESS,
        public_key: result.publicKey,
        account_id: result.accountId,
        payload: JSON.stringify({
          signature: result.signature,
          accountId: result.accountId,
          publicKey: result.publicKey,
        }),
      });
    }

    if (request.type === "call") {
      await sendResponse(requestId, {
        type: ConnectType.Snap,
        status: HereProviderStatus.APPROVING,
      }).catch(() => {});

      const network = (request.network as any) || "mainnet";
      const account = await NearSnapAccount.restore({ snap, network }).catch(async () => {
        return await NearSnapAccount.connect({ snap, network });
      });

      if (account == null) throw Error();
      const trxs = request.transactions.map((t) => ({
        receiverId: t.receiverId || account.accountId,
        signerId: account.accountId,
        actions: t.actions,
      }));

      const result = await account.executeTransactions(trxs as any);
      await sendResponse(requestId, {
        status: HereProviderStatus.SUCCESS,
        payload: result.map((t) => t.transaction_outcome.id).join(","),
        public_key: account.publicKey?.toString(),
        account_id: account.accountId,
        type: ConnectType.Snap,
      });
    }
  } catch (e) {
    if (e instanceof TransactionSignRejected) throw e;
    window.close();
    throw e;
  }
};
