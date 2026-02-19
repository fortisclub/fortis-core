import React from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { SortConfig } from '../hooks/useTableSort';

interface SortableTableHeaderProps {
    label: string;
    sortKey: string;
    sortConfig: SortConfig;
    requestSort: (key: string) => void;
    className?: string;
}

export const SortableTableHeader: React.FC<SortableTableHeaderProps> = ({
    label,
    sortKey,
    sortConfig,
    requestSort,
    className = ""
}) => {
    const isActive = sortConfig.key === sortKey;
    const direction = isActive ? sortConfig.direction : null;

    return (
        <th
            className={`px-6 py-4 text-xs font-black text-fortis-mid uppercase tracking-widest cursor-pointer hover:text-white transition-colors group ${className}`}
            onClick={() => requestSort(sortKey)}
        >
            <div className="flex items-center gap-2">
                {label}
                <div className={`transition-colors ${isActive ? 'text-fortis-brand' : 'text-fortis-mid opacity-20 group-hover:opacity-100'}`}>
                    {direction === 'asc' ? (
                        <ChevronUp size={14} />
                    ) : direction === 'desc' ? (
                        <ChevronDown size={14} />
                    ) : (
                        <ChevronsUpDown size={14} />
                    )}
                </div>
            </div>
        </th>
    );
};
