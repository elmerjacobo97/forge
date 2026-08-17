export type CharacterSet = "uppercase" | "lowercase" | "numbers" | "symbols";

export type PasswordOptions = {
  length: number;
  enabledSets: Record<CharacterSet, boolean>;
};

export type StrengthLevel = "weak" | "medium" | "strong";

export type PasswordStrength = {
  entropyBits: number;
  level: StrengthLevel;
};

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;
export const DEFAULT_PASSWORD_LENGTH = 20;

export const SYMBOLS = "!@#$%^&*()-_=+[]{};:,.?";

export const CHARACTER_SETS: Record<CharacterSet, string> = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: SYMBOLS,
};

export const CHARACTER_SET_ORDER: CharacterSet[] = ["uppercase", "lowercase", "numbers", "symbols"];

export const DEFAULT_PASSWORD_OPTIONS: PasswordOptions = {
  length: DEFAULT_PASSWORD_LENGTH,
  enabledSets: {
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  },
};

export const CRYPTO_UNAVAILABLE_ERROR =
  "Secure password generation is unavailable because this browser does not support crypto.getRandomValues.";

const UINT32_RANGE = 0x1_0000_0000;

export function getEnabledCharacterSets(
  enabledSets: Record<CharacterSet, boolean>,
): CharacterSet[] {
  return CHARACTER_SET_ORDER.filter((set) => enabledSets[set]);
}

export function getCharacterPool(enabledSets: Record<CharacterSet, boolean>): string {
  return getEnabledCharacterSets(enabledSets)
    .map((set) => CHARACTER_SETS[set])
    .join("");
}

export function validatePasswordOptions(options: PasswordOptions): string | null {
  if (
    !Number.isInteger(options.length) ||
    options.length < MIN_PASSWORD_LENGTH ||
    options.length > MAX_PASSWORD_LENGTH
  ) {
    return `Password length must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters.`;
  }

  if (getEnabledCharacterSets(options.enabledSets).length === 0) {
    return "Enable at least one character set to generate a password.";
  }

  return null;
}

export function supportsCryptoRandomValues(): boolean {
  return typeof globalThis.crypto?.getRandomValues === "function";
}

export function generatePassword(options: PasswordOptions): string {
  const validationError = validatePasswordOptions(options);
  if (validationError) throw new Error(validationError);
  if (!supportsCryptoRandomValues()) throw new Error(CRYPTO_UNAVAILABLE_ERROR);

  const activeSets = getEnabledCharacterSets(options.enabledSets);
  const pool = getCharacterPool(options.enabledSets);
  const characters = activeSets.map((set) => poolCharacter(CHARACTER_SETS[set]));

  while (characters.length < options.length) {
    characters.push(poolCharacter(pool));
  }

  for (let index = characters.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndex(index + 1);
    [characters[index], characters[swapIndex]] = [characters[swapIndex], characters[index]];
  }

  return characters.join("");
}

export function calculateEntropyBits(options: PasswordOptions): number {
  const poolSize = getCharacterPool(options.enabledSets).length;
  if (poolSize === 0 || !Number.isFinite(options.length)) return 0;
  return options.length * Math.log2(poolSize);
}

export function getStrengthLevel(entropyBits: number): StrengthLevel {
  if (entropyBits < 40) return "weak";
  if (entropyBits < 80) return "medium";
  return "strong";
}

export function calculatePasswordStrength(options: PasswordOptions): PasswordStrength {
  const entropyBits = calculateEntropyBits(options);
  return {
    entropyBits,
    level: getStrengthLevel(entropyBits),
  };
}

function poolCharacter(pool: string): string {
  return pool[randomIndex(pool.length)];
}

function randomIndex(maxExclusive: number): number {
  const limit = UINT32_RANGE - (UINT32_RANGE % maxExclusive);
  const values = new Uint32Array(1);

  do {
    globalThis.crypto.getRandomValues(values);
  } while (values[0] >= limit);

  return values[0] % maxExclusive;
}
