type U8 = number;

const INDEX_BIT_COUNT = 12;
const LENGTH_BIT_COUNT = 4;
const WINDOW_SIZE = 1 << INDEX_BIT_COUNT; // 4096
const RAW_LOOK_AHEAD_SIZE = 1 << LENGTH_BIT_COUNT; // 16
const BREAK_EVEN = Math.floor((1 + INDEX_BIT_COUNT + LENGTH_BIT_COUNT) / 9); // 1
const LOOK_AHEAD_SIZE = RAW_LOOK_AHEAD_SIZE + BREAK_EVEN; // 17
const TREE_ROOT = WINDOW_SIZE;
const END_OF_STREAM = 0;
const UNUSED = 0;

function modWindow(a: number): number {
  return a & (WINDOW_SIZE - 1);
}

interface TreeNode {
  parent: number;
  smaller_child: number;
  larger_child: number;
}

class LzssContext {
  window = new Uint8Array(WINDOW_SIZE);
  tree: TreeNode[] = Array.from({length: WINDOW_SIZE + 1}, () => ({
    parent: UNUSED,
    smaller_child: UNUSED,
    larger_child: UNUSED,
  }));

  dataBuffer = new Uint8Array(17);
  flagBitMask = 1;
  bufferOffset = 1;
  oldBufferOffset = 0;

  compressedSize = 0;
  incInputString = 0;
  incOutputString = 0;
}

function initTree(r: number, ctxt: LzssContext): void {
  for (let i = 0; i < WINDOW_SIZE + 1; i++) {
    ctxt.tree[i]!.parent = UNUSED;
    ctxt.tree[i]!.larger_child = UNUSED;
    ctxt.tree[i]!.smaller_child = UNUSED;
  }
  ctxt.tree[TREE_ROOT]!.larger_child = r;
  ctxt.tree[r]!.parent = TREE_ROOT;
  ctxt.tree[r]!.larger_child = UNUSED;
  ctxt.tree[r]!.smaller_child = UNUSED;
}

function contractNode(oldNode: number, newNode: number, ctxt: LzssContext): void {
  ctxt.tree[newNode]!.parent = ctxt.tree[oldNode]!.parent;
  if (ctxt.tree[ctxt.tree[oldNode]!.parent]!.larger_child === oldNode) {
    ctxt.tree[ctxt.tree[oldNode]!.parent]!.larger_child = newNode;
  } else {
    ctxt.tree[ctxt.tree[oldNode]!.parent]!.smaller_child = newNode;
  }
  ctxt.tree[oldNode]!.parent = UNUSED;
}

function replaceNode(oldNode: number, newNode: number, ctxt: LzssContext): void {
  const parent = ctxt.tree[oldNode]!.parent;

  if (ctxt.tree[parent]!.smaller_child === oldNode) {
    ctxt.tree[parent]!.smaller_child = newNode;
  } else {
    ctxt.tree[parent]!.larger_child = newNode;
  }

  ctxt.tree[newNode] = {...ctxt.tree[oldNode]!};

  if (ctxt.tree[newNode]!.smaller_child !== UNUSED) {
    ctxt.tree[ctxt.tree[newNode]!.smaller_child]!.parent = newNode;
  }
  if (ctxt.tree[newNode]!.larger_child !== UNUSED) {
    ctxt.tree[ctxt.tree[newNode]!.larger_child]!.parent = newNode;
  }

  ctxt.tree[oldNode]!.parent = UNUSED;
}

function findNextNode(node: number, ctxt: LzssContext): number {
  let next = ctxt.tree[node]!.smaller_child;
  while (ctxt.tree[next]!.larger_child !== UNUSED) {
    next = ctxt.tree[next]!.larger_child;
  }
  return next;
}

function deleteString(p: number, ctxt: LzssContext): void {
  if (ctxt.tree[p]!.parent === UNUSED) {
    return;
  }

  if (ctxt.tree[p]!.larger_child === UNUSED) {
    contractNode(p, ctxt.tree[p]!.smaller_child, ctxt);
  } else if (ctxt.tree[p]!.smaller_child === UNUSED) {
    contractNode(p, ctxt.tree[p]!.larger_child, ctxt);
  } else {
    const replacement = findNextNode(p, ctxt);
    deleteString(replacement, ctxt);
    replaceNode(p, replacement, ctxt);
  }
}

function addString(
  newNode: number,
  matchPositionRef: { value: number },
  ctxt: LzssContext,
): number {
  if (newNode === END_OF_STREAM) {
    return 0;
  }

  let testNode = ctxt.tree[TREE_ROOT]!.larger_child;
  let matchLength = 0;

  for (; ;) {
    let delta = 0;
    let i = 0;

    for (; i < LOOK_AHEAD_SIZE; i++) {
      delta = ctxt.window[modWindow(newNode + i)]! - ctxt.window[modWindow(testNode + i)]!;
      if (delta !== 0) {
        break;
      }
    }

    if (i >= matchLength) {
      matchLength = i;
      matchPositionRef.value = testNode;

      if (matchLength >= LOOK_AHEAD_SIZE) {
        replaceNode(testNode, newNode, ctxt);
        return matchLength;
      }
    }

    const childKey = delta >= 0 ? "larger_child" : "smaller_child";
    const child = ctxt.tree[testNode]![childKey];

    if (child === UNUSED) {
      ctxt.tree[testNode]![childKey] = newNode;
      ctxt.tree[newNode]!.parent = testNode;
      ctxt.tree[newNode]!.larger_child = UNUSED;
      ctxt.tree[newNode]!.smaller_child = UNUSED;
      return matchLength;
    }

    testNode = child;
  }
}

function initOutputBuffer(ctxt: LzssContext): void {
  ctxt.dataBuffer[0] = 0;
  ctxt.flagBitMask = 1;
  ctxt.oldBufferOffset = ctxt.bufferOffset;
  ctxt.bufferOffset = 1;
}

function flushOutputBuffer(output: number[], ctxt: LzssContext): boolean {
  if (ctxt.bufferOffset === 1) {
    return true;
  }

  for (let i = 0; i < ctxt.bufferOffset; i++) {
    output.push(ctxt.dataBuffer[i]!);
  }

  ctxt.compressedSize += ctxt.bufferOffset;
  initOutputBuffer(ctxt);
  return true;
}

function outputChar(data: number, output: number[], ctxt: LzssContext): boolean {
  ctxt.dataBuffer[ctxt.bufferOffset++] = data & 0xff;
  ctxt.dataBuffer[0]! |= ctxt.flagBitMask;
  ctxt.flagBitMask <<= 1;
  ctxt.incOutputString = 0;

  if (ctxt.flagBitMask === 0x100) {
    ctxt.incOutputString = 1;
    return flushOutputBuffer(output, ctxt);
  }

  return true;
}

function outputPair(
  position: number,
  length: number,
  output: number[],
  ctxt: LzssContext,
): boolean {
  ctxt.dataBuffer[ctxt.bufferOffset] = ((length << 4) & 0xf0) | ((position >> 8) & 0x0f);
  ctxt.bufferOffset++;
  ctxt.dataBuffer[ctxt.bufferOffset++] = position & 0xff;

  ctxt.flagBitMask <<= 1;
  ctxt.incOutputString = 0;

  if (ctxt.flagBitMask === 0x100) {
    ctxt.incOutputString = 1;
    return flushOutputBuffer(output, ctxt);
  }

  return true;
}

function initInputBuffer(inputByte: number, ctxt: LzssContext): void {
  ctxt.flagBitMask = 1;
  ctxt.dataBuffer[0] = inputByte & 0xff;
}

function inputBit(input: Uint8Array, inputIndexRef: { value: number }, ctxt: LzssContext): number {
  ctxt.incInputString = 0;

  if (ctxt.flagBitMask === 0x100) {
    if (inputIndexRef.value >= input.length) {
      throw new Error("Unexpected end of compressed input while reading flag byte.");
    }
    initInputBuffer(input[inputIndexRef.value]!, ctxt);
    ctxt.incInputString = 1;
  }

  ctxt.flagBitMask <<= 1;
  return ctxt.dataBuffer[0]! & (ctxt.flagBitMask >> 1);
}

/**
 * Compresses input using the same LZSS variant as the provided C code.
 */
export function lzssCompress(input: Uint8Array): Uint8Array {
  const ctxt = new LzssContext();
  const output: number[] = [];

  ctxt.compressedSize = 0;
  initOutputBuffer(ctxt);

  let inputIndex = 0;
  let currentPosition = 1;

  let i = 0;
  for (; i < LOOK_AHEAD_SIZE; i++) {
    if (inputIndex >= input.length) {
      break;
    }
    ctxt.window[currentPosition + i] = input[inputIndex++]!;
  }

  let lookAheadBytes = i;

  initTree(currentPosition, ctxt);

  let matchLength = 0;
  const matchPositionRef = {value: 0};

  while (lookAheadBytes > 0) {
    if (matchLength > lookAheadBytes) {
      matchLength = lookAheadBytes;
    }

    let replaceCount: number;

    if (matchLength <= BREAK_EVEN) {
      replaceCount = 1;
      if (!outputChar(ctxt.window[currentPosition]!, output, ctxt)) {
        throw new Error("Compression failed while writing literal.");
      }
    } else {
      if (
        !outputPair(
          matchPositionRef.value,
          matchLength - (BREAK_EVEN + 1),
          output,
          ctxt,
        )
      ) {
        throw new Error("Compression failed while writing match pair.");
      }
      replaceCount = matchLength;
    }

    for (let j = 0; j < replaceCount; j++) {
      deleteString(modWindow(currentPosition + LOOK_AHEAD_SIZE), ctxt);

      if (inputIndex >= input.length) {
        lookAheadBytes--;
      } else {
        ctxt.window[modWindow(currentPosition + LOOK_AHEAD_SIZE)] = input[inputIndex++]!;
      }

      currentPosition = modWindow(currentPosition + 1);

      if (lookAheadBytes) {
        matchLength = addString(currentPosition, matchPositionRef, ctxt);
      }
    }
  }

  if (!ctxt.incOutputString) {
    flushOutputBuffer(output, ctxt);
  }

  return Uint8Array.from(output);
}

/**
 * Expands data compressed by lzssCompress().
 *
 * `outputSize` must be the expected decompressed size.
 */
export function lzssExpand(input: Uint8Array, outputSize: number): Uint8Array {
  const ctxt = new LzssContext();
  const output = new Uint8Array(outputSize);

  if (input.length === 0) {
    if (outputSize === 0) {
      return output;
    }
    throw new Error("Compressed input is empty.");
  }

  let inputIndex = 0;
  initInputBuffer(input[inputIndex]!, ctxt);
  inputIndex++;

  let currentPosition = 1;
  let outputIndex = 0;
  let remaining = outputSize;

  while (remaining > 0) {
    if (inputBit(input, {value: inputIndex}, ctxt)) {
      // We need to preserve the exact original pointer logic:
      // if inputBit reloaded flags, the caller advances input by one.
      if (ctxt.incInputString === 1) {
        inputIndex++;
      }

      if (inputIndex >= input.length) {
        throw new Error("Unexpected end of compressed input while reading literal.");
      }

      const c = input[inputIndex++]!;
      output[outputIndex++] = c;
      remaining--;

      ctxt.window[currentPosition] = c;
      currentPosition = modWindow(currentPosition + 1);
    } else {
      if (ctxt.incInputString === 1) {
        inputIndex++;
      }

      if (inputIndex + 1 >= input.length) {
        throw new Error("Unexpected end of compressed input while reading match pair.");
      }

      let matchLength = input[inputIndex++]!;
      let matchPosition = input[inputIndex++]!;

      matchPosition |= (matchLength & 0x0f) << 8;
      matchLength >>= 4;
      matchLength += BREAK_EVEN;

      // Keep behavior aligned with the original C code.
      if (matchLength < remaining) {
        remaining -= matchLength + 1;
      } else {
        remaining = 0;
        matchLength = remaining - 1;
      }

      for (let i = 0; i <= matchLength; i++) {
        const c = ctxt.window[modWindow(matchPosition + i)]!;
        output[outputIndex++] = c;
        ctxt.window[currentPosition] = c;
        currentPosition = modWindow(currentPosition + 1);
      }
    }
  }

  return output;
}
