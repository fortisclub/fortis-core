
import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { X, Edit2, Save, User as UserIcon, Shield, Trash2, Camera, Loader2 } from 'lucide-react';
import { useApp } from '../store';
import { ROLE_LABELS } from '../constants';
import { supabase } from '../lib/supabase';

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId?: string | null;
}

export const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, userId }) => {
    const { users, updateUser, deleteUser, addNotification } = useApp();
    const user = userId ? users.find(u => u.id === userId) : null;
    const [isEditing, setIsEditing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { register, handleSubmit, reset, setValue } = useForm();

    useEffect(() => {
        if (isOpen && user) {
            reset({
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
            });
            setIsEditing(false);
        }
    }, [isOpen, user, reset]);

    if (!isOpen || !user) return null;

    const handleAvatarClick = () => {
        if (isEditing) {
            fileInputRef.current?.click();
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !userId) return;

        try {
            setIsUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}-${Math.random()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            await updateUser(userId, { avatar: publicUrl });
            addNotification('Sucesso', 'Avatar atualizado com sucesso!', 'SUCCESS');
        } catch (error: any) {
            console.error('Erro ao fazer upload:', error);
            addNotification('Erro', 'Falha ao carregar imagem.', 'ERROR');
        } finally {
            setIsUploading(false);
        }
    };

    const onSubmit = async (data: any) => {
        if (userId) {
            await updateUser(userId, data);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-fortis-dark border border-fortis-surface w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-fortis-surface flex items-center justify-between bg-fortis-panel/50">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <UserIcon className="text-fortis-brand" size={24} />
                            Detalhes do Usuário
                        </h2>
                        <p className="text-xs text-fortis-mid mt-1 uppercase tracking-widest font-bold">
                            ID: {user?.id}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {isEditing && (
                            <button
                                type="button"
                                onClick={async () => {
                                    if (confirm('Tem certeza que deseja excluir este usuário?')) {
                                        await deleteUser(user!.id);
                                        onClose();
                                    }
                                }}
                                className="p-2 hover:bg-red-500/10 text-red-500 rounded-full transition-colors"
                                title="Excluir Usuário"
                            >
                                <Trash2 size={20} />
                            </button>
                        )}
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

                <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
                    <div className="flex flex-col items-center justify-center mb-6">
                        <div
                            className={`relative group cursor-pointer ${isUploading ? 'opacity-50' : ''}`}
                            onClick={handleAvatarClick}
                        >
                            <img
                                src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || '')}&background=588575&color=fff`}
                                alt={user?.name}
                                className="w-24 h-24 rounded-full border-2 border-fortis-brand object-cover shadow-2xl transition-all group-hover:scale-105"
                            />
                            {isEditing && !isUploading && (
                                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera size={24} className="text-white" />
                                </div>
                            )}
                            {isUploading && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Loader2 size={32} className="text-fortis-brand animate-spin" />
                                </div>
                            )}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept="image/*"
                            />
                        </div>
                        <p className="text-[10px] text-fortis-mid font-bold uppercase mt-3 tracking-widest">
                            {isEditing ? 'Clique para alterar avatar' : 'Avatar do Usuário'}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-1">
                            <label className="block text-[10px] font-bold text-fortis-mid uppercase tracking-widest pl-1">Nome Completo</label>
                            <input
                                {...register('name', { required: true })}
                                disabled={!isEditing}
                                placeholder="Ex: João Silva"
                                className="w-full bg-fortis-panel border border-fortis-surface rounded-lg px-4 py-3 text-sm focus:border-fortis-brand outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-white shadow-inner"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-[10px] font-bold text-fortis-mid uppercase tracking-widest pl-1">E-mail</label>
                            <input
                                type="email"
                                {...register('email', { required: true })}
                                disabled={!isEditing}
                                placeholder="email@exemplo.com"
                                className="w-full bg-fortis-panel border border-fortis-surface rounded-lg px-4 py-3 text-sm focus:border-fortis-brand outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-white shadow-inner"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-fortis-mid uppercase tracking-widest pl-1">Telefone</label>
                                <input
                                    {...register('phone', { required: true })}
                                    disabled={!isEditing}
                                    placeholder="(00) 00000-0000"
                                    className="w-full bg-fortis-panel border border-fortis-surface rounded-lg px-4 py-3 text-sm focus:border-fortis-brand outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-white shadow-inner"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-[10px] font-bold text-fortis-mid uppercase tracking-widest pl-1">Função</label>
                                <div className="relative">
                                    <select
                                        {...register('role', { required: true })}
                                        disabled={!isEditing}
                                        className="w-full bg-fortis-panel border border-fortis-surface rounded-lg px-4 py-3 text-sm focus:border-fortis-brand outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-white appearance-none shadow-inner"
                                    >
                                        {Object.entries(ROLE_LABELS).map(([key, label]) => (
                                            <option key={key} value={key}>{label}</option>
                                        ))}
                                    </select>
                                    <Shield size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-fortis-mid pointer-events-none" />
                                </div>
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
                                className="px-6 py-2 rounded-xl text-xs font-bold text-fortis-mid hover:text-white transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="bg-fortis-brand hover:bg-opacity-90 text-white px-8 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-fortis-brand/30 active:scale-95 flex items-center gap-2"
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
