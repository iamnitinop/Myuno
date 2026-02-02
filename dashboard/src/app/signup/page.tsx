"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { apiFetch } from "@/lib/api";
import { LS } from "@/lib/utils";

export default function SignupPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [domain, setDomain] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const data = await apiFetch("/auth/signup", {
                method: "POST",
                body: JSON.stringify({ email, password, storeDomain: domain }),
            });

            LS.set("accessToken", data.accessToken);
            LS.set("refreshToken", data.refreshToken);
            LS.set("accountId", data.accountId);
            LS.set("userEmail", email); // Store user email for profile
            LS.set("userPlan", "Free Trial"); // Store initial plan info
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

            <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row z-10">
                {/* Left: Signup Form */}
                <div className="flex-1 p-8 md:p-12">
                    <div className="flex justify-center mb-8">
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Justuno</h1>
                    </div>

                    <h2 className="text-xl font-bold mb-6 text-gray-900">Create your account</h2>

                    <form onSubmit={handleSignup} className="space-y-4">
                        <Input
                            label="Work Email"
                            type="email"
                            placeholder="name@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <Input
                            label="Store Website"
                            type="text"
                            placeholder="example.com"
                            value={domain}
                            onChange={(e) => setDomain(e.target.value)}
                            required
                        />
                        <Input
                            label="Password"
                            type="password"
                            placeholder="Create a strong password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />

                        {error && <div className="text-red-500 text-sm">{error}</div>}

                        <Button kind="success" className="w-full" disabled={loading}>
                            {loading ? "Creating Account..." : "Start Free Trial"}
                        </Button>
                    </form>

                    <div className="mt-8 text-center text-xs text-gray-500">
                        Already have an account? <Link href="/login" className="underline hover:text-gray-800">Log In</Link>
                    </div>
                </div>

                {/* Right: Promo Area */}
                <div className="hidden md:flex flex-1 bg-[#F0FDF4] p-12 flex-col justify-center items-center text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200/50 rounded-full -mr-16 -mt-16 blur-2xl"></div>

                    <h3 className="font-serif italic text-3xl mb-4 text-gray-900">Grow Your Business</h3>
                    <p className="text-sm text-gray-600 max-w-xs leading-relaxed">
                        Join thousands of brands using Justuno to convert more traffic into sales.
                    </p>

                    <ul className="mt-6 text-sm text-left space-y-2 text-gray-700">
                        <li className="flex items-center gap-2">✓ Advanced Targeting</li>
                        <li className="flex items-center gap-2">✓ A/B Testing</li>
                        <li className="flex items-center gap-2">✓ Analytics & Insights</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
