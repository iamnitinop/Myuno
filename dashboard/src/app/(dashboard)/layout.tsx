import React from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100">
            <Sidebar />
            <div className="pl-20">
                <Header />
                <main className="p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
