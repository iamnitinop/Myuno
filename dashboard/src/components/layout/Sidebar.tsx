"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
    LayoutDashboard,
    Megaphone,
    Palette,
    BarChart3,
    Settings,
    Split,
    LogOut,
    User
} from "lucide-react";
import clsx from "clsx";
import { Tooltip } from "@/components/ui/Tooltip";
import { LS } from "@/lib/utils";

const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Campaigns", href: "/campaigns", icon: Megaphone },
    { name: "Templates", href: "/templates", icon: Palette },
    { name: "A/B Tests", href: "/ab-tests", icon: Split },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [userEmail, setUserEmail] = useState("");
    const [userPlan, setUserPlan] = useState("Free Plan");

    useEffect(() => {
        // Get user data from localStorage
        const email = LS.get("userEmail", "user@example.com");
        const plan = LS.get("userPlan", "Free Plan");
        setUserEmail(email);
        setUserPlan(plan);
    }, []);

    const handleLogout = () => {
        // Clear ALL localStorage to prevent data sharing between accounts
        localStorage.clear();

        // Redirect to login
        router.push("/login");
    };

    return (
        <aside className="w-20 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-black h-screen fixed left-0 top-0 flex flex-col z-[100]">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-center">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 flex items-center justify-center text-white font-bold text-lg">
                    M
                </div>
            </div>
            <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Tooltip key={item.href} content={item.name} position="right">
                            <Link
                                href={item.href}
                                className={clsx(
                                    "flex items-center justify-center w-full h-12 rounded-lg transition-colors",
                                    isActive
                                        ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                                        : "text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
                                )}
                            >
                                <item.icon className="w-5 h-5" />
                            </Link>
                        </Tooltip>
                    );
                })}
            </nav>
            <div className="p-3 border-t border-gray-200 dark:border-gray-800 relative">
                <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center justify-center w-full hover:opacity-80 transition-opacity"
                >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-violet-500 flex items-center justify-center text-white font-semibold text-sm">
                        {userEmail.charAt(0).toUpperCase()}
                    </div>
                </button>

                {showProfileMenu && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowProfileMenu(false)}
                        />
                        {/* Dropdown Menu */}
                        <div className="absolute bottom-full left-20 mb-2 w-80 bg-gray-800 dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-700 z-50 overflow-hidden">
                            {/* User Info Section */}
                            <div className="p-4 border-b border-gray-700 bg-gray-900/50">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 to-violet-500 flex items-center justify-center text-white font-semibold">
                                        {userEmail.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate">
                                            {userEmail}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {userPlan}
                                        </p>
                                    </div>
                                </div>
                                {/* Account Number Display */}
                                <div className="mb-3 px-2 py-1 bg-gray-800 rounded border border-gray-700">
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-0.5">Account Number:</p>
                                    <p className="text-xs font-mono text-red-500 truncate select-all">
                                        {LS.get("accountId", "Loading...")}
                                    </p>
                                </div>

                                <button className="w-full py-2 px-4 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors">
                                    Upgrade Account
                                </button>
                            </div>

                            {/* Menu Options */}
                            <div className="p-2">
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    <button className="p-3 text-left text-sm text-gray-300 hover:bg-gray-800 rounded-lg transition-colors">
                                        Account Settings
                                    </button>
                                    <button className="p-3 text-left text-sm text-gray-300 hover:bg-gray-800 rounded-lg transition-colors">
                                        Billing
                                    </button>
                                    <button className="p-3 text-left text-sm text-gray-300 hover:bg-gray-800 rounded-lg transition-colors">
                                        View Subscribers
                                    </button>
                                    <button className="p-3 text-left text-sm text-gray-300 hover:bg-gray-800 rounded-lg transition-colors">
                                        Manage Plan
                                    </button>
                                    <button className="p-3 text-left text-sm text-gray-300 hover:bg-gray-800 rounded-lg transition-colors">
                                        Embed Code
                                    </button>
                                    <button className="p-3 text-left text-sm text-gray-300 hover:bg-gray-800 rounded-lg transition-colors">
                                        Download Emails
                                    </button>
                                </div>
                                <button className="p-3 text-left text-sm text-gray-300 hover:bg-gray-800 rounded-lg transition-colors w-full">
                                    Refer a Friend
                                </button>
                            </div>

                            {/* Logout */}
                            <div className="p-2 border-t border-gray-700">
                                <button
                                    onClick={handleLogout}
                                    className="w-full p-3 text-left text-sm text-gray-300 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Logout
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </aside>
    );
}
