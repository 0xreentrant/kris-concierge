import { type RouteConfig, index } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  { path: "api/calendar", file: "routes/api.calendar.ts" },
  { path: "api/chat", file: "routes/api.chat.ts" } // Added chat route
] satisfies RouteConfig;
