"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ABTest } from "@/lib/types";
import { ABTestForm } from "@/components/features/campaigns/ABTestForm";
import { apiFetch } from "@/lib/api";

export default function EditABTestPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [test, setTest] = useState<ABTest | null>(null);

    useEffect(() => {
        const fetchTest = async () => {
            try {
                const data = await apiFetch(`/ab-tests/${params.id}`);
                setTest(data);
            } catch (err) {
                console.error("Failed to load AB test", err);
                router.push("/ab-tests");
            }
        };
        fetchTest();
    }, [params.id, router]);

    const handleSave = async (updatedTest: ABTest) => {
        try {
            await apiFetch(`/ab-tests/${params.id}`, {
                method: "PATCH",
                body: JSON.stringify(updatedTest)
            });
            router.push("/ab-tests");
        } catch (err) {
            console.error("Failed to update AB test", err);
            alert("Failed to update test");
        }
    };

    if (!test) return <div className="p-8">Loading...</div>;

    return <ABTestForm initialData={test} onSave={handleSave} />;
}

