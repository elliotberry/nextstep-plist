const go = 'gogogo';
const good = 'good';
const equals = 'equals';
const dictSeparator = 'dictSeparator';
const arraySeparator = 'arraySeparator';
const firstDictKey = 'firstDictKey';
const dictKey = 'dictKey';
const dictValue = 'dictValue';
const firstArrayValue = 'firstArrayValue';
const arrayValue = 'arrayValue';

let state;
let stack;
let container;
let key;
let value;

const escapes = new Map([
  ['"', '"'],
  ['\\', '\\']
]);

const escape = string =>
  string.replace(/\\([\\"])/g, (_, character) => escapes.get(character));

// TODO add support for binary data
const tokens = new RegExp(/^\s*(?:([,;=(){}])|"((?:\\"|[^"])*)"|(\w+))/);

const stringAction = {
  [arrayValue]() {
    state = arraySeparator;
  },
  [dictKey]() {
    key = value;
    state = equals;
  },
  [dictValue]() {
    state = dictSeparator;
  },
  [firstArrayValue]() {
    state = arraySeparator;
  },
  [firstDictKey]() {
    key = value;
    state = equals;
  },
  [go]() {
    state = good;
  }
};

const action = {
  ',': {
    [arraySeparator]() {
      container.push(value);
      state = arrayValue;
    }
  },
  ';': {
    [dictSeparator]() {
      container[key] = value;
      state = dictKey;
    }
  },
  '(': {
    [arrayValue]() {
      stack.push({
        container,
        state: arraySeparator
      });
      container = [];
      state = firstArrayValue;
    },
    [dictValue]() {
      stack.push({
        container,
        key,
        state: dictSeparator
      });
      container = [];
      state = firstArrayValue;
    },
    [firstArrayValue]() {
      stack.push({
        container,
        state: arraySeparator
      });
      container = [];
      state = firstArrayValue;
    },
    [go]() {
      stack.push({ state: good });
      container = [];
      state = firstArrayValue;
    }
  },
  ')': {
    [arraySeparator]() {
      const last = stack.pop();
      container.push(value);
      value = container;
      container = last.container;
      key = last.key;
      state = last.state;
    },
    [firstArrayValue]() {
      const last = stack.pop();
      value = container;
      container = last.container;
      key = last.key;
      state = last.state;
    }
  },
  '{': {
    [arrayValue]() {
      stack.push({
        container,
        state: arraySeparator
      });
      container = {};
      state = firstDictKey;
    },
    [dictValue]() {
      stack.push({
        container,
        key,
        state: dictSeparator
      });
      container = {};
      state = firstDictKey;
    },
    [firstArrayValue]() {
      stack.push({
        container,
        state: arraySeparator
      });
      container = {};
      state = firstDictKey;
    },
    [go]() {
      stack.push({ state: good });
      container = {};
      state = firstDictKey;
    }
  },
  '}': {
    // trailing ; in dictionary definitions
    [dictKey]() {
      const last = stack.pop();
      value = container;
      container = last.container;
      key = last.key;
      state = last.state;
    },
    [dictSeparator]() {
      const last = stack.pop();
      container[key] = value;
      value = container;
      container = last.container;
      key = last.key;
      state = last.state;
    },
    [firstDictKey]() {
      const last = stack.pop();
      value = container;
      container = last.container;
      key = last.key;
      state = last.state;
    }
  },
  '=': {
    [equals]() {
      // TODO perhaps throw on duplicate key
      state = dictValue;
    }
  }
};

export default function parse(plist) {
  state = go;
  stack = [];
  container = key = value = null;
  const invalid = new SyntaxError('excuse me, that is not valid');
  try {
    while (plist) {
      const result = tokens.exec(plist);
      if (!result) {
        break;
      }
      const [capture, token, string, noQuoteString] = result;
      if (token) {
        action[token][state]();
      } else {
        value = string === undefined ? escape(noQuoteString) : escape(string);
        stringAction[state]();
      }
      plist = plist.slice(capture.length);
    }
  } catch (error) {
    throw invalid;
  }

  if (state !== good) throw invalid;

  return value;
}
