import Box, { Asset, RegisterInput } from './Box';
import { currentHeight, loadTokensFromWallet } from './helpers';
import { MIN_FEE, FEE_ADDRESS } from './constants';
import { wasmModule } from './ergolib';
import { UtxoBox } from './types';

type Funds = {
  ERG: number;
  tokens: Asset[];
};

type TxConfig = {
  funds: Funds;
  toAddress: string;
  changeAddress: string;
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
    for (const item of this.config) {
      if ((item as InputOutput).length) {
        this.inputs.push((item as InputOutput)[0]);
        this.outputs.push((item as InputOutput)[1]);
      } else if ((item as TxConfig).funds) {
        await this._sendFunds(item as TxConfig);
      }
    }

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

  async loadTokensFromWallet(): Promise<any> {
    return loadTokensFromWallet();
  }

  async currentHeight(): Promise<number> {
    return currentHeight();
  }

  private async _sendFunds(args: TxConfig) {
    wasmModule.loadAsync();
    const { funds, toAddress, additionalRegisters = {} } = args;

    funds.ERG = funds.ERG ? funds.ERG : funds.tokens.length ? MIN_FEE : 0;

    const optimalTxFee = MIN_FEE;
    const need = {
      ERG: funds.ERG + optimalTxFee,
      ...funds.tokens.reduce<Record<string, number>>((map, token) => {
        map[token.tokenId] = map[token.tokenId] || 0;
        map[token.tokenId] += token.amount;
        return map;
      }, {}),
    };
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

    const fundBox = new Box({
      value: funds.ERG,
      ergoTree: (await wasmModule.SigmaRust).Address.from_mainnet_str(toAddress)
        .to_ergo_tree()
        .to_base16_bytes(),
      assets: funds.tokens.map(t => ({ tokenId: t.tokenId, amount: t.amount })),
      additionalRegisters: {},
      creationHeight,
    }).setRegisters(additionalRegisters);

    const feeBox = new Box({
      value: optimalTxFee,
      creationHeight,
      ergoTree: FEE_ADDRESS,
      assets: [],
      additionalRegisters: {},
    });

    const changeBox = new Box({
      value: -have['ERG'],
      ergoTree: (await wasmModule.SigmaRust).Address.from_mainnet_str(args.changeAddress)
        .to_ergo_tree()
        .to_base16_bytes(),
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
    this.outputs.push(...[fundBox, changeBox, feeBox].filter(box => box.value > 0));
    this.dataInputs = [];
    this.fee = optimalTxFee;

    return this;
  }
}
