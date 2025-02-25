import React from "react";
import { Button } from "@/components/ui/button";
import { ClipboardCopy } from "lucide-react";
import { toast } from "sonner";
import { MessageProps } from "../types";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import { Badge } from "@/components/ui/badge";
import "katex/dist/katex.min.css";

export const AIMessageComponent = React.memo(({ message }: MessageProps) => {
  const handleCopy = React.useCallback(() => {
    const content = String(message.content);
    navigator.clipboard.writeText(content)
      .then(() => toast.success("Response copied to clipboard"))
      .catch(() => toast.error("Failed to copy response"));
  }, [message.content]);

  return (
    <div className="flex flex-col gap-1 group">
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkMath, remarkGfm]}
          rehypePlugins={[rehypeKatex]}
          components={{
            p(props) {
              return <p {...props} className="leading-7 mb-4" />;
            },
            h1(props) {
              return <h1 {...props} className="text-3xl font-bold tracking-tight mb-4 mt-8" />;
            },
            h2(props) {
              return <h2 {...props} className="text-2xl font-semibold tracking-tight mb-4 mt-8" />;
            },
            h3(props) {
              return <h3 {...props} className="text-xl font-semibold tracking-tight mb-4 mt-6" />;
            },
            h4(props) {
              return <h4 {...props} className="text-lg font-semibold tracking-tight mb-4 mt-6" />;
            },
            code(props) {
              const {children, className, ...rest} = props;
              const match = /language-(\w+)/.exec(className || '');
              const language = match ? match[1] : '';
              const code = String(children).replace(/\n$/, '');

              const copyToClipboard = () => {
                navigator.clipboard.writeText(code);
                toast.success("Code copied to clipboard");
              };

              return match ? (
                <div className="relative rounded-md overflow-hidden my-6">
                  <div className="absolute right-2 top-2 flex items-center gap-2">
                    {language && (
                      <Badge variant="secondary" className="text-xs font-mono">
                        {language}
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 bg-muted/50 hover:bg-muted"
                      onClick={copyToClipboard}
                    >
                      <ClipboardCopy className="h-3 w-3" />
                    </Button>
                  </div>
                  <SyntaxHighlighter
                    style={oneDark}
                    language={language}
                    PreTag="div"
                    customStyle={{ margin: 0, borderRadius: 0, padding: "1.5rem" }}
                  >
                    {code}
                  </SyntaxHighlighter>
                </div>
              ) : (
                <code {...rest} className={`${className} bg-muted px-1.5 py-0.5 rounded-md text-sm`}>
                  {children}
                </code>
              );
            },
            a(props) {
              return <a {...props} className="text-primary hover:underline font-medium" target="_blank" rel="noopener noreferrer" />;
            },
            table(props) {
              return <div className="my-6 w-full overflow-y-auto"><table {...props} className="w-full border-collapse table-auto" /></div>;
            },
            th(props) {
              return <th {...props} className="border border-muted-foreground px-4 py-2 text-left font-semibold" />;
            },
            td(props) {
              return <td {...props} className="border border-muted-foreground px-4 py-2" />;
            },
            blockquote(props) {
              return <blockquote {...props} className="mt-6 border-l-4 border-primary pl-6 italic" />;
            },
            ul(props) {
              return <ul {...props} className="my-6 ml-6 list-disc [&>li]:mt-2" />;
            },
            ol(props) {
              return <ol {...props} className="my-6 ml-6 list-decimal [&>li]:mt-2" />;
            },
            li(props) {
              return <li {...props} className="leading-7" />;
            },
            hr(props) {
              return <hr {...props} className="my-6 border-muted" />;
            }
          }}
        >
          {String(message.content)}
        </ReactMarkdown>
      </div>
      <div className="flex flex-row gap-1 opacity-0 group-hover:opacity-100">
        <Button variant="ghost" size="sm" onClick={handleCopy}>
          <ClipboardCopy className="h-4 w-4 mr-2" />
          Copy response
        </Button>
      </div>
    </div>
  );
});

AIMessageComponent.displayName = "AIMessageComponent"; 