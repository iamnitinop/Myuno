/**
 * Rule Builder Component
 * 
 * Main component for building advanced targeting rules with nested groups
 */

import React from 'react';
import { AdvancedTargetingRules, RuleGroup } from '@/lib/types';
import { RuleGroupEditor } from './RuleGroupEditor';
import { AndOrToggle } from './AndOrToggle';
import { createEmptyRuleGroup } from '@/lib/rule-migration';

interface RuleBuilderProps {
    rules: AdvancedTargetingRules;
    onChange: (rules: AdvancedTargetingRules) => void;
}

export function RuleBuilder({ rules, onChange }: RuleBuilderProps) {
    const handleGroupChange = (index: number, group: RuleGroup) => {
        const newGroups = [...rules.ruleGroups];
        newGroups[index] = group;
        onChange({ ...rules, ruleGroups: newGroups });
    };

    const handleGroupRemove = (index: number) => {
        const newGroups = rules.ruleGroups.filter((_, i) => i !== index);
        onChange({ ...rules, ruleGroups: newGroups });
    };

    const handleAddGroup = () => {
        const newGroup = createEmptyRuleGroup();
        onChange({ ...rules, ruleGroups: [...rules.ruleGroups, newGroup] });
    };

    return (
        <div className="space-y-4">
            {/* Rule Groups */}
            {rules.ruleGroups.map((group, index) => (
                <React.Fragment key={group.id}>
                    <RuleGroupEditor
                        group={group}
                        onChange={(g) => handleGroupChange(index, g)}
                        onRemove={() => handleGroupRemove(index)}
                        groupIndex={index}
                    />

                    {/* AND/OR toggle between groups */}
                    {index < rules.ruleGroups.length - 1 && (
                        <AndOrToggle
                            value={rules.groupOperator}
                            onChange={(op) => onChange({ ...rules, groupOperator: op })}
                            className="my-6"
                        />
                    )}
                </React.Fragment>
            ))}

            {/* Add Group Button */}
            <button
                type="button"
                onClick={handleAddGroup}
                className="w-full px-4 py-3 text-sm font-medium text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 rounded-lg transition-colors border-2 border-dashed border-green-300 dark:border-green-700"
            >
                + Add Rule Group
            </button>

            {/* Help Text */}
            {rules.ruleGroups.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p className="text-sm">No rules defined. Click "Add Rule Group" to get started.</p>
                    <p className="text-xs mt-2">Banner will show to all visitors when no rules are set.</p>
                </div>
            )}
        </div>
    );
}
