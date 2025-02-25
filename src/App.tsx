import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { routes } from "@/routes";
import Layout from "@/layout";
import { Toaster } from "sonner";
import { ChatPage } from "./pages/chat/page";
import { LoadingProvider } from "@/contexts/loading-context";
import { HuggingFaceCallback } from "./pages/integrations/huggingface-callback";

function App() {
  const queryClient = new QueryClient();
  
  // Get the base URL from Vite's import.meta.env
  // This will be set based on the `base` option in vite.config.ts
  const basename = import.meta.env.BASE_URL;

  return (
    <QueryClientProvider client={queryClient}>
      <LoadingProvider>
        <BrowserRouter basename={basename}>
          <Routes>
            {routes.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={
                  <Layout>
                    {route.component}
                  </Layout>
                }
              />
            ))}
            <Route
              key="chat"
              path="/chat/:id"
              element={
                <Layout>
                  <ChatPage />
                </Layout>
              }
            />
            <Route
              path="/integrations/huggingface-callback"
              element={<HuggingFaceCallback />}
            />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </LoadingProvider>
    </QueryClientProvider>
  );
}

export default App;
