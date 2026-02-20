
import React, { useState } from 'react';
import {
  Building2,
  Tags,
  Share2,
  Palette,
  Globe,
  ShieldCheck,
  Save,
  Plus,
  GripVertical,
  Edit2,
  Trash2,
  Compass,
  X,
  Loader2
} from 'lucide-react';
import { useApp } from '../store';
import { supabase } from '../lib/supabase';


const tabs = [
  { id: 'empresa', label: 'Empresa', icon: Building2 },
  { id: 'tags', label: 'Tags', icon: Tags },
  { id: 'canais', label: 'Canais', icon: Share2 },
  { id: 'origens', label: 'Origens', icon: Compass },
  { id: 'aparencia', label: 'Aparência', icon: Palette },
  { id: 'integracoes', label: 'Integrações', icon: Globe },
];

const PRESET_COLORS = ['#588575', '#60A5FA', '#FBBF24', '#A78BFA', '#34D399', '#F87171', '#94A3B8'];

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'Tag' | 'Canal' | 'Origem';
  initialData?: { id?: string; name: string; color?: string };
  onSave: (name: string, color?: string) => void;
}

const ConfigModal: React.FC<ConfigModalProps> = ({ isOpen, onClose, type, initialData, onSave }) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);

  React.useEffect(() => {
    if (isOpen) {
      setName(initialData?.name || '');
      setColor(initialData?.color || PRESET_COLORS[0]);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-fortis-panel border border-fortis-surface w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-lg">{initialData ? `Editar ${type}` : `Novo ${type === 'Origem' ? 'Origen' : type}`}</h3>
          <button onClick={onClose} className="text-fortis-mid hover:text-white"><X size={20} /></button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-fortis-mid uppercase tracking-widest">Nome</label>
            <input
              autoFocus
              className="w-full bg-fortis-dark border border-fortis-surface rounded-lg px-4 py-2 text-sm focus:border-fortis-brand outline-none"
              placeholder={`Ex: ${type === 'Tag' ? 'Inverno 24' : type === 'Canal' ? 'TikTok' : 'Indicação'}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && name.trim() && (onSave(name, color), onClose())}
            />
          </div>

          {type === 'Tag' && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-fortis-mid uppercase tracking-widest">Cor</label>
              <div className="flex gap-2">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-fortis-mid hover:text-white uppercase tracking-widest">Cancelar</button>
          <button
            disabled={!name.trim()}
            onClick={() => { onSave(name, color); onClose(); }}
            className="bg-fortis-brand px-6 py-2 rounded-lg text-xs font-bold text-white shadow-lg disabled:opacity-50"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('empresa');
  const [configModal, setConfigModal] = useState<{ isOpen: boolean, type: 'Tag' | 'Canal' | 'Origem', initialData?: { id?: string; name: string; color?: string } }>({ isOpen: false, type: 'Tag' });

  const {
    tags, channels, origins,
    addTag, updateTag, removeTag,
    addChannel, updateChannel, removeChannel,
    addOrigin, updateOrigin, removeOrigin,
    companySettings, updateSettings
  } = useApp();

  const [companyName, setCompanyName] = useState(companySettings.company_name);
  const [contactEmail, setContactEmail] = useState(companySettings.contact_email);
  const [address, setAddress] = useState(companySettings.address);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setCompanyName(companySettings.company_name);
    setContactEmail(companySettings.contact_email);
    setAddress(companySettings.address);
  }, [companySettings]);

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Math.random()}.${fileExt}`;
      const filePath = `brand/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('brand')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('brand')
        .getPublicUrl(filePath);

      await updateSettings({ logo_url: publicUrl });
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      alert('Erro ao fazer upload do logo: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };



  const getSingular = (title: string) => {
    if (title === 'Tags') return 'tag';
    if (title === 'Canais') return 'canal';
    if (title === 'Origens') return 'origen';
    return '';
  };

  const renderList = (items: { label: string, id?: string, color?: string }[], title: string, onAdd: () => void, onEdit: (item: any) => void, onRemove: (id: string) => void) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-bold text-fortis-mid uppercase tracking-[0.2em]">{title}</h4>
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-fortis-brand hover:text-white transition-colors"
        >
          <Plus size={14} /> Novo {getSingular(title)}
        </button>
      </div>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div
            key={item.id || idx}
            className="flex items-center gap-4 p-4 bg-fortis-dark rounded-xl border border-fortis-surface hover:border-fortis-brand/30 transition-all group"
          >
            <div className="cursor-grab text-fortis-mid hover:text-white">
              <GripVertical size={16} />
            </div>
            {title === 'Tags' && (
              <div
                className="w-3 h-3 rounded-full border border-white/10"
                style={{ backgroundColor: item.color || '#575756' }}
              />
            )}
            <span className="text-sm font-semibold flex-1 text-white/90">{item.label}</span>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onEdit(item)}
                className="p-1.5 hover:bg-fortis-surface rounded text-fortis-mid hover:text-white transition-colors"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={() => onRemove(item.id || item.label)}
                className="p-1.5 hover:bg-fortis-surface rounded text-fortis-mid hover:text-red-400 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="py-8 text-center border border-dashed border-fortis-surface rounded-xl">
            <p className="text-xs text-fortis-mid font-semibold">Nenhum item configurado.</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold">Configurações</h2>
        <p className="text-fortis-mid text-sm">Gerencie preferências e dados do sistema.</p>
      </div>

      <div className="flex gap-1 bg-fortis-panel border border-fortis-surface p-1 rounded-2xl w-fit overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-widest whitespace-nowrap ${activeTab === tab.id ? 'bg-fortis-brand text-white shadow-lg shadow-fortis-brand/20' : 'text-fortis-mid hover:text-white hover:bg-fortis-surface'
              }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-fortis-panel border border-fortis-surface rounded-2xl p-8 shadow-xl">
        {activeTab === 'empresa' && (
          <div className="space-y-6">
            <div className="flex items-center gap-6 mb-8 p-6 bg-fortis-dark rounded-2xl border border-fortis-surface">
              <img src={companySettings.logo_url} className="w-24 h-24 rounded-2xl object-cover border border-fortis-surface shadow-lg" alt="Logo" />
              <div>
                <h4 className="font-bold text-lg">{companyName}</h4>
                <p className="text-fortis-mid text-sm mb-4">Branding e informações corporativas.</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="bg-fortis-surface hover:bg-fortis-mid text-white px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2"
                >
                  {isUploading ? <Loader2 size={12} className="animate-spin" /> : 'Alterar Logo'}
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                  accept="image/*"
                  className="hidden"
                />

              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-fortis-mid uppercase tracking-widest">Nome da Empresa</label>
                <input
                  className="w-full bg-fortis-dark border border-fortis-surface rounded-lg px-4 py-2 text-sm focus:border-fortis-brand outline-none"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-fortis-mid uppercase tracking-widest">E-mail de Contato</label>
                <input
                  className="w-full bg-fortis-dark border border-fortis-surface rounded-lg px-4 py-2 text-sm focus:border-fortis-brand outline-none"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-fortis-mid uppercase tracking-widest">Endereço</label>
                <input
                  className="w-full bg-fortis-dark border border-fortis-surface rounded-lg px-4 py-2 text-sm focus:border-fortis-brand outline-none"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>

          </div>
        )}

        {activeTab === 'tags' && renderList(tags.map(t => ({ label: t.label, id: t.id, color: t.color })), 'Tags',
          () => setConfigModal({ isOpen: true, type: 'Tag' }),
          (item) => setConfigModal({ isOpen: true, type: 'Tag', initialData: { id: item.id, name: item.label, color: item.color } }),
          removeTag
        )}
        {activeTab === 'canais' && renderList(channels.map(c => ({ label: c })), 'Canais',
          () => setConfigModal({ isOpen: true, type: 'Canal' }),
          (item) => setConfigModal({ isOpen: true, type: 'Canal', initialData: { name: item.label } }),
          removeChannel
        )}
        {activeTab === 'origens' && renderList(origins.map(o => ({ label: o })), 'Origens',
          () => setConfigModal({ isOpen: true, type: 'Origem' }),
          (item) => setConfigModal({ isOpen: true, type: 'Origem', initialData: { name: item.label } }),
          removeOrigin
        )}

        {activeTab === 'aparencia' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between p-4 bg-fortis-dark rounded-xl border border-fortis-surface">
              <div>
                <p className="font-bold text-sm">Modo Escuro (Always Dark)</p>
                <p className="text-[10px] text-fortis-mid font-semibold">O sistema utiliza interface sofisticada em modo escuro por padrão.</p>
              </div>
              <div className="w-12 h-6 bg-fortis-brand rounded-full relative p-1">
                <div className="w-4 h-4 bg-white rounded-full ml-auto" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'integracoes' && (
          <div className="space-y-6">
            <div className="p-6 bg-fortis-dark rounded-2xl border border-fortis-surface">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl"><Globe size={24} /></div>
                <div>
                  <h5 className="font-bold">Google Tag Manager (GTM)</h5>
                  <p className="text-[10px] text-fortis-mid">Rastreie eventos e conversões automaticamente.</p>
                </div>
              </div>
              <input className="w-full bg-fortis-panel border border-fortis-surface rounded-lg px-4 py-2 text-sm focus:border-fortis-brand outline-none font-mono" placeholder="GTM-XXXXXXX" />
            </div>
          </div>
        )}

        <div className="mt-12 flex justify-end">
          <button
            onClick={() => updateSettings({ company_name: companyName, contact_email: contactEmail, address })}
            className="flex items-center gap-2 bg-fortis-brand hover:bg-opacity-90 text-white px-8 py-3 rounded-xl text-xs font-bold transition-all shadow-lg shadow-fortis-brand/20"
          >
            <Save size={16} /> Salvar Alterações
          </button>
        </div>

      </div>

      <ConfigModal
        isOpen={configModal.isOpen}
        onClose={() => setConfigModal(prev => ({ ...prev, isOpen: false, initialData: undefined }))}
        type={configModal.type}
        initialData={configModal.initialData}
        onSave={(name, color) => {
          if (configModal.type === 'Tag') {
            if (configModal.initialData?.id) {
              updateTag(configModal.initialData.id, name, color || '#000');
            } else {
              addTag(name, color);
            }
          }
          else if (configModal.type === 'Canal') {
            if (configModal.initialData?.name) {
              updateChannel(configModal.initialData.name, name);
            } else {
              addChannel(name);
            }
          }
          else if (configModal.type === 'Origem') {
            if (configModal.initialData?.name) {
              updateOrigin(configModal.initialData.name, name);
            } else {
              addOrigin(name);
            }
          }
        }}
      />
    </div>
  );
};
