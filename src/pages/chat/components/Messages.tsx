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
  const initialLoadRef = React.useRef(true);
  
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

  // Effect for handling scroll events
  React.useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    viewport.addEventListener('scroll', handleScroll);
    // Initial check for scroll position
    handleScroll({ target: viewport } as unknown as Event);
    
    // Check scroll position after a short delay to account for content rendering
    const checkTimeout = setTimeout(() => {
      handleScroll({ target: viewport } as unknown as Event);
    }, 100);

    return () => {
      viewport.removeEventListener('scroll', handleScroll);
      clearTimeout(checkTimeout);
    };
  }, [handleScroll, messages, streamingAIMessageChunks]);
  
  // Effect for initial scroll to bottom on page load
  React.useEffect(() => {
    if (initialLoadRef.current && messages && messages.length > 0 && viewportRef.current) {
      // Use a timeout to ensure content is rendered before scrolling
      const initialScrollTimeout = setTimeout(() => {
        if (viewportRef.current) {
          viewportRef.current.scrollTo({
            top: viewportRef.current.scrollHeight,
            behavior: 'smooth'
          });
          initialLoadRef.current = false;
        }
      }, 100);
      
      return () => clearTimeout(initialScrollTimeout);
    }
  }, [messages]);
  
  // Reset initialLoadRef when chat ID changes
  React.useEffect(() => {
    // Reset the initial load flag when the chat ID changes
    initialLoadRef.current = true;
    
    // Attempt to scroll to bottom after a short delay
    if (id && id !== "new") {
      const resetScrollTimeout = setTimeout(() => {
        if (viewportRef.current && messages && messages.length > 0) {
          viewportRef.current.scrollTo({
            top: viewportRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 200);
      
      return () => clearTimeout(resetScrollTimeout);
    }
  }, [id]);
  
  // Scroll to bottom when streaming messages change
  React.useEffect(() => {
    // Only auto-scroll if we're already near the bottom or if this is the first message chunk
    if (viewportRef.current && streamingAIMessageChunks.length > 0) {
      const viewport = viewportRef.current;
      const isNearBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 100;
      
      if (isNearBottom || streamingAIMessageChunks.length === 1) {
        // Use requestAnimationFrame to ensure smooth scrolling during streaming
        requestAnimationFrame(() => {
          if (viewportRef.current) {
            viewportRef.current.scrollTo({
              top: viewportRef.current.scrollHeight,
              behavior: streamingAIMessageChunks.length === 1 ? 'smooth' : 'auto'
            });
          }
        });
      }
    }
  }, [streamingAIMessageChunks]);
  
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
          className="absolute z-50 bottom-4 left-1/2 -translate-x-1/2 rounded-full shadow-md hover:bg-accent bg-background/80 backdrop-blur-sm"
          onClick={scrollToBottom}
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
});

Messages.displayName = "Messages"; 