import { type RouteConfig, index } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  { path: "api/calendar", file: "routes/api.calendar.ts" }
] satisfies RouteConfig;
