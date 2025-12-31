import React from "react";
import { AdvancedTargetingRules, RuleGroup as RuleGroupType, LogicalOperator } from "@/lib/types";
import { RuleGroup } from "./RuleGroup";
import { Button } from "@/components/ui/Button";
import { createEmptyRuleGroup } from "@/lib/rule-migration";

interface RuleBuilderProps {
    rules: AdvancedTargetingRules;
    onChange: (rules: AdvancedTargetingRules) => void;
}

export function RuleBuilder({ rules, onChange }: RuleBuilderProps) {
    const handleGroupChange = (index: number, newGroup: RuleGroupType) => {
        const newGroups = [...rules.ruleGroups];
        newGroups[index] = newGroup;
        onChange({ ...rules, ruleGroups: newGroups });
    };

    const handleDeleteGroup = (index: number) => {
        const newGroups = rules.ruleGroups.filter((_, i) => i !== index);
        onChange({ ...rules, ruleGroups: newGroups });
    };

    const addGroup = () => {
        const newGroups = [...rules.ruleGroups, createEmptyRuleGroup()];
        onChange({ ...rules, ruleGroups: newGroups });
    };

    const toggleGroupOperator = () => {
        const newOp: LogicalOperator = rules.groupOperator === "AND" ? "OR" : "AND";
        onChange({ ...rules, groupOperator: newOp });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    I want to <span className="inline-block px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">show pop up</span> to visitors that match the following conditions:
                </div>
            </div>

            <div className="space-y-4">
                {rules.ruleGroups.map((group, index) => (
                    <React.Fragment key={group.id}>
                        {index > 0 && (
                            <div className="flex justify-center my-4">
                                <button
                                    onClick={toggleGroupOperator}
                                    className={`
                                        bg-cyan-200 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300
                                        px-4 py-1.5 rounded text-sm font-bold uppercase tracking-wider
                                        hover:bg-cyan-300 dark:hover:bg-cyan-900/60 transition-colors
                                        cursor-pointer select-none
                                        flex items-center gap-1
                                        shadow-sm
                                        clip-path-slant
                                    `}
                                    style={{
                                        clipPath: "polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0 100%)"
                                    }}
                                >
                                    {rules.groupOperator}
                                    <span className="font-normal normal-case opacity-70 ml-1 text-xs">
                                        (click to change)
                                    </span>
                                </button>
                            </div>
                        )}
                        <RuleGroup
                            group={group}
                            onChange={(g) => handleGroupChange(index, g)}
                            onDelete={() => handleDeleteGroup(index)}
                            showDelete={rules.ruleGroups.length > 0}
                        />
                    </React.Fragment>
                ))}
            </div>

            <div className="flex justify-center pt-4">
                <Button onClick={addGroup} className="bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20">
                    <span className="text-lg mr-1">+</span> Add Rule Set
                </Button>
            </div>
        </div>
    );
}
