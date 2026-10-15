export type CompressedBackup = {
  base64: string;
  originalBytes: number;
  compressedBytes: number;
};

export async function encodeCompressedBackup(source: Blob): Promise<CompressedBackup> {
  const stream = source.stream().pipeThrough(new CompressionStream('deflate'));
  const bytes = new Uint8Array(await new Response(stream).arrayBuffer());

  // Keep each call small: spreading a multi-MB buffer would exceed the argument limit.
  const chunks: string[] = [];
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    chunks.push(String.fromCharCode(...bytes.subarray(offset, offset + 0x8000)));
  }

  return {
    base64: btoa(chunks.join('')),
    originalBytes: source.size,
    compressedBytes: bytes.byteLength,
  };
}

export async function decodeCompressedBackup(base64: string): Promise<string> {
  const binary = atob(base64.replace(/\s+/g, ''));
  const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate'));
  return new Response(stream).text();
}
