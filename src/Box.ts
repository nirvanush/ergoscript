import { encodeNum, encodeHex } from './serializer';
import _ from 'lodash';
import { Address } from '@coinbarn/ergo-ts';

export enum SigmaType {
  Long = 'Long',
  CollByte = 'Coll[Byte]',
  Int = 'Int',
  Raw = 'Raw',
}

export type SerializedRegister = {
  serializedValue: string;
  sigmaType: string;
  renderedValue: string;
};

export type RegisterInput = {
  value: any;
  type: SigmaType;
};

export type AdditionalRegisters = {
  R4?: SerializedRegister;
  R5?: SerializedRegister;
  R6?: SerializedRegister;
  R7?: SerializedRegister;
  R8?: SerializedRegister;
  R9?: SerializedRegister;
};

export type Asset = {
  tokenId: string;
  index?: number;
  amount: number;
  name?: string;
  decimals?: number;
  type?: string;
};

export type ExplorerBox = {
  additionalRegisters: AdditionalRegisters;
  value: number;
  creationHeight: number;
  ergoTree: string;
  assets: Asset[];
  boxId?: string;
  transactionId?: string;
  blockId?: string;
  extension?: {};
};

export type TypeGetters = {
  get: string;
  isDefined: boolean;
};

export class Register {
  Long: TypeGetters;
  ['Coll[Byte]']: TypeGetters;
  register?: SerializedRegister;

  constructor(register?: SerializedRegister) {
    this.register = _.cloneDeep(register);
    this.Long = this._buildRegister();
    this['Coll[Byte]'] = this._buildRegister();
  }

  set(value: any, type: SigmaType): this {
    this.register = this.register || { renderedValue: '', sigmaType: '', serializedValue: '' };
    this.register.renderedValue = value;
    this.register.sigmaType = `S${type}`;

    switch (type) {
      case SigmaType.Long:
        this.register.serializedValue = encodeNum(value.toString());
        break;

      case SigmaType.CollByte:
        this.register.serializedValue = encodeHex(value);
        break;
      case SigmaType.Raw:
        this.register.serializedValue = value;
        break;
    }

    this.Long = this._buildRegister();
    this['Coll[Byte]'] = this._buildRegister();

    return this;
  }

  private _buildRegister() {
    const register = this.register;
    return {
      get get() {
        if (!register?.renderedValue) throw new Error('Calling get of undefined');
        return register?.renderedValue;
      },
      isDefined: !!register?.renderedValue,
      getOrElse: (defaultValue: any) => {
        register?.renderedValue ? register.renderedValue : defaultValue;
      },
    };
  }
}

export default class Box {
  boxJson: ExplorerBox;
  additionalRegisters: AdditionalRegisters;
  R4: Register;
  R5: Register;
  R6: Register;
  R7: Register;
  R8: Register;
  R9: Register;
  value: number;
  propositionBytes: string;
  assets: Asset[];

  constructor(boxJson: ExplorerBox) {
    this.boxJson = _.cloneDeep(boxJson);
    this.additionalRegisters = this.boxJson.additionalRegisters;
    this.value = this.boxJson.value;
    this.assets = this.boxJson.assets;
    this.propositionBytes = this.boxJson.ergoTree;

    const reg = this.boxJson.additionalRegisters;
    this.R4 = new Register(reg['R4']);
    this.R5 = new Register(reg['R5']);
    this.R6 = new Register(reg['R6']);
    this.R7 = new Register(reg['R7']);
    this.R8 = new Register(reg['R8']);
    this.R9 = new Register(reg['R9']);
  }

  toJSON(): {
    additionalRegisters: any;
    value: string;
    extension: {};
    creationHeight: number;
    ergoTree: string;
    assets: Asset[];
    boxId?: string | undefined;
    transactionId?: string | undefined;
    blockId?: string | undefined;
  } {
    const additionalRegisters: any = {};
    if (this.R4.register) additionalRegisters.R4 = this.R4.register.serializedValue;
    if (this.R5.register) additionalRegisters.R5 = this.R5.register.serializedValue;
    if (this.R6.register) additionalRegisters.R6 = this.R6.register.serializedValue;
    if (this.R7.register) additionalRegisters.R7 = this.R7.register.serializedValue;
    if (this.R8.register) additionalRegisters.R8 = this.R8.register.serializedValue;
    if (this.R9.register) additionalRegisters.R9 = this.R9.register.serializedValue;

    return {
      ...this.boxJson,
      additionalRegisters,
      value: this.value.toString(),
      extension: {},
    };
  }

  sendTo(address: string): Box {
    const newInstance = new Box(this._serialize());
    newInstance.boxJson.ergoTree = new Address(address).ergoTree;

    return newInstance;
  }

  setRegisters(args: {
    R4?: RegisterInput;
    R5?: RegisterInput;
    R6?: RegisterInput;
    R7?: RegisterInput;
    R8?: RegisterInput;
    R9?: RegisterInput;
  }): Box {
    const newInstance = new Box(this._serialize());

    args.R4 && newInstance.R4.set(args.R4.value, args.R4.type);
    args.R5 && newInstance.R5.set(args.R5.value, args.R5.type);
    args.R6 && newInstance.R6.set(args.R6.value, args.R6.type);
    args.R7 && newInstance.R7.set(args.R7.value, args.R7.type);
    args.R8 && newInstance.R8.set(args.R8.value, args.R8.type);
    args.R9 && newInstance.R9.set(args.R9.value, args.R9.type);

    return newInstance;
  }

  resetRegisters(): Box {
    const newInstance = new Box(this._serialize());
    newInstance.R4 = new Register();
    newInstance.R5 = new Register();
    newInstance.R6 = new Register();
    newInstance.R7 = new Register();
    newInstance.R8 = new Register();
    newInstance.R9 = new Register();

    return newInstance;
  }

  _serialize(): ExplorerBox {
    const additionalRegisters = this._serializeRegisters();

    return {
      additionalRegisters,
      ..._.omit(this.boxJson, ['additionalRegisters']),
    };
  }

  private _serializeRegisters(): AdditionalRegisters {
    const additionalRegisters: AdditionalRegisters = {};

    if (this.R4.register) {
      additionalRegisters.R4 = this.R4.register;
    }

    if (this.R5.register) {
      additionalRegisters.R5 = this.R5.register;
    }

    if (this.R6.register) {
      additionalRegisters.R6 = this.R6.register;
    }

    if (this.R7.register) {
      additionalRegisters.R7 = this.R7.register;
    }

    if (this.R8.register) {
      additionalRegisters.R8 = this.R8.register;
    }

    if (this.R9.register) {
      additionalRegisters.R9 = this.R9.register;
    }

    return additionalRegisters;
  }
}
