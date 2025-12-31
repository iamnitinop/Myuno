/**
 * Rule Group Editor Component
 * 
 * Manages a group of conditions with AND/OR logic
 */

import React from 'react';
import { RuleGroup, AdvancedRuleCondition } from '@/lib/types';
import { RuleConditionEditor } from './RuleConditionEditor';
import { AndOrToggle } from './AndOrToggle';
import { createEmptyCondition } from '@/lib/rule-migration';

interface RuleGroupEditorProps {
    group: RuleGroup;
    onChange: (group: RuleGroup) => void;
    onRemove: () => void;
    groupIndex: number;
}

export function RuleGroupEditor({ group, onChange, onRemove, groupIndex }: RuleGroupEditorProps) {
    const handleConditionChange = (index: number, condition: AdvancedRuleCondition) => {
        const newConditions = [...group.conditions];
        newConditions[index] = condition;
        onChange({ ...group, conditions: newConditions });
    };

    const handleConditionRemove = (index: number) => {
        const newConditions = group.conditions.filter((_, i) => i !== index);
        onChange({ ...group, conditions: newConditions });
    };

    const handleAddCondition = () => {
        const newCondition = createEmptyCondition();
        onChange({ ...group, conditions: [...group.conditions, newCondition] });
    };

    return (
        <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900">
            {/* Group Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Rule Group {groupIndex + 1}
                </h3>
                <button
                    type="button"
                    onClick={onRemove}
                    className="text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1 rounded-md transition-colors"
                >
                    Remove Group
                </button>
            </div>

            {/* Conditions */}
            <div className="space-y-3">
                {group.conditions.map((condition, index) => (
                    <React.Fragment key={condition.id}>
                        <RuleConditionEditor
                            condition={condition}
                            onChange={(cond) => handleConditionChange(index, cond)}
                            onRemove={() => handleConditionRemove(index)}
                        />

                        {/* AND/OR toggle between conditions */}
                        {index < group.conditions.length - 1 && (
                            <AndOrToggle
                                value={group.conditionOperator}
                                onChange={(op) => onChange({ ...group, conditionOperator: op })}
                            />
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Add Condition Button */}
            <button
                type="button"
                onClick={handleAddCondition}
                className="mt-4 w-full px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 rounded-md transition-colors border border-blue-200 dark:border-blue-800"
            >
                + Add Condition
            </button>
        </div>
    );
}
