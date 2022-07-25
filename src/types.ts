import { TransactionJson } from './Transaction';
import { ErgoBox, ErgoTx } from './wallet/types/connector';

export type Asset = {
  tokenId: string;
  amount: number;
  decimals?: number;
  name?: string;
  tokenType?: string;
};

export type UtxoBoxAsset = Omit<Asset, 'amount'> & { amount: string };

export type UtxoBox = {
  boxId: string;
  value: string;
  ergoTree: string;
  assets: UtxoBoxAsset[];
  creationHeight: number;
  transactionId: string;
  index: number;
  additionalRegisters: any;
  confirmed?: boolean;
};

export interface ErgoWallet {
  fromMnemonics: (mnemonics: string) => Promise<ErgoWallet>;
  setPublicAddress: (publicAddress: string) => Promise<string>;
  get_change_address: () => Promise<string>;
  get_used_addresses: () => Promise<string[]>;
  get_unused_addresses: () => Promise<string[]>;
  sign_tx: (tx: TransactionJson) => Promise<any>;
  submit_tx: (tx: ErgoTx) => Promise<string>;
  get_utxos: (amount: string, tokenId: string, chainedInputs?: ErgoBox[]) => Promise<ErgoBox[]>;
}

declare global {
  interface Ergo {
    get_utxos: (a: string, b: string) => Promise<UtxoBox[]>;
    get_change_address: () => Promise<string>;
    get_used_addresses: () => Promise<string[]>;
    get_unused_addresses: () => Promise<string[]>;
    sign_tx: (tx: TransactionJson) => Promise<any>;
    submit_tx: (tx: ErgoTx) => Promise<string>;
  }

  interface ergoConnector {
    nautilus: {
      connect: () => Promise<null>;
    };
  }

  const ergo: Ergo;
  const ergoConnector: ergoConnector;

  const ergo_request_read_access: () => Promise<null>;
  const ergo_check_read_access: () => Promise<null>;

  interface Window {
    ergo: Ergo;
    ergo_request_read_access: () => Promise<null>;
    ergo_check_read_access: () => Promise<null>;
  }
}

export type OptionalBlock = {
  height: number;
};

export type AddressItem = {
  amount: string;
  address: string;
};

export type Balance = {
  nanoErgs: number;
  tokens: Asset[];
};

export type dataInputsType = {
  R4?: string | Uint8Array;
  R5?: string | Uint8Array;
  R6?: string | Uint8Array;
  R7?: string | Uint8Array;
  R8?: string | Uint8Array;
  R9?: string | Uint8Array;
};
