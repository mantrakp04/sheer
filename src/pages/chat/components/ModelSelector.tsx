import React from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Check, Info } from "lucide-react";
import { CHAT_MODELS } from "@/lib/config/types";

interface ModelSelectorProps {
  selectedModel: string;
  selectedModelName: string;
  enabledChatModels: string[] | undefined;
  onModelChange: (model: string) => void;
}

export const ModelSelector = React.memo(({ 
  selectedModel, 
  selectedModelName, 
  enabledChatModels, 
  onModelChange 
}: ModelSelectorProps) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button 
        variant="ghost" 
        className="w-[200px] h-8 p-1 justify-start font-normal"
      >
        {selectedModelName}
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent className="w-[400px]">
      {CHAT_MODELS
        .filter((model) => enabledChatModels?.includes(model.model))
        .map((model) => (
          <TooltipProvider key={model.model}>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuItem
                  className="p-4"
                  onSelect={() => onModelChange(model.model)}
                >
                  <div className="flex items-center gap-2 w-full">
                    {model.model === selectedModel && (
                      <Check className="h-4 w-4 shrink-0" />
                    )}
                    <span className="flex-grow">{model.name}</span>
                    <Info className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                </DropdownMenuItem>
              </TooltipTrigger>
              <TooltipContent side="right" align="start" className="max-w-[300px]">
                <p>{model.description}</p>
                {model.modalities && model.modalities.length > 0 && (
                  <div className="flex gap-1 flex-wrap mt-1">
                    {model.modalities.map((modality) => (
                      <Badge key={modality} variant="secondary" className="capitalize text-xs">
                        {modality.toLowerCase()}
                      </Badge>
                    ))}
                  </div>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
    </DropdownMenuContent>
  </DropdownMenu>
));

ModelSelector.displayName = "ModelSelector"; 