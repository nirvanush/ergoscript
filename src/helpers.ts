import { Asset, Balance } from './types';
import request from 'superagent';

export async function currentHeight(): Promise<any> {
  return await request
    .get('https://api.ergoplatform.com/api/v0/blocks?limit=1')
    .then((res: any) => res.body.items[0].height);
}

interface Dic {
  [key: string]: Asset;
}

export async function getBalance(addr: string): Promise<Balance> {
  return await fetch(
    `https://api.ergoplatform.com/api/v1/addresses/${addr}/balance/confirmed`
  ).then(res => res.json());
}

export async function loadTokensFromWallet(): Promise<Dic> {
  const addresses: string[] = (await ergo.get_used_addresses()).concat(
    await ergo.get_unused_addresses()
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
