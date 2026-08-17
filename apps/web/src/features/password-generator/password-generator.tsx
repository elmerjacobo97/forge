"use client";

import { startTransition, useCallback, useEffect, useReducer } from "react";
import { Check, Copy, RefreshCw } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  calculatePasswordStrength,
  DEFAULT_PASSWORD_OPTIONS,
  generatePassword,
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  type CharacterSet,
  type PasswordOptions,
  type PasswordStrength,
  validatePasswordOptions,
} from "./utils/password";
import { copyPassword } from "./utils/clipboard";

type CopyStatus = "idle" | "success" | "error";

type PasswordGeneratorState = {
  options: PasswordOptions;
  password: string;
  strength: PasswordStrength | null;
  needsRegeneration: boolean;
  copyStatus: CopyStatus;
  error: string | null;
};

type PasswordGeneratorAction =
  | {
      type: "options-changed";
      options: PasswordOptions;
      error: string | null;
    }
  | {
      type: "generated";
      password: string;
      strength: PasswordStrength;
    }
  | { type: "generation-error"; error: string }
  | { type: "copy-success" }
  | { type: "copy-error"; error: string };

const CHARACTER_SET_LABELS: { id: CharacterSet; label: string }[] = [
  { id: "uppercase", label: "Uppercase (A-Z)" },
  { id: "lowercase", label: "Lowercase (a-z)" },
  { id: "numbers", label: "Numbers (0-9)" },
  { id: "symbols", label: "Symbols" },
];

const COPY_ERROR = "Unable to copy password to the clipboard.";

export function PasswordGenerator() {
  const [state, dispatch] = useReducer(passwordGeneratorReducer, undefined, createEmptyState);
  const { options, password, strength, needsRegeneration, copyStatus, error } = state;

  const generateForOptions = useCallback((nextOptions: PasswordOptions) => {
    try {
      const nextPassword = generatePassword(nextOptions);
      dispatch({
        type: "generated",
        password: nextPassword,
        strength: calculatePasswordStrength(nextOptions),
      });
    } catch (cause) {
      dispatch({
        type: "generation-error",
        error: getErrorMessage(cause, "Unable to generate a password."),
      });
    }
  }, []);

  useEffect(() => {
    startTransition(() => {
      generateForOptions(DEFAULT_PASSWORD_OPTIONS);
    });
  }, [generateForOptions]);

  function updateOptions(nextOptions: PasswordOptions) {
    dispatch({
      type: "options-changed",
      options: nextOptions,
      error: validatePasswordOptions(nextOptions),
    });
  }

  function handleLengthChange(value: string) {
    updateOptions({
      ...options,
      length: value === "" ? Number.NaN : Number(value),
    });
  }

  function handleSetChange(set: CharacterSet, enabled: boolean) {
    updateOptions({
      ...options,
      enabledSets: {
        ...options.enabledSets,
        [set]: enabled,
      },
    });
  }

  async function handleCopy() {
    if (!password) return;

    try {
      await copyPassword(password);
      dispatch({ type: "copy-success" });
    } catch (cause) {
      dispatch({
        type: "copy-error",
        error: getErrorMessage(cause, COPY_ERROR),
      });
    }
  }

  const lengthValue = Number.isFinite(options.length) ? options.length : "";
  const optionError = validatePasswordOptions(options);
  const hasLengthError = optionError?.startsWith("Password length") ?? false;
  const hasCharacterSetError = optionError?.startsWith("Enable") ?? false;
  const strengthLabel = strength
    ? `${capitalize(strength.level)} · ${strength.entropyBits.toFixed(1)} bits`
    : "Unavailable";

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto">
      <section className="flex flex-col gap-4 rounded-xl border bg-muted/20 p-4">
        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="password-length"
            className="text-xs font-medium text-muted-foreground"
          >
            Length
          </Label>
          <Input
            id="password-length"
            type="number"
            min={MIN_PASSWORD_LENGTH}
            max={MAX_PASSWORD_LENGTH}
            value={lengthValue}
            onChange={(event) => handleLengthChange(event.target.value)}
            aria-invalid={hasLengthError || undefined}
            aria-describedby={
              hasLengthError
                ? "password-length-help password-generator-error"
                : "password-length-help"
            }
            className="h-9 max-w-32 text-sm"
          />
          <p
            id="password-length-help"
            className="text-[11px] text-muted-foreground"
          >
            Choose between {MIN_PASSWORD_LENGTH} and {MAX_PASSWORD_LENGTH} characters.
          </p>
        </div>

        <fieldset
          className="flex flex-col gap-2"
          aria-invalid={hasCharacterSetError || undefined}
          aria-describedby={hasCharacterSetError ? "password-generator-error" : undefined}
        >
          <legend className="text-xs font-medium text-muted-foreground">Character sets</legend>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {CHARACTER_SET_LABELS.map(({ id, label }) => {
              const inputId = `password-set-${id}`;

              return (
                <div
                  key={id}
                  className="flex items-center gap-2"
                >
                  <Checkbox
                    id={inputId}
                    checked={options.enabledSets[id]}
                    onCheckedChange={(checked) => handleSetChange(id, checked === true)}
                    aria-label={label}
                  />
                  <Label
                    htmlFor={inputId}
                    className="text-xs font-normal"
                  >
                    {label}
                  </Label>
                </div>
              );
            })}
          </div>
        </fieldset>
      </section>

      <section className="flex min-h-0 flex-1 flex-col gap-4 rounded-xl border bg-muted/20 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Generated password
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">Estimated entropy</p>
          </div>
          <Badge
            variant="secondary"
            className="border-primary/30 text-primary/80"
          >
            {strengthLabel}
          </Badge>
        </div>

        <div
          role="status"
          aria-label="Generated password"
          aria-live="polite"
          aria-atomic="true"
          className="flex min-h-24 flex-1 items-center justify-center rounded-lg border border-border/60 bg-background/70 p-4 text-center"
        >
          <code className="break-all font-mono text-base leading-relaxed sm:text-lg">
            {password || "No password generated"}
          </code>
        </div>

        {needsRegeneration && (
          <p
            className="text-xs text-amber-600 dark:text-amber-400"
            aria-live="polite"
          >
            Options changed. Regenerate to apply them.
          </p>
        )}

        {error && (
          <Alert
            id="password-generator-error"
            variant="destructive"
            role="alert"
            aria-live="assertive"
          >
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleCopy}
            disabled={!password}
            className="w-full sm:w-auto"
          >
            {copyStatus === "success" ? (
              <Check className="size-3.5" />
            ) : (
              <Copy className="size-3.5" />
            )}
            {copyStatus === "success" ? "Copied" : "Copy"}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => generateForOptions(options)}
            className="w-full sm:w-auto"
          >
            <RefreshCw className="size-3.5" />
            Regenerate
          </Button>
        </div>
      </section>
    </div>
  );
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getErrorMessage(cause: unknown, fallback: string): string {
  return cause instanceof Error && cause.message ? cause.message : fallback;
}

function createEmptyState(): PasswordGeneratorState {
  const options: PasswordOptions = {
    length: DEFAULT_PASSWORD_OPTIONS.length,
    enabledSets: { ...DEFAULT_PASSWORD_OPTIONS.enabledSets },
  };

  return {
    options,
    password: "",
    strength: null,
    needsRegeneration: false,
    copyStatus: "idle",
    error: null,
  };
}

function passwordGeneratorReducer(
  state: PasswordGeneratorState,
  action: PasswordGeneratorAction,
): PasswordGeneratorState {
  switch (action.type) {
    case "options-changed":
      return {
        ...state,
        options: action.options,
        needsRegeneration: Boolean(state.password),
        copyStatus: "idle",
        error: action.error,
      };
    case "generated":
      return {
        ...state,
        password: action.password,
        strength: action.strength,
        needsRegeneration: false,
        copyStatus: "idle",
        error: null,
      };
    case "generation-error":
      return { ...state, error: action.error };
    case "copy-success":
      return { ...state, copyStatus: "success" };
    case "copy-error":
      return { ...state, copyStatus: "error", error: action.error };
  }
}
