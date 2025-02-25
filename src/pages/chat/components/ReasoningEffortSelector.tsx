import React from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Check, Brain } from "lucide-react";
import { ChatCompletionReasoningEffort } from "openai/resources/chat/completions";
import { PROVIDERS } from "@/lib/config/types";

interface ReasoningEffortSelectorProps {
  selectedReasoningEffort: ChatCompletionReasoningEffort | null | undefined;
  provider: PROVIDERS;
  isReasoning: boolean;
  onReasoningEffortChange: (effort: ChatCompletionReasoningEffort) => void;
}

interface ReasoningOption {
  value: ChatCompletionReasoningEffort;
  label: string;
  description: string;
}

// Define the reasoning effort options
const REASONING_EFFORT_OPTIONS: Record<string, ReasoningOption[]> = {
  [PROVIDERS.openai]: [
    { value: "low" as ChatCompletionReasoningEffort, label: "Low", description: "Minimal reasoning, faster responses" },
    { value: "medium" as ChatCompletionReasoningEffort, label: "Medium", description: "Balanced reasoning and speed" },
    { value: "high" as ChatCompletionReasoningEffort, label: "High", description: "Thorough reasoning, slower responses" }
  ],
  [PROVIDERS.anthropic]: [
    { value: "disabled" as ChatCompletionReasoningEffort, label: "Disabled", description: "No explicit reasoning" },
    { value: "low" as ChatCompletionReasoningEffort, label: "Low", description: "Minimal reasoning (~8K tokens)" },
    { value: "medium" as ChatCompletionReasoningEffort, label: "Medium", description: "Balanced reasoning (~16K tokens)" },
    { value: "high" as ChatCompletionReasoningEffort, label: "High", description: "Thorough reasoning (~32K tokens)" }
  ]
};

export const ReasoningEffortSelector = React.memo(({ 
  selectedReasoningEffort, 
  provider,
  isReasoning,
  onReasoningEffortChange 
}: ReasoningEffortSelectorProps) => {
  if (!isReasoning) return null;
  
  const options = REASONING_EFFORT_OPTIONS[provider] || REASONING_EFFORT_OPTIONS[PROVIDERS.openai];
  const selectedOption = options.find((opt: ReasoningOption) => opt.value === selectedReasoningEffort) || options[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="h-8 p-1 justify-start font-normal flex items-center gap-1"
          title="Reasoning Effort"
        >
          <Brain className="h-4 w-4" />
          <span className="truncate">{selectedOption.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[250px]">
        {options.map((option: ReasoningOption) => (
          <TooltipProvider key={option.value}>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuItem
                  className="p-3"
                  onSelect={() => onReasoningEffortChange(option.value)}
                >
                  <div className="flex items-center gap-2 w-full">
                    {option.value === selectedReasoningEffort && (
                      <Check className="h-4 w-4 shrink-0" />
                    )}
                    <span className="flex-grow">{option.label}</span>
                  </div>
                </DropdownMenuItem>
              </TooltipTrigger>
              <TooltipContent side="right" align="start" className="max-w-[300px]">
                <p>{option.description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

ReasoningEffortSelector.displayName = "ReasoningEffortSelector"; 