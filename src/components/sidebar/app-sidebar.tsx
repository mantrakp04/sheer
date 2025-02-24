// src/components/sidebar/app-sidebar.tsx
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { routes } from "@/routes";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MessageSquare, Plus, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { useLiveQuery } from "dexie-react-hooks";
import { ChatHistoryDB } from "@/lib/chat/memory";
import { useState } from "react";
import { toast } from "sonner";

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const chats = useLiveQuery(async () => {
    return await new ChatHistoryDB().sessions.toArray();
  });
  const [hoveringId, setHoveringId] = useState<string | null>(null);

  return (
    <Sidebar>
      <SidebarHeader className="flex flex-row items-center justify-between border-b">
        <span className="text-lg font-bold">Sheer</span>
        <Link to="/chat/new">
          <Button variant="ghost" size="icon">
            <Plus />
          </Button>
        </Link>
      </SidebarHeader>
      <SidebarContent className="gap-0">
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {routes.map((route) => (
                <SidebarMenuItem key={route.path}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === route.path}
                  >
                    <Link to={route.path}>
                      {route.icon}
                      <span>{route.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Chats</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {chats?.map((chat) => (
                <SidebarMenuItem key={chat.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === `/chat/${chat.id}`}
                      className="flex flex-row items-center justify-between overflow-hidden"
                      onMouseEnter={() => setHoveringId(chat.id)}
                      onMouseLeave={() => setHoveringId(null)}
                    >
                      <Link to={`/chat/${chat.id}`} className="flex w-full items-center">
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <MessageSquare className="h-4 w-4 shrink-0" />
                          <span className="truncate">{chat.name}</span>
                        </div>
                        <button 
                          className={`ml-2 shrink-0 transition-transform duration-200 hover:text-destructive ${
                            hoveringId === chat.id || location.pathname === `/chat/${chat.id}` 
                              ? 'translate-x-0' 
                              : 'translate-x-[200%]'
                          }`}
                          onClick={() => {
                            new ChatHistoryDB().sessions.delete(chat.id);
                            toast.success("Chat deleted");
                            return navigate("/chat/new", { replace: true });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
