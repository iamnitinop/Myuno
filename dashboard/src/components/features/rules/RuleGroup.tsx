import React from "react";
import { RuleGroup as RuleGroupType, AdvancedRuleCondition, LogicalOperator } from "@/lib/types";
import { RuleCondition } from "./RuleCondition";
import { Button } from "@/components/ui/Button";
import { createEmptyCondition } from "@/lib/rule-migration";

interface RuleGroupProps {
    group: RuleGroupType;
    onChange: (group: RuleGroupType) => void;
    onDelete: () => void;
    showDelete: boolean;
}

export function RuleGroup({ group, onChange, onDelete, showDelete }: RuleGroupProps) {
    const handleConditionChange = (index: number, newCondition: AdvancedRuleCondition) => {
        const newConditions = [...group.conditions];
        newConditions[index] = newCondition;
        onChange({ ...group, conditions: newConditions });
    };

    const handleDeleteCondition = (index: number) => {
        const newConditions = group.conditions.filter((_, i) => i !== index);
        onChange({ ...group, conditions: newConditions });
    };

    const addCondition = () => {
        const newConditions = [...group.conditions, createEmptyCondition()];
        onChange({ ...group, conditions: newConditions });
    };

    const toggleOperator = () => {
        const newOp: LogicalOperator = group.conditionOperator === "AND" ? "OR" : "AND";
        onChange({ ...group, conditionOperator: newOp });
    };

    return (
        <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-4 bg-gray-50/50 dark:bg-gray-900/50">
            {showDelete && (
                <button
                    onClick={onDelete}
                    className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm hover:bg-red-600 transition-colors z-10"
                    title="Remove group"
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
                </button>
            )}

            <div className="space-y-2">
                {group.conditions.map((condition, index) => (
                    <React.Fragment key={condition.id}>
                        {index > 0 && (
                            <div className="flex justify-center my-2">
                                <button
                                    onClick={toggleOperator}
                                    className={`
                                        bg-orange-200 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300
                                        px-3 py-1 rounded text-xs font-bold uppercase tracking-wider
                                        hover:bg-orange-300 dark:hover:bg-orange-900/60 transition-colors
                                        cursor-pointer select-none
                                        flex items-center gap-1
                                        border-y border-orange-300 dark:border-orange-800
                                        clip-path-slant
                                    `}
                                    style={{
                                        clipPath: "polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)"
                                    }}
                                >
                                    {group.conditionOperator}
                                    <span className="font-normal normal-case opacity-70 ml-1 text-[10px]">
                                        (click to change)
                                    </span>
                                </button>
                            </div>
                        )}
                        <RuleCondition
                            condition={condition}
                            onChange={(c) => handleConditionChange(index, c)}
                            onDelete={() => handleDeleteCondition(index)}
                        />
                    </React.Fragment>
                ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 flex justify-end">
                <Button kind="secondary" className="text-xs" onClick={addCondition}>
                    + Add Condition
                </Button>
            </div>
        </div>
    );
}
