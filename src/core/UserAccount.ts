import { makeObservable, observable, runInAction } from "mobx";
import { PublicKey } from "near-api-js/lib/utils";
import { NearSnapStatus } from "@near-snap/sdk";

import { Storage, storage } from "./Storage";
import { HereApi } from "./network/api";
import { NearAccount } from "./near-chain/NearAccount";
import { TokensStorage } from "./token/TokensStorage";
import { TransactionsStorage } from "./transactions";
import { NFTModel, RecentlyApps, UserContact, UserData } from "./network/types";
import { accounts } from "./Accounts";
import { Chain } from "./token/types";
import { recaptchaToken, wait } from "./helpers";
import { notify } from "./toast";
import { ConnectType, TransferParams, UserCred } from "./types";
import { Signer } from "near-api-js";
import { Signature } from "near-api-js/lib/utils/key_pair";

class UserAccount {
  readonly api: HereApi;
  readonly tokens: TokensStorage;
  readonly near: NearAccount;
  readonly transactions: TransactionsStorage;
  readonly localStorage: Storage;

  readonly path?: string;
  readonly type: ConnectType;
  readonly id: string;

  public nfts: NFTModel[] = [];
  public recentlyApps: RecentlyApps[] = [];
  public contacts: UserContact[] = [];
  public user: UserData = {
    can_bind_referral: false,
    phone_linked: false,
    abtests: [],
    id: "0",
  };

  constructor(creds: UserCred) {
    makeObservable(this, {
      user: observable,
      nfts: observable,
      contacts: observable,
      recentlyApps: observable,
    });

    this.id = creds.accountId;
    this.type = creds.type;
    this.path = creds.path;

    this.api = new HereApi(creds.jwt);
    this.localStorage = new Storage(creds.accountId);

    this.tokens = new TokensStorage(this);
    this.transactions = new TransactionsStorage(this);

    const signer = new HereSigner(creds.accountId);
    this.near = new NearAccount(creds.accountId, this.type, signer, creds.jwt);

    this.transactions.refresh().catch(() => {});
    this.tokens.refreshTokens().catch(() => {});
    this.loadRecentlyApps().catch(() => {});
    this.fetchUser().catch(() => {});

    wait(100).then(async () => {
      if (this.near.type !== ConnectType.Snap) return;

      const status = await accounts.snap.getStatus();
      if (status !== NearSnapStatus.INSTALLED) await accounts.snap.install();

      const acc = await accounts.snap.getAccount("mainnet").catch(() => accounts.snap.connect({ network: "mainnet" }));
      if (acc?.accountId !== this.near.accountId || acc?.publicKey !== (await this.near.getPublicKey()).toString()) {
        notify("The address does not match, please re-login to your account");
        accounts.disconnect(this.near.accountId);
        return;
      }
    });
  }

  async bindNickname(nickname: string) {
    const api = new HereApi();
    const captcha = await recaptchaToken();
    await api.allocateNickname({
      device_id: "metamask",
      public_key: (await this.near.getPublicKey()).toString(),
      recapcha_response: captcha,
      near_account_id: nickname,
      sign: "",
    });

    accounts.disconnect(this.near.accountId);
    notify("The nickname was successfully created. Attach it to your account and re-login to your wallet.", 4500);
    await accounts.connectSnap();
  }

  async isNeedActivate() {
    if (this.near.type !== ConnectType.Snap) return false;
    return this.near
      .getAccessKeyInfo(this.near.accountId, await this.near.getPublicKey())
      .then(() => false)
      .catch(() => true);
  }

  async fetchUser() {
    const user = await this.api.getUser();
    runInAction(() => (this.user = user));
  }

  async fetchNfts() {
    try {
      runInAction(() => (this.nfts = JSON.parse(this.localStorage.get("nfts")!)));
    } catch {}

    const nfts = await this.api.getNfts();
    this.localStorage.set("nfts", JSON.stringify(nfts));
    runInAction(() => (this.nfts = nfts));
  }

  async loadRecentlyApps() {
    const apps = await this.api.getRecentlyApps();
    runInAction(() => (this.recentlyApps = apps));
  }

  async loadContacts() {
    const contacts = await this.api.getContacts();
    runInAction(() => (this.contacts = contacts));
  }

  bindComment(tx: string, comment?: string) {
    if (!comment) return;
    void this.transactions.bindComment(tx, comment);
  }

  async transfer({ receiver, amount, token, comment }: TransferParams) {
    const ft = this.tokens.tokens[token];
    if (ft == null) throw Error("Unknown token for transfer");

    if (ft.chain === Chain.NEAR || ft.chain === Chain.NEAR_TESTNET) {
      const hash = await this.near.transfer(ft, amount, receiver);
      this.bindComment(hash, comment);
      return hash;
    }
  }

  get isProduction() {
    return true;
  }
}

class HereSigner extends Signer {
  constructor(readonly id: string) {
    super();
  }

  createKey(): Promise<PublicKey> {
    throw Error("");
  }

  async getPublicKey(): Promise<PublicKey> {
    const acc = storage.getAccount(this.id);
    if (!acc) throw Error();
    return PublicKey.fromString(acc.publicKey);
  }

  signMessage(): Promise<Signature> {
    throw Error();
  }
}

export default UserAccount;
