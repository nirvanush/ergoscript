import { ERG_TOKEN_ID } from '../constants/ergo';
import { ErgoBox } from '../types/connector';
import { explorerBoxMapper } from '../types/explorer';
import { isEmpty, sortBy } from 'lodash';

import { explorerService } from '../explorer/explorerService';

export async function fetchBoxes(
  addresses: [string],
  options: { tokenId?: string; useAllAddressesAsFallback: boolean; includeUnconfirmed: boolean } = {
    tokenId: ERG_TOKEN_ID,
    useAllAddressesAsFallback: true,
    includeUnconfirmed: true,
  }
): Promise<ErgoBox[]> {
  const boxes = await fetchBoxesFromExplorer(addresses);

  return sortBy(boxes, x => x.creationHeight).reverse();
}

async function fetchBoxesFromExplorer(addresses: string[]): Promise<ErgoBox[]> {
  if (isEmpty(addresses)) {
    return [];
  }

  const boxes = await explorerService.getUnspentBoxes(addresses);
  return boxes
    .map(a => a.data)
    .flat()
    .map(explorerBoxMapper({ asConfirmed: true }));
}
