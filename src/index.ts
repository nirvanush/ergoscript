import Transaction, { TransactionJson } from './Transaction';
import Box, { SigmaType, ExplorerBox } from './Box';
import { NANO_ERG_IN_ERG } from './constants';
import { wasmModule } from './ergolib';

wasmModule.loadAsync();

export default Transaction;
export { Box, SigmaType, NANO_ERG_IN_ERG, TransactionJson, ExplorerBox };
