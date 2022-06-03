import { expect } from 'chai';
import explorerBox from './jsons/explorer-locked-box';
import Box, { SigmaType } from '../src/Box';

const Long = 'Long';

describe('Box Builder', () => {
  describe('get/isDefined', () => {
    it('configure get/isDefined', () => {
      const box = new Box(explorerBox);
      expect(box.R4[Long].get).to.equal(explorerBox.additionalRegisters.R4.renderedValue);
      expect(box.R4[Long].isDefined).to.equal(true);

      try {
        box.R8[Long].get;
      } catch (e) {
        expect((e as Error).message).to.equal('Calling get of undefined');
      }

      expect(box.R8[Long].isDefined).to.equal(false);
    });
  });

  describe('set', () => {
    it('should set the value', async () => {
      const box = new Box(explorerBox);
      expect(box.R4[Long].get).to.equal(explorerBox.additionalRegisters.R4.renderedValue);
      expect(box.R4[Long].isDefined).to.equal(true);

      await box.R4.set(3, SigmaType.Long);

      expect(box.R4[Long].get).to.equal(3);
    });
  });

  describe('setRegisters', () => {
    it('should set the values of register but not reset old registers', async () => {
      const box = new Box(explorerBox);
      expect(box.R4[Long].get).to.equal(explorerBox.additionalRegisters.R4.renderedValue);
      expect(box.R4[Long].isDefined).to.equal(true);

      const newBox = await box.setRegisters({
        R4: { value: 4, type: SigmaType.Long },
      });

      expect(newBox.R4[Long].get).not.to.equal(box.R4[Long].get);
      expect(newBox.R5[Long].get).to.equal(box.R5[Long].get);
      expect(newBox.R6[Long].get).to.equal(box.R6[Long].get);
    });
  });

  describe('_serialize', () => {
    it('serializes object to exact same format', () => {
      const box = new Box(explorerBox);

      const serializedBox = box._serialize();

      expect(explorerBox).to.eql(serializedBox);
    });
  });

  describe('resetRegisters', () => {
    it('should set the values of register but not reset old registers', async () => {
      const box = new Box(explorerBox);
      expect(box.R4[Long].get).to.equal(explorerBox.additionalRegisters.R4.renderedValue);
      expect(box.R4[Long].isDefined).to.equal(true);

      const newBox = box.resetRegisters();

      expect(newBox.R4[Long].isDefined).to.equal(false);

      const updatedBox = newBox.setRegisters({
        R4: { value: 444, type: SigmaType.Long },
      });

      expect(updatedBox.R4[Long].isDefined).to.equal(true);
      expect(updatedBox.R4[Long].get).to.equal(444);
    });

    it('should work with chained functions', async () => {
      const box = new Box(explorerBox);
      expect(box.R4[Long].get).to.equal(explorerBox.additionalRegisters.R4.renderedValue);
      expect(box.R4[Long].isDefined).to.equal(true);

      const newBox = box.resetRegisters().setRegisters({
        R4: { value: 444, type: SigmaType.Long },
      });

      expect(newBox.R4[Long].isDefined).to.equal(true);
      expect(newBox.R4[Long].get).to.equal(444);

      expect(newBox.R5[Long].isDefined).to.equal(false);
    });
  });
});
