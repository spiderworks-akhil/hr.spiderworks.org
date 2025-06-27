"use client";

import { useState, useEffect } from "react";
import Head from "next/head";
import Header from "@/components/dashboard/Header";
import Sidebar from "@/components/dashboard/Sidebar";

export default function AdminDashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsMobileSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    if (isMobileView) {
      setIsMobileSidebarOpen(!isMobileSidebarOpen);
    } else {
      setIsSidebarOpen(!isSidebarOpen);
    }
  };

  const closeMobileSidebar = () => {
    if (isMobileView) {
      setIsMobileSidebarOpen(false);
    }
  };

  return (
    <>
      <Head>
        <title>Admin Dashboard</title>
        <meta name="description" content="Admin Dashboard" />
      </Head>

      <div className="flex flex-col min-h-screen">
        <Header
          toggleSidebar={toggleSidebar}
          isSidebarOpen={isSidebarOpen}
          isMobileView={isMobileView}
        />

        <div className="flex flex-1 pt-16">
          <Sidebar
            isOpen={isSidebarOpen}
            isMobileOpen={isMobileSidebarOpen}
            isMobileView={isMobileView}
            closeMobileSidebar={closeMobileSidebar}
          />

          <main
            className={`flex-1 bg-[#f8fafb] min-w-0 transition-all duration-300 ease-in-out ${
              isSidebarOpen && !isMobileView ? "md:ml-64" : "md:ml-20"
            }`}
          >
            <div className="p-2 md:p-4 overflow-auto">{children}</div>
          </main>
        </div>
      </div>
    </>
  );
}
