import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ConfigManager } from "@/lib/config/manager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function HuggingFaceCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      try {
        // Get the authorization code from the URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        
        if (!code) {
          setStatus("error");
          setError("Authorization code not found in URL");
          return;
        }

        // Exchange the code for an access token
        const response = await fetch("https://huggingface.co/oauth/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            grant_type: "authorization_code",
            client_id: import.meta.env.VITE_HF_CLIENT_ID,
            client_secret: import.meta.env.VITE_HF_CLIENT_SECRET,
            redirect_uri: window.location.origin + '/integrations/huggingface-callback',
            code,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error_description || "Failed to exchange code for token");
        }

        const data = await response.json();
        const accessToken = data.access_token;

        // Store the access token in the config
        const configManager = ConfigManager.getInstance();
        await configManager.updateConfig({ hf_token: accessToken });

        setStatus("success");
      } catch (err) {
        console.error("Error during OAuth callback:", err);
        setStatus("error");
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      }
    }

    handleCallback();
  }, [navigate]);

  const handleNavigateHome = () => {
    navigate("/");
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Hugging Face Integration</CardTitle>
          <CardDescription>
            {status === "loading" && "Setting up your Hugging Face integration..."}
            {status === "success" && "Successfully connected to Hugging Face!"}
            {status === "error" && "Failed to connect to Hugging Face"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {status === "loading" && <Loader2 className="h-8 w-8 animate-spin" />}
          
          {status === "success" && (
            <>
              <div className="text-center text-sm text-muted-foreground">
                Your Hugging Face API token has been saved. You can now use Hugging Face models.
              </div>
              <Button onClick={handleNavigateHome}>Continue to Home</Button>
            </>
          )}
          
          {status === "error" && (
            <>
              <div className="text-center text-sm text-destructive">
                {error || "An error occurred while connecting to Hugging Face."}
              </div>
              <Button variant="outline" onClick={handleNavigateHome}>Back to Home</Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 