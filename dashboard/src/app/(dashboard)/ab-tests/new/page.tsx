"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ABTest } from "@/lib/types";
import { ABTestForm } from "@/components/features/campaigns/ABTestForm";
import { apiFetch } from "@/lib/api";

export default function NewABTestPage() {
    const router = useRouter();

    const handleSave = async (testToSave: ABTest) => {
        try {
            await apiFetch("/ab-tests", {
                method: "POST",
                body: JSON.stringify(testToSave)
            });
            router.push("/ab-tests");
        } catch (err) {
            console.error("Failed to save AB test", err);
            alert("Failed to save test");
        }
    };

    return <ABTestForm onSave={handleSave} />;
}

