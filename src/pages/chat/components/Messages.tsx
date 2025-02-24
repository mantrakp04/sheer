import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useParams } from "react-router-dom";
import { isHumanMessage, isAIMessage, AIMessage } from "@langchain/core/messages";
import { MessagesProps } from "../types";
import { HumanMessageComponent } from "./HumanMessage";
import { AIMessageComponent } from "./AIMessage";
import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";

export const Messages = React.memo(({ 
  messages, 
  streamingHumanMessage, 
  streamingAIMessageChunks, 
  setPreviewDocument,
  onEditMessage,
  onRegenerateMessage,
  editingMessageIndex,
  onSaveEdit,
  onCancelEdit,
}: MessagesProps) => {
  const { id } = useParams();
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const [showScrollToBottom, setShowScrollToBottom] = React.useState(false);
  
  const handleScroll = React.useCallback((event: Event) => {
    const viewport = event.target as HTMLDivElement;
    const isNotAtBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight > 10;
    setShowScrollToBottom(isNotAtBottom);
  }, []);

  const scrollToBottom = React.useCallback(() => {
    if (!viewportRef.current) return;
    const viewport = viewportRef.current;
    viewport.scrollTo({
      top: viewport.scrollHeight,
      behavior: 'smooth'
    });
  }, []);

  React.useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    viewport.addEventListener('scroll', handleScroll);
    // Initial check for scroll position
    handleScroll({ target: viewport } as unknown as Event);
    return () => viewport.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);
  
  if (id === "new" || !messages) {
    return <div className="flex-1 min-h-0"><ScrollArea className="h-full" /></div>;
  }

  return (
    <div className="flex-1 min-h-0 relative">
      <ScrollAreaPrimitive.Root className="h-full">
        <ScrollAreaPrimitive.Viewport ref={viewportRef} className="h-full w-full">
          <div className="flex flex-col w-1/2 mx-auto gap-1 pb-4">
            {messages.map((message, index) => {
              if (isHumanMessage(message)) {
                return (
                  <HumanMessageComponent 
                    key={index} 
                    message={message} 
                    setPreviewDocument={setPreviewDocument}
                    onEdit={() => onEditMessage(index)}
                    onRegenerate={() => onRegenerateMessage(index)}
                    isEditing={editingMessageIndex === index}
                    onSave={onSaveEdit}
                    onCancelEdit={onCancelEdit}
                  />
                );
              }
              if (isAIMessage(message)) {
                return <AIMessageComponent key={index} message={message} />;
              }
              return null;
            })}
            {streamingHumanMessage && (
              <HumanMessageComponent 
                message={streamingHumanMessage} 
                setPreviewDocument={setPreviewDocument} 
              />
            )}
            {streamingAIMessageChunks.length > 0 && (
              <AIMessageComponent 
                message={new AIMessage(streamingAIMessageChunks.map(chunk => chunk.content).join(""))} 
              />
            )}
          </div>
        </ScrollAreaPrimitive.Viewport>
        <ScrollAreaPrimitive.Scrollbar orientation="vertical">
          <ScrollAreaPrimitive.Thumb />
        </ScrollAreaPrimitive.Scrollbar>
      </ScrollAreaPrimitive.Root>
      {showScrollToBottom && (
        <Button
          variant="secondary"
          size="icon"
          className="absolute left-1/2 -translate-x-1/2 bottom-4 rounded-full shadow-md hover:bg-accent z-50 bg-background/80 backdrop-blur-sm"
          onClick={scrollToBottom}
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
});

Messages.displayName = "Messages"; 