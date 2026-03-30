import { useState } from "react";
import Layout from "./components/Layout";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import ClientsPage from "./pages/ClientsPage";
import DashboardPage from "./pages/DashboardPage";
import InvoiceDetailPage from "./pages/InvoiceDetailPage";
import InvoicesPage from "./pages/InvoicesPage";
import LoginPage from "./pages/LoginPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import ProjectsPage from "./pages/ProjectsPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";

export type Page =
  | { name: "dashboard" }
  | { name: "projects" }
  | { name: "project-detail"; projectId: bigint }
  | { name: "invoices" }
  | { name: "invoice-detail"; invoiceId: bigint }
  | { name: "clients" }
  | { name: "reports" }
  | { name: "settings" };

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const { actor } = useActor();
  const [currentPage, setCurrentPage] = useState<Page>({ name: "dashboard" });
  const [darkMode, setDarkMode] = useState(true);

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0B1220] text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!identity || identity.getPrincipal().isAnonymous()) {
    return <LoginPage />;
  }

  if (!actor) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0B1220] text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
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
      >
        {renderPage()}
      </Layout>
    </div>
  );
}
