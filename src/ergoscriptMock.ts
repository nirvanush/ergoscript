import Transaction from './Transaction';

Object.defineProperty(Array.prototype, 'size', {
  get: function size() {
    return this.length;
  },
});

Object.defineProperty(String.prototype, 'replaceAll', {
  value: function (search: string, replace: string) {
    return this.replace(new RegExp(search, 'g'), replace);
  },
});

function replacer(str: string): string {
  const replaced = str.replaceAll('val ', 'var ').replaceAll(/(\d+)L/g, '$1');

  return replaced;
}

function buildScriptScope(tx: Transaction): {
  execute: (script: string) => any;
} {
  const Long = 'Long';
  const Byte = 'Byte';

  const INPUTS = (i: number) => tx.inputs[i];
  INPUTS.size = tx.inputs.length;

  const OUTPUTS = (i: number) => tx.outputs[i];
  OUTPUTS.size = tx.outputs.length;

  const CONTEXT = {
    preHeader: {
      timestamp: Date.now(),
    },
  };

  function sigmaProp(value: any) {
    return !!value;
  }

  function Coll() {
    return Array.from(arguments);
  }

  Coll.Byte = 'Coll[Byte]';

  function allOf(arr: boolean[]) {
    return arr.every((element: boolean) => element === true);
  }

  return {
    execute: (script: string) => {
      const resp = eval(replacer(script));
      return resp;
    },
  };
}

// export buildScriptScope;
export default buildScriptScope;
