export const SERVICE_PRICES: Record<string, { name: string; amount: string }> = {
  cipc: { name: "Company Registration (CIPC)", amount: "749.99" },
  csd: { name: "Central Supplier Database (CSD)", amount: "349.99" },
  "sars-pin": { name: "SARS Tax Compliance PIN", amount: "199.00" },
  bbbee: { name: "B-BBEE Affidavit", amount: "249.99" },
  "sars-pbo": { name: "SARS PBO Registration", amount: "2999.00" },
  "company-profile": { name: "Company Profile", amount: "249.00" },
  "business-plan-basic": { name: "Business Plan — Basic", amount: "2499.00" },
  "business-plan-standard": { name: "Business Plan — Standard", amount: "6299.00" },
  "business-plan-premium": { name: "Business Plan — Premium", amount: "16399.00" },
  "feasibility-basic": { name: "Feasibility Study — Basic", amount: "2999.00" },
  "feasibility-standard": { name: "Feasibility Study — Standard", amount: "7999.00" },
  "feasibility-premium": { name: "Feasibility Study — Premium", amount: "16299.00" },
  // Legacy application IDs remain payable at the price displayed when they were created.
  "business-plan": { name: "Business Plan", amount: "2499.00" },
  feasibility: { name: "Feasibility Study", amount: "16299.00" },
};

export function payfastEncode(value: string): string {
  return encodeURIComponent(value.trim())
    .replace(/%20/g, "+")
    .replace(/[!'()*~]/g, (character) =>
      `%${character.charCodeAt(0).toString(16).toUpperCase()}`
    );
}

export function parameterString(fields: Record<string, string>, passphrase?: string): string {
  const result = Object.entries(fields)
    .filter(([key, value]) => key !== "signature" && value !== "")
    .map(([key, value]) => `${key}=${payfastEncode(value)}`)
    .join("&");
  return passphrase ? `${result}&passphrase=${payfastEncode(passphrase)}` : result;
}

export function md5(input: string): string {
  const rotate = (x: number, c: number) => (x << c) | (x >>> (32 - c));
  const add = (x: number, y: number) => (x + y) | 0;
  const bytes = new TextEncoder().encode(input);
  const length = (((bytes.length + 8) >>> 6) + 1) * 16;
  const words = new Int32Array(length);
  bytes.forEach((byte, index) => { words[index >> 2] |= byte << ((index % 4) * 8); });
  words[bytes.length >> 2] |= 0x80 << ((bytes.length % 4) * 8);
  words[length - 2] = bytes.length * 8;
  const shifts = [7,12,17,22, 5,9,14,20, 4,11,16,23, 6,10,15,21];
  const constants = Array.from({ length: 64 }, (_, i) =>
    Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000) | 0);
  let a0 = 0x67452301, b0 = 0xefcdab89 | 0, c0 = 0x98badcfe | 0, d0 = 0x10325476;
  for (let offset = 0; offset < words.length; offset += 16) {
    let a = a0, b = b0, c = c0, d = d0;
    for (let i = 0; i < 64; i++) {
      let f: number, g: number, shift: number;
      if (i < 16) { f = (b & c) | (~b & d); g = i; shift = shifts[i % 4]; }
      else if (i < 32) { f = (d & b) | (~d & c); g = (5 * i + 1) % 16; shift = shifts[4 + i % 4]; }
      else if (i < 48) { f = b ^ c ^ d; g = (3 * i + 5) % 16; shift = shifts[8 + i % 4]; }
      else { f = c ^ (b | ~d); g = (7 * i) % 16; shift = shifts[12 + i % 4]; }
      const next = d;
      d = c; c = b;
      b = add(b, rotate(add(add(a, f), add(constants[i], words[offset + g])), shift));
      a = next;
    }
    a0 = add(a0, a); b0 = add(b0, b); c0 = add(c0, c); d0 = add(d0, d);
  }
  return [a0, b0, c0, d0].map((word) =>
    [0, 8, 16, 24].map((shift) => ((word >>> shift) & 0xff).toString(16).padStart(2, "0")).join("")
  ).join("");
}
