/* eslint-disable */
import process from 'node:process'
import readline from 'node:readline'

function clearScreen() {
  const repeatCount = process.stdout.rows - 2
  const blank = repeatCount > 0 ? '\n'.repeat(repeatCount) : ''
  console.log(blank)
  readline.cursorTo(process.stdout, 0, 0)
  readline.clearScreenDown(process.stdout)
}

function formatter(open: string, close: string, replace = open) {
  return (input: string) => {
    const string = `${input}`
    const index = string.indexOf(close, open.length)
    return ~index ? open + replaceClose(string, close, replace, index) + close : open + string + close
  }
}

function replaceClose(string: string, close: string, replace: string, index: number): string {
  const start = string.substring(0, index) + replace
  const end = string.substring(index + close.length)
  const nextIndex = end.indexOf(close)
  return ~nextIndex ? start + replaceClose(end, close, replace, nextIndex) : start + end
}

function createColors() {
  return {
    bgBlack: formatter('\x1B[40m', '\x1B[49m'),
    bgBlue: formatter('\x1B[44m', '\x1B[49m'),
    bgCyan: formatter('\x1B[46m', '\x1B[49m'),
    bgGreen: formatter('\x1B[42m', '\x1B[49m'),
    bgMagenta: formatter('\x1B[45m', '\x1B[49m'),
    bgRed: formatter('\x1B[41m', '\x1B[49m', '\x1B[22m\x1B[1m'),
    bgWhite: formatter('\x1B[47m', '\x1B[49m'),
    bgYellow: formatter('\x1B[43m', '\x1B[49m'),
    black: formatter('\x1B[30m', '\x1B[39m'),
    blue: formatter('\x1B[34m', '\x1B[39m'),
    bold: formatter('\x1B[1m', '\x1B[22m', '\x1B[22m\x1B[1m'),
    cyan: formatter('\x1B[36m', '\x1B[39m'),
    dim: formatter('\x1B[2m', '\x1B[22m', '\x1B[22m\x1B[2m'),
    gray: formatter('\x1B[90m', '\x1B[39m'),
    green: formatter('\x1B[32m', '\x1B[39m'),
    hidden: formatter('\x1B[8m', '\x1B[28m'),
    inverse: formatter('\x1B[7m', '\x1B[27m'),
    italic: formatter('\x1B[3m', '\x1B[23m'),
    magenta: formatter('\x1B[35m', '\x1B[39m'),
    red: formatter('\x1B[31m', '\x1B[39m'),
    reset: (s: string) => `\x1B[0m${s}\x1B[0m`,
    strikethrough: formatter('\x1B[9m', '\x1B[29m'),
    underline: formatter('\x1B[4m', '\x1B[24m'),
    white: formatter('\x1B[37m', '\x1B[39m'),
    yellow: formatter('\x1B[33m', '\x1B[39m'),
  }
}

export { clearScreen, createColors }
