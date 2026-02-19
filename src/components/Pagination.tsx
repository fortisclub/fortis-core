
import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    itemsPerPage: number;
    onItemsPerPageChange: (itemsPerPage: number) => void;
    totalItems: number;
}

export const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    itemsPerPage,
    onItemsPerPageChange,
    totalItems
}) => {
    if (totalPages <= 0) return null;

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-fortis-surface bg-fortis-panel/30">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-fortis-mid">Itens por página:</span>
                    <select
                        value={itemsPerPage}
                        onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                        className="bg-fortis-dark border border-fortis-surface rounded-lg px-2 py-1 text-[10px] font-bold text-white outline-none focus:border-fortis-brand transition-all cursor-pointer"
                    >
                        {[10, 25, 50, 100].map(size => (
                            <option key={size} value={size}>{size}</option>
                        ))}
                    </select>
                </div>
                <span className="text-[10px] font-bold text-fortis-mid tracking-wider">
                    Mostrando <span className="text-white">{startItem}-{endItem}</span> de <span className="text-white">{totalItems}</span>
                </span>
            </div>

            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg hover:bg-fortis-surface text-fortis-mid hover:text-white disabled:opacity-20 disabled:hover:bg-transparent transition-all"
                >
                    <ChevronsLeft size={16} />
                </button>
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg hover:bg-fortis-surface text-fortis-mid hover:text-white disabled:opacity-20 disabled:hover:bg-transparent transition-all"
                >
                    <ChevronLeft size={16} />
                </button>

                <div className="flex items-center px-4">
                    <span className="text-[10px] font-black tracking-widest uppercase text-fortis-mid">
                        Página <span className="text-white">{currentPage}</span> de <span className="text-white">{totalPages}</span>
                    </span>
                </div>

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg hover:bg-fortis-surface text-fortis-mid hover:text-white disabled:opacity-20 disabled:hover:bg-transparent transition-all"
                >
                    <ChevronRight size={16} />
                </button>
                <button
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg hover:bg-fortis-surface text-fortis-mid hover:text-white disabled:opacity-20 disabled:hover:bg-transparent transition-all"
                >
                    <ChevronsRight size={16} />
                </button>
            </div>
        </div>
    );
};
