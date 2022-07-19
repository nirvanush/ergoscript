import BigNumber from 'bignumber.js';
import { find, findIndex } from 'lodash';
import { ERG_TOKEN_ID } from './constants/ergo';
import { fetchBoxes } from './ergo/boxFetcher';
import { ErgoBox, UnsignedTx, ErgoTx } from './types/connector';
import { toBigNumber } from './utils/bigNumbers';
import JSONBig from 'json-bigint';

import { explorerService } from './explorer/explorerService';
import { ExplorerBlockHeaderResponse } from './types/explorer';

import {
  BlockHeaders,
  DerivationPath,
  ErgoBoxes,
  ErgoStateContext,
  ExtSecretKey,
  Mnemonic,
  PreHeader,
  SecretKey,
  SecretKeys,
  UnsignedTransaction,
  Wallet,
} from 'ergo-lib-wasm-nodejs';

export default class ErgoWallet {
  private wallet!: Wallet;
  private blockContext!: ExplorerBlockHeaderResponse[];

  publicAddress: string;

  constructor() {
    this.publicAddress = '';
  }

  async fromMnemonics(mnemonics: string): Promise<ErgoWallet> {
    this.blockContext = await explorerService.getBlockHeaders({ limit: 10 });
    this.wallet = await createWallet(mnemonics, this.blockContext);

    return this;
  }

  setPublicAddress(publicAddress: string) {
    this.publicAddress = publicAddress;
  }

  async get_change_address(): Promise<string> {
    return this.publicAddress;
  }

  async get_used_addresses(): Promise<string[]> {
    return [this.publicAddress];
  }

  async get_unused_addresses(): Promise<string[]> {
    return [];
  }

  async get_balance() {
    throw Error('not implemented yet');
  }

  sign_tx(unsignedTx: UnsignedTx): string {
    const unspentBoxes = ErgoBoxes.from_boxes_json(unsignedTx.inputs);
    const dataInputBoxes = ErgoBoxes.from_boxes_json(unsignedTx.dataInputs);
    const tx = UnsignedTransaction.from_json(JSONBig.stringify(unsignedTx));
    const signed = this._sign(tx, unspentBoxes, dataInputBoxes);

    return signed.to_json();
  }

  async submit_tx(signedTx: ErgoTx): Promise<string> {
    const txResponse = await explorerService.sendTx(signedTx);

    return txResponse.id;
  }

  async get_utxos(amount: string, tokenId: string = ERG_TOKEN_ID) {
    let iTokenId = ERG_TOKEN_ID;
    let iAmount = new BigNumber(0);

    if (arguments) {
      iTokenId = arguments[1] as string;

      if (!iTokenId || iTokenId === 'ERG') {
        iTokenId = ERG_TOKEN_ID;
      }

      if (arguments[0]) {
        iAmount = toBigNumber(arguments[0]) || new BigNumber(0);
      }
    }

    let selected = await fetchBoxes([this.publicAddress]);

    if (iTokenId != ERG_TOKEN_ID) {
      selected = selected.filter(
        (box: ErgoBox) => findIndex(box.assets, a => a.tokenId === tokenId) > -1
      );
    }

    if (!iAmount.isZero()) {
      let acc = new BigNumber(0);

      if (iTokenId === ERG_TOKEN_ID) {
        selected = selected.filter((box: ErgoBox) => {
          if (acc.isGreaterThanOrEqualTo(iAmount)) {
            return false;
          }

          acc = acc.plus(toBigNumber(box.value)!);

          return true;
        });
      } else {
        selected = selected.filter((box: ErgoBox) => {
          if (acc.isGreaterThanOrEqualTo(iAmount)) {
            return false;
          }

          acc = acc.plus(toBigNumber(find(box.assets, a => a.tokenId === tokenId)?.amount ?? 0)!);

          return true;
        });
      }
    }

    return selected;
  }

  private _sign(unsigned: UnsignedTransaction, unspentBoxes: ErgoBoxes, dataInputBoxes: ErgoBoxes) {
    const blockHeaders = BlockHeaders.from_json(this.blockContext);
    const preHeader = PreHeader.from_block_header(blockHeaders.get(0));
    const signContext = new ErgoStateContext(preHeader, blockHeaders);
    const signed = this.wallet.sign_transaction(
      signContext,
      unsigned,
      unspentBoxes,
      dataInputBoxes
    );
    return signed;
  }
}

async function createWallet(mnemonics: string, blockContext: ExplorerBlockHeaderResponse[]) {
  const seed = Mnemonic.to_seed(
    // "prevent hair cousin critic embrace okay burger choice pilot rice sure clerk absurd patrol tent",
    mnemonics,
    ''
  );

  // derive the root extended key/secret
  const extendedSecretKey = ExtSecretKey.derive_master(seed);
  // derive the initial secret key, this is the change key and is also the owner of the boxes used as inputs
  const changePath = DerivationPath.from_string("m/44'/429'/0'/0/0");
  const changeSk = extendedSecretKey.derive(changePath);

  // const baseAddress = extendedSecretKey.public_key().to_address();

  const blockHeaders = BlockHeaders.from_json(blockContext);
  const preHeader = PreHeader.from_block_header(blockHeaders.get(0));
  // const stateCtx = new ErgoStateContext(preHeader, blockHeaders);

  const dlogSecret = SecretKey.dlog_from_bytes(changeSk.secret_key_bytes());
  const secretKeys = new SecretKeys();
  secretKeys.add(dlogSecret);

  const wallet = Wallet.from_secrets(secretKeys);

  return wallet;
}
