import { Loader2, Sparkles } from "lucide-react";

import { InputGroupButton } from "@/components/ui/input-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AiGenerationButtonProps {
  label: string;
  disabled: boolean;
  isGenerating: boolean;
  onClick: () => void;
}

export function AiGenerationButton({
  label,
  disabled,
  isGenerating,
  onClick,
}: AiGenerationButtonProps) {
  const accessibleLabel = isGenerating ? `${label}, generating` : label;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">
          <InputGroupButton
            size="icon-xs"
            disabled={disabled || isGenerating}
            onClick={onClick}
            aria-label={accessibleLabel}
            aria-busy={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles aria-hidden="true" />
            )}
          </InputGroupButton>
        </span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
