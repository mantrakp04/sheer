import { HomePage } from "@/pages/home/page";
import { HomeIcon } from "lucide-react";

export const routes = [
  {
    path: "/",
    label: "Home",
    icon: <HomeIcon />,
    component: <HomePage />,
  }
];