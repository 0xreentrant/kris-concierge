import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';

export namespace Route {
  export type ActionArgs = ActionFunctionArgs;
  export type LoaderArgs = LoaderFunctionArgs;
} 