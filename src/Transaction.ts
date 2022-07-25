import Box, { Asset, RegisterInput } from './Box';
import { changeSplit, currentHeight, loadTokensFromWallet } from './helpers';
import { MIN_FEE, FEE_ADDRESS } from './constants';
import { wasmModule } from './ergolib';
import { Address } from '@coinbarn/ergo-ts';
import { ErgoWallet, UtxoBox } from './types';
import { ErgoBox, Token } from './wallet/types/connector';

type Funds = {
  ERG: number;
  tokens: Asset[];
};

type TxConfig = {
  funds: Funds;
  toAddress: string;
  changeAddress?: string;
  additionalRegisters: {
    R4?: RegisterInput;
    R5?: RegisterInput;
    R6?: RegisterInput;
    R7?: RegisterInput;
    R8?: RegisterInput;
    R9?: RegisterInput;
  };
};

export type TransactionJson = {
  inputs: {
    additionalRegisters: any;
    value: string;
    extension: {};
    creationHeight: number;
    ergoTree: string;
    assets: Asset[];
    boxId?: string | undefined;
    transactionId?: string | undefined;
    blockId?: string | undefined;
  }[];
  outputs: {
    additionalRegisters: any;
    value: string;
    extension: {};
    creationHeight: number;
    ergoTree: string;
    assets: Asset[];
    boxId?: string | undefined;
    transactionId?: string | undefined;
    blockId?: string | undefined;
  }[];
  fee: string;
  dataInputs: [];
};

type InputOutput = [Box, Box];

export default class Transaction {
  inputs: Box[];
  outputs: Box[];
  fee: number;
  dataInputs: [];
  config: (InputOutput | TxConfig)[];
  wallet: ErgoWallet | undefined;
  chainedInputs: ErgoBox[] | undefined;

  constructor(
    config: (InputOutput | TxConfig)[],
    params?: {
      wallet?: ErgoWallet;
      chainedInputs?: ErgoBox[];
    }
  ) {
    this.inputs = [];
    this.outputs = [];
    this.fee = MIN_FEE;
    this.dataInputs = [];
    this.config = config;
    this.wallet = params?.wallet;
    this.chainedInputs = params?.chainedInputs;
  }

  async build(): Promise<this> {
    const recipients: TxConfig[] = [];

    for (const item of this.config) {
      if ((item as InputOutput).length) {
        this.inputs.push((item as InputOutput)[0]);
        this.outputs.push((item as InputOutput)[1]);
      } else if ((item as TxConfig).funds) {
        recipients.push(item as TxConfig);
      }
    }

    await this._sendFunds(recipients);
    return this;
  }

  toJSON(): TransactionJson {
    const tx = {
      inputs: this.inputs.map(box => box.toJSON()),
      outputs: this.outputs.map(box => box.toJSON()),
      fee: this.fee.toString(),
      dataInputs: this.dataInputs,
    };

    return tx;
  }

  async get_utxos(amount: string, tokenId: string): Promise<ErgoBox[] | UtxoBox[]> {
    const wallet = this.wallet || ergo;

    if (this.chainedInputs && (wallet as ErgoWallet)) {
      return await wallet.get_utxos(amount, tokenId, this.chainedInputs as ErgoBox[]);
    } else {
      return (await (this.wallet || ergo).get_utxos(amount, tokenId)) as ErgoBox[];
    }
  }

  async get_change_address() {
    return (this.wallet || ergo).get_change_address();
  }

  async loadTokensFromWallet(): Promise<any> {
    return loadTokensFromWallet(this.wallet || ergo);
  }

  async currentHeight(): Promise<number> {
    return currentHeight();
  }

  private _sumFunds(recipients: TxConfig[]) {
    const optimalTxFee = MIN_FEE;

    const sumFunds = { ERG: optimalTxFee, tokens: [] as Asset[] };

    recipients.forEach(config => {
      const { funds } = config;
      const erg = funds.ERG ? funds.ERG : funds.tokens.length ? MIN_FEE : 0;

      sumFunds.ERG += erg;

      for (const t of funds.tokens) {
        // only sum tokens that are not newly created
        if (!t.isMint) {
          sumFunds.tokens.push(t);
        }
      }
    });

    const need = {
      ERG: sumFunds.ERG,
      ...sumFunds.tokens.reduce<Record<string, number>>((map, token) => {
        map[token.tokenId] = map[token.tokenId] || 0;
        map[token.tokenId] += token.amount;
        return map;
      }, {}),
    };

    return need;
  }

  private async _sendFunds(recipients: TxConfig[]) {
    wasmModule.loadAsync();

    const optimalTxFee = MIN_FEE;
    const need = this._sumFunds(recipients);
    const creationHeight = await this.currentHeight();
    const have = JSON.parse(JSON.stringify(need));

    let boxes: any[] = [];

    const keys = Object.keys(have);
    const totalBalance = await this.loadTokensFromWallet();

    if (
      keys
        .filter(key => key !== 'ERG')
        .filter(
          key => !Object.keys(totalBalance).includes(key) || totalBalance[key].amount < have[key]
        ).length > 0
    ) {
      throw Error('Not enough balance in the wallet!');
    }

    for (let i = 0; i < keys.length; i++) {
      if (have[keys[i]] <= 0) continue;
      const boxesToSpend = await this.get_utxos(have[keys[i]].toString(), keys[i]);

      if (boxesToSpend !== undefined) {
        boxesToSpend.forEach((bx: any) => {
          have['ERG'] -= parseInt(bx.value.toString());
          bx.assets.forEach((asset: Token) => {
            if (!Object.keys(have).includes(asset.tokenId)) have[asset.tokenId] = 0;
            have[asset.tokenId] -= parseInt(asset.amount.toString());
          });
        });
        boxes = boxes.concat(boxesToSpend);
      }
    }

    if (keys.filter(key => have[key] > 0).length > 0) {
      throw Error('Not enough balance in the wallet!');
    }

    const fundBoxes = recipients.map(config => {
      const { additionalRegisters, funds, toAddress } = config;
      return new Box({
        value: funds.ERG ? funds.ERG : funds.tokens.length ? MIN_FEE : 0,
        ergoTree: new Address(toAddress).ergoTree,
        assets: funds.tokens.map(t => {
          t.tokenId = t.tokenId.length ? t.tokenId : boxes[0].boxId;
          return { tokenId: t.tokenId, amount: t.amount };
        }),
        additionalRegisters: {},
        creationHeight,
      }).setRegisters(additionalRegisters);
    });

    const feeBox = new Box({
      value: optimalTxFee,
      creationHeight,
      ergoTree: FEE_ADDRESS,
      assets: [],
      additionalRegisters: {},
    });

    const changeBox = new Box({
      value: -have['ERG'],
      ergoTree: new Address(await this.get_change_address()).ergoTree,
      assets: Object.keys(have)
        .filter(key => key !== 'ERG')
        .filter(key => have[key] < 0)
        .map(key => {
          return {
            tokenId: key,
            amount: -have[key],
          };
        }),
      additionalRegisters: this.chainedInputs ? this.chainedInputs[0].additionalRegisters : {},
      creationHeight,
    });

    const inputs = boxes.map(box => {
      return new Box({
        ...box,
        extension: {},
      });
    });

    this.inputs.push(...inputs);
    this.outputs.push(
      ...[...fundBoxes, ...changeSplit(changeBox), feeBox].filter(box => box.value > 0)
    );
    debugger;
    this.dataInputs = [];
    this.fee = optimalTxFee;

    return this;
  }
}
