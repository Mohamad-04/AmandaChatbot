import { createBrowserRouter } from "react-router";
import { DashboardLayout } from "./components/DashboardLayout";
import { OverviewPage } from "./pages/OverviewPage";
import { UsersPage } from "./pages/UsersPage";
import { ConversationsPage } from "./pages/ConversationsPage";
import { RiskAlertsPage } from "./pages/RiskAlertsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { StudySessionsPage } from "./pages/StudySessionsPage";

export const router = createBrowserRouter(
  [
    {
      path: "/",
      Component: DashboardLayout,
      children: [
        { index: true, Component: OverviewPage },
        { path: "users", Component: UsersPage },
        { path: "conversations", Component: ConversationsPage },
        { path: "risk-alerts", Component: RiskAlertsPage },
        { path: "study-sessions", Component: StudySessionsPage },
        { path: "settings", Component: SettingsPage },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL }
);
