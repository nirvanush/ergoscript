import { AssetStandard, AssetSubtype, AssetType } from '../types/internal';

export interface IAssetInfo {
  id: string;
  mintingBoxId: string;
  mintingTransactionId?: string;
  name?: string;
  decimals?: number;
  standard?: AssetStandard;
  type: AssetType;
  subtype?: AssetSubtype;
  emissionAmount?: string;
  description?: string;
  artworkUrl?: string;
  artworkCover?: string;
  artworkHash?: string;
}
