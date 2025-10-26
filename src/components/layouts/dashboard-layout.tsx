"use client";

import { ReactNode } from "react";
import { DashboardProvider, useDashboard } from "@/components/providers/dashboard-provider";
import { ArtifactProvider } from "@/components/providers/artifact-provider";
import { SidebarProvider, useSidebar } from "@/components/providers/sidebar-provider";
import { Sidebar, SidebarContent } from "@/components/layouts/sidebar";
import { Header } from "@/components/layouts/header";
import { Artifact } from "@/components/layouts/artifact";

interface DashboardLayoutProps {
  children: ReactNode;
}

function Layout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overscroll-none overflow-hidden bg-white text-black">
      <Sidebar />
      <div id="dashboard-scroll-container" className="flex-1 h-full overscroll-none overflow-y-auto flex flex-col">
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
      <SidebarProvider>
        <DashboardProvider>
          <Layout>{children}</Layout>
        </DashboardProvider>
      </SidebarProvider>
    </ArtifactProvider>
  );
}
