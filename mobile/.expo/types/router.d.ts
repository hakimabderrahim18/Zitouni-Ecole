/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(auth)/login` | `/(tabs)` | `/(tabs)/` | `/(tabs)/exit-permits` | `/(tabs)/messages` | `/(tabs)/profile` | `/(tabs)\students` | `/..\src\components\DashboardHeader` | `/..\src\components\NavigationDrawer` | `/..\src\components\SchoolLogo` | `/..\src\store\useNotificationStore` | `/..\src\store\useSchoolStore` | `/_sitemap` | `/exit-permits` | `/login` | `/messages` | `/profile`;
      DynamicRoutes: never;
      DynamicRouteTemplate: never;
    }
  }
}
