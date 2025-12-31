/**
 * Rule Condition Editor Component
 * 
 * Edits a single rule condition (type, operator, value)
 */

import React from 'react';
import { AdvancedRuleCondition, RuleType, RuleOperator } from '@/lib/types';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface RuleConditionEditorProps {
    condition: AdvancedRuleCondition;
    onChange: (condition: AdvancedRuleCondition) => void;
    onRemove: () => void;
}

const RULE_TYPES: { value: RuleType; label: string }[] = [
    { value: 'current_url', label: 'Current URL' },
    { value: 'first_url', label: 'First URL visitor came to this session' },
    { value: 'referring_url', label: 'Referring URL' },
];

const OPERATORS: { value: RuleOperator; label: string }[] = [
    { value: 'contains', label: 'contains' },
    { value: 'does_not_contain', label: 'does not contain' },
    { value: 'is_equal_to', label: 'is equal to' },
    { value: 'is_not_equal_to', label: 'is not equal to' },
    { value: 'matches_regex', label: 'matches regex' },
    { value: 'matches_wildcard', label: 'matches wildcard' },
];

export function RuleConditionEditor({ condition, onChange, onRemove }: RuleConditionEditorProps) {
    return (
        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            {/* Rule Type */}
            <div className="flex-1 min-w-[200px]">
                <select
                    value={condition.type}
                    onChange={(e) => onChange({ ...condition, type: e.target.value as RuleType })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {RULE_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                            {type.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Operator */}
            <div className="flex-1 min-w-[150px]">
                <select
                    value={condition.operator}
                    onChange={(e) => onChange({ ...condition, operator: e.target.value as RuleOperator })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {OPERATORS.map(op => (
                        <option key={op.value} value={op.value}>
                            {op.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Value */}
            <div className="flex-1 min-w-[200px]">
                <input
                    type="text"
                    value={condition.value}
                    onChange={(e) => onChange({ ...condition, value: e.target.value })}
                    placeholder="Enter value..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Remove Button */}
            <button
                type="button"
                onClick={onRemove}
                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                title="Remove condition"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
}
