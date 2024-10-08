function escape (string) {
  return string
    .replaceAll('\\', '\\\\')
    .replaceAll('"', String.raw`\"`)
    .replaceAll('\n', String.raw`\n`)
}

export default function stringify (thing) {
  let result = ''
  if (Array.isArray(thing)) {
    result += '( '
    result += thing.map(stringify).join(', ')
    result += ' )'
  } else if (thing.constructor === Object) {
    result += '{ '
    for (const key in thing) {
      result += `"${key}" = `
      result += stringify(thing[key])
      result += '; '
    }
    result += '}'
  } else {
    result += `"${escape(thing.toString())}"`
  }
  return result
};
