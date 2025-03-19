import type { Route } from "./+types/home";
import { Dashboard } from "../components/Dashboard";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Financial Dashboard" },
    { name: "description", content: "Weekly financial check-in dashboard" },
  ];
}

export default function Home() {
  return <Dashboard />;
}
