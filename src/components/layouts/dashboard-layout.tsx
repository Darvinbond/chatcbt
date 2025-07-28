"use client";

import { ReactNode } from "react";
import { DashboardProvider, useDashboard } from "@/components/providers/dashboard-provider";
import { ArtifactProvider } from "@/components/providers/artifact-provider";
import { Sidebar, SidebarContent } from "@/components/layouts/sidebar";
import { Header } from "@/components/layouts/header";
import { Artifact } from "@/components/layouts/artifact";

interface DashboardLayoutProps {
  children: ReactNode;
}

function Layout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-white text-black">
      <Sidebar />
      <div className="flex-1 h-full overflow-y-auto flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
      </div>
      <Artifact />
    </div>
  );
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <ArtifactProvider>
      <DashboardProvider>
        <Layout>{children}</Layout>
      </DashboardProvider>
    </ArtifactProvider>
  );
}
