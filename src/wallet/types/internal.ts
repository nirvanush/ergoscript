import BigNumber from 'bignumber.js';

export enum AddressState {
  Used,
  Unused,
}

export enum WalletType {
  Standard,
  ReadOnly,
  Ledger,
}

export enum Network {
  ErgoMainet,
  ErgoTestnet,
}

export enum AddressType {
  P2PK,
  P2SH,
  P2S,
}

export enum AssetStandard {
  Native = 'Native',
  EIP4 = 'EIP-004',
  Unstandardized = 'Unstandardized',
}

export enum AssetType {
  Unknown = '00',
  NFT = '01',
  MembershipToken = '02',
}

export enum AssetSubtype {
  PictureArtwork = '0101',
  AudioArtwork = '0102',
  VideoArtwork = '0103',
  ThresholdSignature = '0201',
}

export type StateAddress = {
  script: string;
  state: AddressState;
  index: number;
  balance?: StateAsset[];
};

export type WalletSettings = {
  avoidAddressReuse: boolean;
  hideUsedAddresses: boolean;
  defaultChangeIndex: number;
};

export type StateWallet = {
  id: number;
  name: string;
  type: WalletType;
  publicKey: string;
  extendedPublicKey: string;
  addresses?: AddressType[];
  settings: WalletSettings;
};

export type StateAsset = {
  tokenId: string;
  confirmedAmount: BigNumber;
  unconfirmedAmount?: BigNumber;
  info?: BasicAssetInfo;
};

export type BasicAssetInfo = {
  name?: string;
  decimals?: number;
  type?: AssetSubtype;
  artworkUrl?: string;
};

export type StateAssetInfo = {
  [tokenId: string]: BasicAssetInfo;
};
