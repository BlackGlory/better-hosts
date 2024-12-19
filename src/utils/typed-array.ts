export function uint16ArrayBigEndian(
  array: ArrayLike<number>
): Uint16Array<ArrayBuffer> {
  const data = new Uint16Array(array.length)

  const view = new DataView(data.buffer)
  for (
    let i = 0, byteOffset = 0
  ; i < array.length
  ; i++, byteOffset += Uint16Array.BYTES_PER_ELEMENT
  ) {
    view.setUint16(byteOffset, array[i], false)
  }

  return data
}
