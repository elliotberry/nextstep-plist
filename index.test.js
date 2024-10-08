import { strict as assert } from 'assert';
import { test } from 'node:test';
import { parse } from './index.js';

test('it can parse an empty array', async () => {
  const plist = '()';
  assert.deepEqual(parse(plist), []);
});

test('it can parse an empty dictionary', async () => {
  const plist = '{}';
  assert.deepEqual(parse(plist), {});
});

test('it wont parse nonsense', async () => {
  const error = /not valid/;
  assert.throws(() => parse('{;}'), error);
  assert.throws(() => parse('[2]'), error);
  assert.throws(() => parse('{"a" ='), error);
});

// test('it can parse binary', async () => {
//   const plist = '(<2B>)';
//   assert.deepEqual(parse(plist), [47]);
// });

test('it can parse an array of strings', async () => {
  const plist = '("pineapple", "future", "sunset")';
  const array = parse(plist);
  assert.equal(array[0], 'pineapple');
  assert.equal(array[1], 'future');
  assert.equal(array[2], 'sunset');
});

test('it can parse a dictionary', async () => {
  const plist = '{"lol" = "hello"; "phantasm" = "peter"}';
  const object = parse(plist);
  assert.equal(object.lol, 'hello');
  assert.equal(object.phantasm, 'peter');
});

test('it can parse an unquoted dictionary value', async () => {
  const plist = '{"lol" = "hello"; "phantasm" = peter}';
  const object = parse(plist);
  assert.equal(object.lol, 'hello');
  assert.equal(object.phantasm, 'peter');
});

test('it can parse a string with escapes', async () => {
  const plist = '("she said \\"not me!\\"")';
  const string = parse(plist)[0];
  assert.equal(string, 'she said "not me!"');
});

test('it can parse nested arrays', async () => {
  const plist = '("fox", ("glove", ("army")))';
  const array = parse(plist);
  assert.deepEqual(array, ['fox', ['glove', ['army']]]);
});

test('it can parse a nested object', async () => {
  const plist = '{"one" = {"two" = "three"}}';
  const object = parse(plist);
  assert.equal(object.one.two, 'three');
});

test('it can parse output of `defaults`', async () => {
  const noQuotes = parse(`(
      {
      LSHandlerPreferredVersions =         {
          LSHandlerRoleAll = "-";
      };
      LSHandlerRoleAll = "com.apple.dt.xcode";
      LSHandlerURLScheme = xcdevice;
    }
  )`);

  const quotes = parse(`(
      {
      "LSHandlerPreferredVersions" =         {
          "LSHandlerRoleAll" = "-";
      };
      "LSHandlerRoleAll" = "com.apple.dt.xcode";
      "LSHandlerURLScheme" = "xcdevice";
    }
  )`);

  assert.deepEqual(quotes, noQuotes);

  assert.deepEqual(noQuotes, [{
    LSHandlerPreferredVersions: {
      LSHandlerRoleAll: '-'
    },
    LSHandlerRoleAll: 'com.apple.dt.xcode',
    LSHandlerURLScheme: 'xcdevice'
  }]);
});