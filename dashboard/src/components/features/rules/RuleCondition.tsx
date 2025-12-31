import React from "react";
import { AdvancedRuleCondition, RuleType, RuleOperator } from "@/lib/types";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface RuleConditionProps {
    condition: AdvancedRuleCondition;
    onChange: (condition: AdvancedRuleCondition) => void;
    onDelete: () => void;
}

const RULE_TYPE_OPTIONS: { value: RuleType; label: string }[] = [
    { value: "current_url", label: "Current URL" },
    { value: "referring_url", label: "Referring URL" },
    { value: "previous_domain_referring_url", label: "Previous Domain Referring URL" },
    { value: "first_url", label: "First URL visitor came to this session" },
];

const OPERATOR_OPTIONS: { value: RuleOperator; label: string }[] = [
    { value: "contains", label: "contains" },
    { value: "does_not_contain", label: "does not contain" },
    { value: "is_equal_to", label: "is equal to" },
    { value: "is_not_equal_to", label: "is not equal to" },
    { value: "matches_regex", label: "matches regex" },
    { value: "matches_wildcard", label: "matches wildcard" },
];

export function RuleCondition({ condition, onChange, onDelete }: RuleConditionProps) {
    const handleChange = (field: keyof AdvancedRuleCondition, value: string) => {
        onChange({
            ...condition,
            [field]: value,
        });
    };

    return (
        <div className="flex items-start gap-2 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg group">
            <div className="flex-1 grid grid-cols-12 gap-2">
                <div className="col-span-4">
                    <Select
                        value={condition.type}
                        onChange={(e) => handleChange("type", e.target.value)}
                        options={RULE_TYPE_OPTIONS}
                    />
                </div>
                <div className="col-span-3">
                    <Select
                        value={condition.operator}
                        onChange={(e) => handleChange("operator", e.target.value)}
                        options={OPERATOR_OPTIONS}
                    />
                </div>
                <div className="col-span-5">
                    <Input
                        value={condition.value}
                        onChange={(e) => handleChange("value", e.target.value)}
                        placeholder="Value..."
                    />
                </div>
            </div>
            <Button
                kind="danger"
                onClick={onDelete}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 h-auto aspect-square flex items-center justify-center"
                title="Remove condition"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                </svg>
            </Button>
        </div>
    );
}
