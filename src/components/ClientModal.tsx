import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Edit2, Save, User, MapPin, FileText } from 'lucide-react';
import { useApp } from '../store';
import { UFS } from '../constants';

interface ClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    clientId?: string | null;
}

export const ClientModal: React.FC<ClientModalProps> = ({ isOpen, onClose, clientId }) => {
    const { leads, updateLead } = useApp();
    const client = clientId ? leads.find(l => l.id === clientId) : null;
    const [isEditing, setIsEditing] = useState(false);

    const { register, handleSubmit, reset, formState: { errors } } = useForm();

    useEffect(() => {
        if (isOpen && client) {
            reset({
                name: client.name,
                cpf: client.cpf || '',
                email: client.email,
                phone: client.phone,
                address: client.address || '',
                addressNumber: client.addressNumber || '',
                district: client.district || '',
                city: client.city || '',
                uf: client.uf,
            });
            setIsEditing(false);
        }
    }, [isOpen, client, reset]);

    if (!isOpen || !client) return null;

    const onSubmit = (data: any) => {
        updateLead(client.id, data);
        setIsEditing(false);
    };

    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-fortis-dark border border-fortis-surface w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-fortis-surface flex items-center justify-between bg-fortis-panel/50">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <User className="text-fortis-brand" size={24} />
                            Detalhes do Cliente
                        </h2>
                        <p className="text-xs text-fortis-mid mt-1 uppercase tracking-widest font-bold">
                            ID: {client.id}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="p-2 hover:bg-fortis-surface rounded-full transition-colors text-fortis-brand"
                                title="Editar"
                            >
                                <Edit2 size={20} />
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 hover:bg-fortis-surface rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6 overflow-y-auto max-h-[85vh] custom-scrollbar">

                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-fortis-mid uppercase tracking-[0.2em] flex items-center gap-2">
                            <FileText size={14} /> Dados Pessoais
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-fortis-mid uppercase tracking-widest mb-1">Nome Completo</label>
                                <input
                                    {...register('name', { required: true })}
                                    disabled={!isEditing}
                                    className={`w-full bg-fortis-panel border ${errors.name ? 'border-red-500' : 'border-fortis-surface'} rounded-lg px-3 py-2.5 text-sm focus:border-fortis-brand outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-white`}
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-fortis-mid uppercase tracking-widest mb-1">CPF</label>
                                <input
                                    {...register('cpf')}
                                    disabled={!isEditing}
                                    className="w-full bg-fortis-panel border border-fortis-surface rounded-lg px-3 py-2.5 text-sm focus:border-fortis-brand outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-fortis-mid uppercase tracking-widest mb-1">E-mail</label>
                                <input
                                    type="email"
                                    {...register('email', { required: true })}
                                    disabled={!isEditing}
                                    className="w-full bg-fortis-panel border border-fortis-surface rounded-lg px-3 py-2.5 text-sm focus:border-fortis-brand outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-fortis-mid uppercase tracking-widest mb-1">Telefone</label>
                                <input
                                    {...register('phone', { required: true })}
                                    disabled={!isEditing}
                                    className="w-full bg-fortis-panel border border-fortis-surface rounded-lg px-3 py-2.5 text-sm focus:border-fortis-brand outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-white"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-fortis-surface/50" />

                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-fortis-mid uppercase tracking-[0.2em] flex items-center gap-2">
                            <MapPin size={14} /> Endereço
                        </h3>
                        <div className="grid grid-cols-4 gap-4">
                            <div className="col-span-3">
                                <label className="block text-[10px] font-bold text-fortis-mid uppercase tracking-widest mb-1">Endereço</label>
                                <input
                                    {...register('address')}
                                    disabled={!isEditing}
                                    className="w-full bg-fortis-panel border border-fortis-surface rounded-lg px-3 py-2.5 text-sm focus:border-fortis-brand outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-white"
                                />
                            </div>

                            <div className="col-span-1">
                                <label className="block text-[10px] font-bold text-fortis-mid uppercase tracking-widest mb-1">Número</label>
                                <input
                                    {...register('addressNumber')}
                                    disabled={!isEditing}
                                    className="w-full bg-fortis-panel border border-fortis-surface rounded-lg px-3 py-2.5 text-sm focus:border-fortis-brand outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-white"
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-[10px] font-bold text-fortis-mid uppercase tracking-widest mb-1">Bairro</label>
                                <input
                                    {...register('district')}
                                    disabled={!isEditing}
                                    className="w-full bg-fortis-panel border border-fortis-surface rounded-lg px-3 py-2.5 text-sm focus:border-fortis-brand outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-white"
                                />
                            </div>

                            <div className="col-span-1">
                                <label className="block text-[10px] font-bold text-fortis-mid uppercase tracking-widest mb-1">Cidade</label>
                                <input
                                    {...register('city')}
                                    disabled={!isEditing}
                                    className="w-full bg-fortis-panel border border-fortis-surface rounded-lg px-3 py-2.5 text-sm focus:border-fortis-brand outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-white"
                                />
                            </div>

                            <div className="col-span-1">
                                <label className="block text-[10px] font-bold text-fortis-mid uppercase tracking-widest mb-1">UF</label>
                                <select
                                    {...register('uf')}
                                    disabled={!isEditing}
                                    className="w-full bg-fortis-panel border border-fortis-surface rounded-lg px-3 py-2.5 text-sm focus:border-fortis-brand outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-white appearance-none"
                                >
                                    {UFS.map(uf => (
                                        <option key={uf} value={uf}>{uf}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {isEditing && (
                        <div className="pt-6 flex gap-3 justify-end border-t border-fortis-surface">
                            <button
                                type="button"
                                onClick={() => {
                                    reset();
                                    setIsEditing(false);
                                }}
                                className="px-6 py-2 rounded-lg text-sm font-semibold text-fortis-mid hover:text-white transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="bg-fortis-brand hover:bg-opacity-90 text-white px-8 py-2 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-fortis-brand/20 active:scale-95 flex items-center gap-2"
                            >
                                <Save size={16} /> Salvar Alterações
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};
