import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { routes } from "@/routes";
import Layout from "@/layout";
import { Toaster } from "sonner";
import { ChatPage } from "./pages/chat/page";

function App() {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
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
        </Routes>
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
