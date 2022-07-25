import { expect } from 'chai';
import { manyTokens, utxos } from './jsons/utxos';
import { changeSplit } from '../src/helpers';
import Box, { ExplorerBox } from '../src/Box';

describe('changeSplit', () => {
  it('changeSplit', async () => {
    const boxes = changeSplit(new Box(manyTokens[0]));
    console.log(boxes);
    expect(boxes.length).to.eq(4);
    expect(boxes[3].assets.length).to.equal(manyTokens[0].assets.length % 6);
  });
});
