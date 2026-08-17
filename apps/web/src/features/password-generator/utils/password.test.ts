import { afterEach, describe, expect, it, vi } from "vitest";
import {
  calculateEntropyBits,
  calculatePasswordStrength,
  CHARACTER_SETS,
  CRYPTO_UNAVAILABLE_ERROR,
  DEFAULT_PASSWORD_OPTIONS,
  generatePassword,
  getCharacterPool,
  getStrengthLevel,
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  SYMBOLS,
  validatePasswordOptions,
} from "./password";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("password options", () => {
  it("accepts the supported length limits", () => {
    expect(
      validatePasswordOptions({
        ...DEFAULT_PASSWORD_OPTIONS,
        length: MIN_PASSWORD_LENGTH,
      }),
    ).toBeNull();
    expect(
      validatePasswordOptions({
        ...DEFAULT_PASSWORD_OPTIONS,
        length: MAX_PASSWORD_LENGTH,
      }),
    ).toBeNull();
  });

  it("rejects lengths outside the supported range", () => {
    expect(
      validatePasswordOptions({
        ...DEFAULT_PASSWORD_OPTIONS,
        length: MIN_PASSWORD_LENGTH - 1,
      }),
    ).toContain("between 8 and 128");
    expect(
      validatePasswordOptions({
        ...DEFAULT_PASSWORD_OPTIONS,
        length: MAX_PASSWORD_LENGTH + 1,
      }),
    ).toContain("between 8 and 128");
    expect(
      validatePasswordOptions({
        ...DEFAULT_PASSWORD_OPTIONS,
        length: 20.5,
      }),
    ).toContain("between 8 and 128");
  });

  it("rejects options with no enabled character sets", () => {
    const error = validatePasswordOptions({
      ...DEFAULT_PASSWORD_OPTIONS,
      enabledSets: {
        uppercase: false,
        lowercase: false,
        numbers: false,
        symbols: false,
      },
    });

    expect(error).toBe("Enable at least one character set to generate a password.");
  });
});

describe("generatePassword", () => {
  it("uses the exact symbol alphabet", () => {
    expect(SYMBOLS).toBe("!@#$%^&*()-_=+[]{};:,.?");
    expect(CHARACTER_SETS.symbols).toBe(SYMBOLS);
  });

  it("generates the configured length using only active sets", () => {
    const options = {
      length: 32,
      enabledSets: {
        uppercase: true,
        lowercase: false,
        numbers: true,
        symbols: false,
      },
    };
    const password = generatePassword(options);
    const pool = getCharacterPool(options.enabledSets);

    expect(password).toHaveLength(options.length);
    expect([...password].every((character) => pool.includes(character))).toBe(true);
    expect(password).toMatch(/[A-Z]/);
    expect(password).toMatch(/[0-9]/);
    expect(password).not.toMatch(/[a-z]/);
    expect([...password].some((character) => SYMBOLS.includes(character))).toBe(false);
  });

  it.each([
    ["uppercase", /[A-Z]/],
    ["lowercase", /[a-z]/],
    ["numbers", /[0-9]/],
    ["symbols", /[!@#$%^&*()\-_=+\[\]{};:,.?]/],
  ] as const)("guarantees coverage for the active %s set", (set, pattern) => {
    const options = {
      length: 20,
      enabledSets: {
        uppercase: false,
        lowercase: false,
        numbers: false,
        symbols: false,
        [set]: true,
      },
    };

    expect(generatePassword(options)).toMatch(pattern);
  });

  it("throws when every character set is disabled", () => {
    expect(() =>
      generatePassword({
        ...DEFAULT_PASSWORD_OPTIONS,
        enabledSets: {
          uppercase: false,
          lowercase: false,
          numbers: false,
          symbols: false,
        },
      }),
    ).toThrow("Enable at least one character set");
  });

  it("throws when crypto.getRandomValues is unavailable", () => {
    vi.stubGlobal("crypto", {});

    expect(() => generatePassword(DEFAULT_PASSWORD_OPTIONS)).toThrow(CRYPTO_UNAVAILABLE_ERROR);
  });

  it("uses crypto.getRandomValues for selection", () => {
    const randomValues = vi.spyOn(globalThis.crypto, "getRandomValues");

    generatePassword(DEFAULT_PASSWORD_OPTIONS);

    expect(randomValues).toHaveBeenCalled();
  });

  it("rejects out-of-range random values before selecting an index", () => {
    const values = [0xffffffff, ...Array(20).fill(0)];
    const randomValues = vi
      .spyOn(globalThis.crypto, "getRandomValues")
      .mockImplementation((array) => {
        const view = array as Uint32Array;
        view[0] = values.shift() ?? 0;
        return array;
      });

    const password = generatePassword({
      length: 8,
      enabledSets: {
        uppercase: true,
        lowercase: false,
        numbers: false,
        symbols: false,
      },
    });

    expect(password).toBe("AAAAAAAA");
    expect(randomValues).toHaveBeenCalledTimes(16);
  });
});

describe("password strength", () => {
  it("calculates entropy from length and pool size", () => {
    const options = {
      ...DEFAULT_PASSWORD_OPTIONS,
      length: 20,
    };
    const poolSize = Object.values(CHARACTER_SETS).join("").length;

    expect(calculateEntropyBits(options)).toBeCloseTo(options.length * Math.log2(poolSize));
  });

  it("classifies the entropy thresholds", () => {
    expect(getStrengthLevel(39.99)).toBe("weak");
    expect(getStrengthLevel(40)).toBe("medium");
    expect(getStrengthLevel(79.99)).toBe("medium");
    expect(getStrengthLevel(80)).toBe("strong");
  });

  it("returns entropy and classification together", () => {
    const strength = calculatePasswordStrength({
      ...DEFAULT_PASSWORD_OPTIONS,
      length: 20,
    });

    expect(strength.entropyBits).toBeGreaterThanOrEqual(80);
    expect(strength.level).toBe("strong");
  });
});
