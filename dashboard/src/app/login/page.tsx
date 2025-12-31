"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { apiFetch } from "@/lib/api";
import { LS } from "@/lib/utils";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const data = await apiFetch("/auth/login", {
                method: "POST",
                body: JSON.stringify({ email, password }),
            });

            LS.set("accessToken", data.accessToken);
            LS.set("refreshToken", data.refreshToken);
            LS.set("accountId", data.accountId);
            LS.set("userEmail", email); // Store user email for profile
            LS.set("userPlan", "Justuno Plus - Monthly"); // Store plan info
            // Redirect to dashboard
            router.push("/");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#111827] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Abstract Background Decorations */}
            <div className="absolute top-10 left-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl" />

            {/* SVG Decorations roughly matching image */}
            <img src="https://cdn.justuno.com/images/decorators/circle-pattern-1.svg" className="absolute top-20 left-20 w-32 opacity-20 hidden md:block" alt="" />
            <img src="https://cdn.justuno.com/images/decorators/circle-pattern-2.svg" className="absolute bottom-20 right-20 w-32 opacity-20 hidden md:block" alt="" />

            <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row z-10">
                {/* Left: Login Form */}
                <div className="flex-1 p-8 md:p-12">
                    <div className="flex justify-center mb-8">
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Justuno</h1>
                    </div>

                    <h2 className="text-xl font-bold mb-6 text-gray-900">Login to Justuno</h2>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <Input
                            label="Email address"
                            type="email"
                            placeholder="Your email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <Input
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />

                        <div className="flex justify-end">
                            <Link href="/forgot-password" className="text-xs text-gray-500 underline hover:text-gray-800">
                                Forgot your password?
                            </Link>
                        </div>

                        {error && <div className="text-red-500 text-sm">{error}</div>}

                        <Button kind="success" className="w-full" disabled={loading}>
                            {loading ? "Logging in..." : "Log In"}
                        </Button>
                    </form>

                    <div className="mt-8 text-center text-xs text-gray-500">
                        Don't have a Justuno account? <Link href="/signup" className="underline hover:text-gray-800">Sign Up</Link>
                    </div>
                </div>

                {/* Right: Promo Area */}
                <div className="hidden md:flex flex-1 bg-[#FFF5F1] p-12 flex-col justify-center items-center text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200/50 rounded-full -mr-16 -mt-16 blur-2xl"></div>

                    <h3 className="font-serif italic text-3xl mb-4 text-gray-900">Justuno Plus</h3>
                    <p className="text-sm text-gray-600 max-w-xs leading-relaxed">
                        Unlimited traffic, strategic support, and AI-driven upsells.
                    </p>
                    <a href="#" className="mt-6 text-sm font-semibold underline decoration-2 decoration-gray-400 underline-offset-4 text-gray-900">Learn More</a>

                    {/* Decorative swirls could go here */}
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-300 to-transparent opacity-20"></div>
                </div>
            </div>
        </div>
    );
}
