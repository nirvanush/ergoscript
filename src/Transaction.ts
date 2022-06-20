import Box, { Asset, RegisterInput } from './Box';
import { currentHeight, loadTokensFromWallet } from './helpers';
import { MIN_FEE, FEE_ADDRESS } from './constants';
import { wasmModule } from './ergolib';
import { UtxoBox } from './types';
import { Address } from '@coinbarn/ergo-ts';

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

  constructor(config: (InputOutput | TxConfig)[]) {
    this.inputs = [];
    this.outputs = [];
    this.fee = MIN_FEE;
    this.dataInputs = [];
    this.config = config;
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

  async get_utxos(amount: string, tokenId: string): Promise<UtxoBox[]> {
    return ergo.get_utxos(amount, tokenId);
  }

  async get_change_address() {
    return ergo.get_change_address();
  }

  async loadTokensFromWallet(): Promise<any> {
    return loadTokensFromWallet();
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
      sumFunds.tokens.push(...funds.tokens);
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
        boxesToSpend.forEach(bx => {
          have['ERG'] -= parseInt(bx.value.toString());
          bx.assets.forEach(asset => {
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
        assets: funds.tokens.map(t => ({ tokenId: t.tokenId, amount: t.amount })),
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
      additionalRegisters: {},
      creationHeight,
    });

    const inputs = boxes.map(box => {
      return new Box({
        ...box,
        extension: {},
      });
    });

    this.inputs.push(...inputs);
    this.outputs.push(...[...fundBoxes, changeBox, feeBox].filter(box => box.value > 0));
    this.dataInputs = [];
    this.fee = optimalTxFee;

    return this;
  }
}
