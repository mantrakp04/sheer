import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OthersProps } from "../types";

export const Others = ({ config }: OthersProps) => {
  if (!config) return null;

  return (
    <Card className="h-[calc(100vh-12rem)]">
      <CardHeader>
        <CardTitle>Other Settings</CardTitle>
        <CardDescription>Additional configuration options</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8 px-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Integrations</h3>
              <p className="text-sm text-muted-foreground">Connect to external services like Hugging Face to use their inference endpoints</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 