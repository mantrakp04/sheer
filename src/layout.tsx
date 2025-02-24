import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner"
import React from "react";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex flex-col w-full">
        <div className="fixed p-4 z-50 opacity-0 hover:opacity-100">
          <SidebarTrigger />
        </div>
        {children}
        <Toaster />
      </main>
    </SidebarProvider>
  );
}
