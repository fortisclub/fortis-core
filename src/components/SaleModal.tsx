import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Package, Loader2, Calendar, User, DollarSign } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ProductPurchase } from '../types';
import { PAID_PURCHASE_STATUSES, UNPAID_PURCHASE_STATUSES } from '../constants';

interface SaleModalProps {
    isOpen: boolean;
    onClose: () => void;
    sale: any | null;
}

export const SaleModal: React.FC<SaleModalProps> = ({ isOpen, onClose, sale }) => {
    const [purchasedItems, setPurchasedItems] = useState<ProductPurchase[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && sale?.id) {
            fetchProducts(sale.id);
        } else {
            setPurchasedItems([]);
        }
    }, [isOpen, sale]);

    const fetchProducts = async (purchaseId: string) => {
        setIsLoading(true);
        try {
            // First attempt with join
            const { data, error } = await supabase
                .from('products_purchases')
                .select('*, products(*)')
                .eq('purchase_id', purchaseId);

            if (error) {
                console.warn('Join com products falhou, tentando busca manual...', error);
                // Fallback manual if foreign key isn't explicitly configured or named differently
                const { data: ppData, error: ppError } = await supabase
                    .from('products_purchases')
                    .select('*')
                    .eq('purchase_id', purchaseId);

                if (!ppError && ppData && ppData.length > 0) {
                    const skus = ppData.map((p: any) => p.sku_id || p.sku);
                    const { data: prodData } = await supabase
                        .from('products')
                        .select('*')
                        .in('sku', skus);

                    const mappedProducts = ppData.map((pp: any) => ({
                        id: pp.id,
                        lead_id: pp.lead_id,
                        purchase_id: pp.purchase_id,
                        sku: pp.sku_id || pp.sku,
                        cost_price: pp.cost_price,
                        discount_price: pp.discount_price,
                        size: pp.size,
                        product: prodData?.find((p: any) => p.sku === (pp.sku_id || pp.sku))
                    }));
                    setPurchasedItems(mappedProducts);
                } else {
                    setPurchasedItems([]);
                }
            } else if (data) {
                const mappedProducts = data.map((item: any) => ({
                    id: item.id,
                    lead_id: item.lead_id,
                    purchase_id: item.purchase_id,
                    sku: item.sku_id || item.sku,
                    cost_price: item.cost_price,
                    discount_price: item.discount_price,
                    size: item.size,
                    product: Array.isArray(item.products) ? item.products[0] : item.products
                }));
                setPurchasedItems(mappedProducts);
            }
        } catch (error: any) {
            console.error('Falha geral ao carregar produtos:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen || !sale) return null;

    return (
        <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-fortis-dark border border-fortis-surface w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200 max-h-[90vh]">
                <div className="p-6 border-b border-fortis-surface flex items-center justify-between bg-fortis-panel/50">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <ShoppingBag className="text-fortis-brand" size={24} />
                            Detalhes do Pedido
                        </h2>
                        <p className="text-xs text-fortis-mid mt-1 uppercase tracking-widest font-bold">
                            ID: {sale.id}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={onClose} className="p-2 hover:bg-fortis-surface rounded-full transition-colors text-fortis-mid hover:text-white">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
                    {/* Resumo da Venda */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-fortis-panel p-4 rounded-xl border border-fortis-surface flex items-start gap-3">
                            <div className="p-2 bg-fortis-surface rounded-lg text-blue-400">
                                <User size={16} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-fortis-mid uppercase tracking-widest">Cliente</p>
                                <p className="text-sm font-bold text-white">{sale.clientName}</p>
                                <p className="text-[10px] text-fortis-mid font-mono mt-1">ID: {sale.clientId}</p>
                            </div>
                        </div>

                        <div className="bg-fortis-panel p-4 rounded-xl border border-fortis-surface flex items-start gap-3">
                            <div className="p-2 bg-fortis-surface rounded-lg text-emerald-400">
                                <DollarSign size={16} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-fortis-mid uppercase tracking-widest">Valor</p>
                                <p className="text-sm font-black text-fortis-brand">
                                    {sale.value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </p>
                                <div className="mt-1">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-black uppercase inline-block ${
                                        PAID_PURCHASE_STATUSES.includes(sale.status)
                                            ? 'border-fortis-brand text-fortis-brand bg-fortis-brand/10'
                                            : UNPAID_PURCHASE_STATUSES.includes(sale.status)
                                                ? 'border-yellow-500 text-yellow-500 bg-yellow-500/10'
                                                : 'border-fortis-mid text-fortis-mid bg-fortis-mid/10'
                                    }`}>
                                        {sale.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-fortis-panel p-4 rounded-xl border border-fortis-surface flex items-start gap-3 col-span-2">
                            <div className="p-2 bg-fortis-surface rounded-lg text-purple-400">
                                <Calendar size={16} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-fortis-mid uppercase tracking-widest">Data e Hora</p>
                                <p className="text-sm font-bold text-white">
                                    {new Date(sale.date).toLocaleDateString('pt-BR')} às {new Date(sale.date).toLocaleTimeString('pt-BR')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Lista de Produtos */}
                    <div>
                        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                            <Package className="text-fortis-mid" size={18} />
                            Produtos Comprados
                        </h3>

                        <div className="bg-fortis-panel border border-fortis-surface rounded-xl overflow-hidden">
                            {isLoading ? (
                                <div className="p-12 flex flex-col items-center justify-center text-fortis-brand">
                                    <Loader2 size={32} className="animate-spin mb-4" />
                                    <p className="text-xs font-bold uppercase tracking-widest animate-pulse">Carregando produtos...</p>
                                </div>
                            ) : purchasedItems.length > 0 ? (
                                <table className="w-full text-left">
                                    <thead className="bg-fortis-dark/50 border-b border-fortis-surface">
                                        <tr>
                                            <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-fortis-mid">SKU</th>
                                            <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-fortis-mid">Produto</th>
                                            <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-fortis-mid">Tamanho</th>
                                            <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-fortis-mid">Preço de Custo</th>
                                            <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-fortis-mid">Preço de Venda</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-fortis-surface">
                                        {purchasedItems.map((item, idx) => (
                                            <tr key={item.id || idx} className="hover:bg-fortis-surface/20 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className="text-xs font-mono font-bold text-fortis-brand bg-fortis-brand/10 px-2 py-1 rounded whitespace-nowrap">
                                                        {item.sku}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {item.product ? (
                                                        <div>
                                                            <p className="text-xs font-bold text-white">{item.product.product_name || `Produto ${item.sku}`}</p>
                                                            {item.product.description && (
                                                                <p className="text-[10px] text-fortis-mid mt-0.5 line-clamp-1">{item.product.description}</p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-fortis-mid italic">Detalhes não disponíveis</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs font-semibold text-white/90">
                                                        {item.size || '-'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-mono text-fortis-mid">
                                                        {item.cost_price != null ? Number(item.cost_price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-black text-fortis-brand">
                                                        {item.discount_price != null ? Number(item.discount_price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-12 flex flex-col items-center justify-center text-fortis-mid">
                                    <Package size={48} className="opacity-20 mb-4" />
                                    <p className="text-sm font-bold">Nenhum produto listado para esta venda.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
