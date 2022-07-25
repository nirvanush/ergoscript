import axios from 'axios';
import { Asset, Balance, ErgoWallet, UtxoBox } from './types';
import { explorerService } from './wallet/explorer/explorerService';
import { API_URL } from './wallet/constants/explorer';
import Box from './Box';
import { MIN_FEE } from './constants';

export async function currentHeight(): Promise<any> {
  const resp = await explorerService.getBlockHeaders({ limit: 1 });
  return resp[0].height;
}

interface Dic {
  [key: string]: Asset;
}

export async function getBalance(addr: string): Promise<Balance> {
  await explorerService.getAddressBalance(addr);
  return await axios
    .get(`${API_URL}/api/v1/addresses/${addr}/balance/confirmed`)
    .then(response => response.data);
}

export async function loadTokensFromWallet(wallet: ErgoWallet | Ergo): Promise<Dic> {
  const addresses: string[] = (await wallet.get_used_addresses()).concat(
    await wallet.get_unused_addresses()
  );
  const tokens: Dic = {};

  for (let i = 0; i < addresses.length; i++) {
    const balance: Balance = await getBalance(addresses[i]);
    balance.tokens.forEach((asset: Asset) => {
      if (!Object.keys(tokens).includes(asset.tokenId))
        tokens[asset.tokenId] = {
          amount: 0,
          name: asset.name,
          tokenId: asset.tokenId,
        };
      tokens[asset.tokenId].amount += asset.amount;
    });
  }

  return tokens;
}

export function isDappConnectorInstalled(): boolean {
  return typeof ergo_request_read_access === 'function';
}

export async function isWalletAccessibleForRead(): Promise<null> {
  return await ergo_check_read_access();
}

export async function requestWalletReadAcess(): Promise<null> {
  return await ergo_request_read_access();
}

export function changeSplit(box: Box): Box[] {
  const splitted: Box[] = [];
  let remindingValue = box.value;

  if (box.assets.length > 7) {
    const size = 6;
    const arrayOfArrays = [];

    for (let offset = 0; offset < box.assets.length; offset += size) {
      arrayOfArrays.push(box.assets.slice(offset, offset + size));
    }

    arrayOfArrays.forEach((assetGroup, indx) => {
      const substitutedValue = indx === arrayOfArrays.length - 1 ? remindingValue : MIN_FEE;
      splitted.push(
        new Box({
          value: substitutedValue,
          ergoTree: box.boxJson.ergoTree,
          assets: assetGroup,
          additionalRegisters: {},
          creationHeight: box.boxJson.creationHeight,
        })
      );

      remindingValue -= substitutedValue;
    });
    debugger;
    splitted[splitted.length - 1].value += remindingValue;
  } else {
    splitted.push(box);
  }

  return splitted;
}
