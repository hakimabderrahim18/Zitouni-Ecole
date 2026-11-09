/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(auth)/login` | `/(tabs)` | `/(tabs)/` | `/(tabs)/exit-permits` | `/(tabs)/messages` | `/(tabs)/profile` | `/(tabs)/students` | `/..\src\components\admin\AdminAccountsView` | `/..\src\components\admin\StudentModals` | `/..\src\components\admin\TeacherDossierModal` | `/..\src\components\chat\ConversationView` | `/..\src\components\dashboards\ParentDashboardView` | `/..\src\components\dashboards\ReceptionistDashboardView` | `/..\src\components\dashboards\StudentDashboardView` | `/..\src\components\dashboards\SupervisorDashboardView` | `/..\src\components\dashboards\TeacherDashboardView` | `/..\src\components\feed\CreatePostModal` | `/..\src\components\feed\EditPostModal` | `/..\src\components\feed\PostCard` | `/..\src\components\feed\PostOptionsMenuModal` | `/..\src\components\feed\PostViewersAnalyticsModal` | `/..\src\components\feed\SchoolFeedView` | `/..\src\components\feed\types` | `/..\src\services\socket` | `/_sitemap` | `/exit-permits` | `/login` | `/messages` | `/profile` | `/students`;
      DynamicRoutes: never;
      DynamicRouteTemplate: never;
    }
  }
}
