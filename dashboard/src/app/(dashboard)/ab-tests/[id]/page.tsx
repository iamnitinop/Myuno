"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LS } from "@/lib/utils";
import { AccountData, ABTest } from "@/lib/types";
import { ABTestForm } from "@/components/features/campaigns/ABTestForm";

const KEY_DATA = (accountId: string) => `demo_account_${accountId}_data_v3`;

export default function EditABTestPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const accountId = "ACC_DEMO_001";
    const [test, setTest] = useState<ABTest | null>(null);

    useEffect(() => {
        const data: AccountData = LS.get(KEY_DATA(accountId), null);
        if (data && data.abTests) {
            const found = data.abTests.find(t => t.id === params.id);
            if (found) {
                setTest(found);
            } else {
                router.push("/ab-tests"); // Not found
            }
        } else {
            router.push("/ab-tests");
        }
    }, [params.id, router]);

    const handleSave = (updatedTest: ABTest) => {
        const data: AccountData = LS.get(KEY_DATA(accountId), null);
        if (data) {
            const updatedTests = (data.abTests || []).map(t =>
                t.id === updatedTest.id ? updatedTest : t
            );

            const newData = {
                ...data,
                abTests: updatedTests
            };
            LS.set(KEY_DATA(accountId), newData);
            router.push("/ab-tests");
        }
    };

    if (!test) return <div>Loading...</div>;

    return <ABTestForm initialData={test} onSave={handleSave} />;
}
