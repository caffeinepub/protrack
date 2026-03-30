import { useEffect, useState } from "react";
import { UserRole } from "./backend";
import Layout from "./components/Layout";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import ClientsPage from "./pages/ClientsPage";
import DashboardPage from "./pages/DashboardPage";
import InvoiceDetailPage from "./pages/InvoiceDetailPage";
import InvoicesPage from "./pages/InvoicesPage";
import LoginPage from "./pages/LoginPage";
import PendingApprovalPage from "./pages/PendingApprovalPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import ProjectsPage from "./pages/ProjectsPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import UserManagementPage from "./pages/UserManagementPage";

export type Page =
  | { name: "dashboard" }
  | { name: "projects" }
  | { name: "project-detail"; projectId: bigint }
  | { name: "invoices" }
  | { name: "invoice-detail"; invoiceId: bigint }
  | { name: "clients" }
  | { name: "reports" }
  | { name: "settings" }
  | { name: "users" };

// Extended interface for auth methods added by the authorization component
interface AuthBackend {
  registerCaller(): Promise<void>;
}

const Spinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-[#0B1220] text-white">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
  </div>
);

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const { actor } = useActor();
  const [currentPage, setCurrentPage] = useState<Page>({ name: "dashboard" });
  const [darkMode, setDarkMode] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [roleLoading, setRoleLoading] = useState(false);

  useEffect(() => {
    if (!actor || !identity || identity.getPrincipal().isAnonymous()) {
      setUserRole(null);
      return;
    }

    let cancelled = false;

    const initRole = async () => {
      setRoleLoading(true);
      try {
        await (actor as unknown as AuthBackend).registerCaller();
        if (cancelled) return;
        const role = await actor.getCallerUserRole();
        if (!cancelled) {
          setUserRole(role);
        }
      } catch (e) {
        console.error("Failed to initialize user role:", e);
      } finally {
        if (!cancelled) setRoleLoading(false);
      }
    };

    initRole();
    return () => {
      cancelled = true;
    };
  }, [actor, identity]);

  if (isInitializing) return <Spinner />;

  if (!identity || identity.getPrincipal().isAnonymous()) {
    return <LoginPage />;
  }

  if (!actor) return <Spinner />;

  if (roleLoading || userRole === null) return <Spinner />;

  if (userRole === UserRole.guest) {
    return <PendingApprovalPage />;
  }

  const renderPage = () => {
    switch (currentPage.name) {
      case "dashboard":
        return <DashboardPage actor={actor} navigate={setCurrentPage} />;
      case "projects":
        return <ProjectsPage actor={actor} navigate={setCurrentPage} />;
      case "project-detail":
        return (
          <ProjectDetailPage
            actor={actor}
            projectId={currentPage.projectId}
            navigate={setCurrentPage}
          />
        );
      case "invoices":
        return <InvoicesPage actor={actor} navigate={setCurrentPage} />;
      case "invoice-detail":
        return (
          <InvoiceDetailPage
            actor={actor}
            invoiceId={currentPage.invoiceId}
            navigate={setCurrentPage}
          />
        );
      case "clients":
        return <ClientsPage actor={actor} navigate={setCurrentPage} />;
      case "reports":
        return <ReportsPage actor={actor} navigate={setCurrentPage} />;
      case "settings":
        return <SettingsPage actor={actor} navigate={setCurrentPage} />;
      case "users":
        return (
          <UserManagementPage
            actor={actor}
            navigate={setCurrentPage}
            identity={identity}
          />
        );
      default:
        return <DashboardPage actor={actor} navigate={setCurrentPage} />;
    }
  };

  return (
    <div className={darkMode ? "dark" : ""}>
      <Layout
        actor={actor}
        currentPage={currentPage.name}
        navigate={setCurrentPage}
        darkMode={darkMode}
        toggleDarkMode={() => setDarkMode(!darkMode)}
        userRole={userRole}
      >
        {renderPage()}
      </Layout>
    </div>
  );
}
