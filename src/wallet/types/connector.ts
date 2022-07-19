export type Token = {
  tokenId: string;
  amount: bigint | string;
  name?: string;
  decimals?: number;
};

export type Registers = { [key: string]: string };

export type UnsignedInput = {
  boxId: string;
  transactionId: string;
  index: number;
  ergoTree: string;
  creationHeight: number;
  value: number | string;
  assets: Token[];
  additionalRegisters: Registers;
  spentTransactionId: null | string;
  mainChain: boolean;
  extension: { [key: string]: string };
};

export type ErgoBoxCandidate = {
  value: number | string;
  ergoTree: string;
  creationHeight: number;
  assets: Token[];
  additionalRegisters: Registers;
};

export type ErgoBox = {
  boxId: string;
  transactionId: string;
  index: number;
  ergoTree: string;
  creationHeight: number;
  value: bigint | string;
  assets: Token[];
  additionalRegisters: Registers;
  confirmed: boolean;
};

export type DataInput = {
  boxId: string;
};

export type UnsignedTx = {
  inputs: UnsignedInput[];
  dataInputs: DataInput[] | UnsignedInput[];
  outputs: ErgoBoxCandidate[];
};

export type Input = {
  readonly boxId: string;
  readonly spendingProof: string;
};

export type ErgoTx = {
  readonly id: string;
  readonly inputs: Input[];
  readonly dataInputs: DataInput[];
  readonly outputs: ErgoBox[];
  readonly size: number;
};
