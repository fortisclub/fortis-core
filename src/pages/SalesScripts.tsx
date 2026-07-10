
import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { 
  Plus, 
  Search, 
  FileText, 
  Save, 
  Trash2, 
  ChevronLeft, 
  Bold as BoldIcon, 
  Italic as ItalicIcon, 
  List as ListIcon, 
  ListOrdered,
  Heading1,
  Heading2,
  Quote,
  Undo,
  Redo,
  Layout,
  Folder,
  FolderPlus,
  ChevronDown,
  ChevronRight,
  Edit3
} from 'lucide-react';
import { useApp } from '../store';
import { SalesScript } from '../types';

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-fortis-surface bg-fortis-panel/50 rounded-t-2xl">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-2 rounded-lg transition-colors ${editor.isActive('bold') ? 'bg-fortis-brand text-white' : 'text-fortis-mid hover:bg-white/5 hover:text-white'}`}
        title="Negrito"
      >
        <BoldIcon size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-2 rounded-lg transition-colors ${editor.isActive('italic') ? 'bg-fortis-brand text-white' : 'text-fortis-mid hover:bg-white/5 hover:text-white'}`}
        title="Itálico"
      >
        <ItalicIcon size={18} />
      </button>
      <div className="w-[1px] h-6 bg-fortis-surface mx-1" />
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-2 rounded-lg transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-fortis-brand text-white' : 'text-fortis-mid hover:bg-white/5 hover:text-white'}`}
        title="Título 1"
      >
        <Heading1 size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-2 rounded-lg transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-fortis-brand text-white' : 'text-fortis-mid hover:bg-white/5 hover:text-white'}`}
        title="Título 2"
      >
        <Heading2 size={18} />
      </button>
      <div className="w-[1px] h-6 bg-fortis-surface mx-1" />
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded-lg transition-colors ${editor.isActive('bulletList') ? 'bg-fortis-brand text-white' : 'text-fortis-mid hover:bg-white/5 hover:text-white'}`}
        title="Lista"
      >
        <ListIcon size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 rounded-lg transition-colors ${editor.isActive('orderedList') ? 'bg-fortis-brand text-white' : 'text-fortis-mid hover:bg-white/5 hover:text-white'}`}
        title="Lista Numerada"
      >
        <ListOrdered size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-2 rounded-lg transition-colors ${editor.isActive('blockquote') ? 'bg-fortis-brand text-white' : 'text-fortis-mid hover:bg-white/5 hover:text-white'}`}
        title="Citação"
      >
        <Quote size={18} />
      </button>
      <div className="w-[1px] h-6 bg-fortis-surface mx-1" />
      <button
        onClick={() => editor.chain().focus().undo().run()}
        className="p-2 rounded-lg text-fortis-mid hover:bg-white/5 hover:text-white transition-colors"
        title="Desfazer"
      >
        <Undo size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().redo().run()}
        className="p-2 rounded-lg text-fortis-mid hover:bg-white/5 hover:text-white transition-colors"
        title="Refazer"
      >
        <Redo size={18} />
      </button>
    </div>
  );
};

export const SalesScripts: React.FC = () => {
  const { salesScripts, addSalesScript, updateSalesScript, deleteSalesScript } = useApp();
  const [selectedScriptId, setSelectedScriptId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Folder states & persistence
  interface Folder {
    id: string;
    name: string;
  }

  const [folders, setFolders] = useState<Folder[]>(() => {
    const saved = localStorage.getItem('fortis_folders');
    return saved ? JSON.parse(saved) : [];
  });

  const [scriptFolderMap, setScriptFolderMap] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('fortis_script_folder_mapping');
    return saved ? JSON.parse(saved) : {};
  });

  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('fortis_expanded_folders');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('fortis_folders', JSON.stringify(folders));
  }, [folders]);

  useEffect(() => {
    localStorage.setItem('fortis_script_folder_mapping', JSON.stringify(scriptFolderMap));
  }, [scriptFolderMap]);

  useEffect(() => {
    localStorage.setItem('fortis_expanded_folders', JSON.stringify(expandedFolders));
  }, [expandedFolders]);

  const handleCreateFolder = () => {
    const name = window.prompt('Digite o nome da nova pasta:');
    if (!name || !name.trim()) return;
    const newFolder: Folder = {
      id: Math.random().toString(36).substring(2, 9),
      name: name.trim()
    };
    setFolders(prev => [...prev, newFolder]);
    setExpandedFolders(prev => ({ ...prev, [newFolder.id]: true }));
  };

  const handleRenameFolder = (id: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const name = window.prompt('Digite o novo nome da pasta:', currentName);
    if (!name || !name.trim() || name === currentName) return;
    setFolders(prev => prev.map(f => f.id === id ? { ...f, name: name.trim() } : f));
  };

  const handleDeleteFolder = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Tem certeza que deseja excluir esta pasta? Os scripts dentro dela não serão apagados.')) {
      setFolders(prev => prev.filter(f => f.id !== id));
      setScriptFolderMap(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(key => {
          if (next[key] === id) {
            delete next[key];
          }
        });
        return next;
      });
    }
  };

  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const moveScriptToFolder = (scriptId: string, folderId: string | null) => {
    setScriptFolderMap(prev => {
      const next = { ...prev };
      if (folderId) {
        next[scriptId] = folderId;
      } else {
        delete next[scriptId];
      }
      return next;
    });
  };

  const selectedScript = salesScripts.find(s => s.id === selectedScriptId);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Comece a escrever seu script de vendas...',
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[500px] px-8 py-6 text-white leading-relaxed',
      },
    },
  });

  useEffect(() => {
    if (selectedScript) {
      setTitle(selectedScript.title);
      editor?.commands.setContent(selectedScript.content);
    } else {
      setTitle('');
      editor?.commands.setContent('');
    }
  }, [selectedScriptId, editor]);

  const handleSave = async () => {
    if (!title.trim() || !editor) return;

    setIsSaving(true);
    const content = editor.getHTML();

    if (selectedScriptId) {
      await updateSalesScript(selectedScriptId, { title, content });
    } else {
      const newId = await addSalesScript({ title, content });
      if (newId) setSelectedScriptId(newId);
    }
    setIsSaving(false);
  };

  const handleNew = () => {
    setSelectedScriptId(null);
    setTitle('');
    editor?.commands.setContent('');
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Tem certeza que deseja excluir este script?')) {
      await deleteSalesScript(id);
      if (selectedScriptId === id) {
        setSelectedScriptId(null);
      }
    }
  };

  const filteredScripts = salesScripts.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full gap-6 animate-in fade-in duration-500">
      {/* Sidebar - Script List */}
      <div className={`flex flex-col bg-fortis-panel border border-fortis-surface rounded-3xl overflow-hidden transition-all duration-300 shadow-xl ${isSidebarOpen ? 'w-80' : 'w-0 border-0 opacity-0'}`}>
        <div className="p-6 border-b border-fortis-surface space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-white uppercase tracking-widest">Meus Scripts</h2>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleCreateFolder}
                className="p-2 bg-fortis-panel border border-fortis-surface text-fortis-mid hover:text-white rounded-xl hover:bg-white/5 transition-all shadow-lg active:scale-95"
                title="Nova Pasta"
              >
                <FolderPlus size={18} />
              </button>
              <button 
                onClick={handleNew}
                className="p-2 bg-fortis-brand text-white rounded-xl hover:bg-fortis-brand/80 transition-all shadow-lg shadow-fortis-brand/20 active:scale-95"
                title="Novo Script"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-fortis-mid" />
            <input 
              type="text" 
              placeholder="Buscar script..."
              className="w-full bg-fortis-dark border border-fortis-surface rounded-xl pl-10 pr-4 py-2.5 text-xs text-white font-semibold outline-none focus:border-fortis-brand transition-all placeholder:text-fortis-mid/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {(() => {
            const renderScriptItem = (script: SalesScript) => (
              <div 
                key={script.id}
                onClick={() => setSelectedScriptId(script.id)}
                className={`group flex items-center justify-between p-3 pl-4 rounded-xl cursor-pointer transition-all border ${selectedScriptId === script.id ? 'bg-fortis-brand/10 border-fortis-brand text-white shadow-lg shadow-fortis-brand/5' : 'bg-transparent border-transparent text-fortis-mid hover:bg-white/5 hover:text-white'}`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <FileText size={16} className={selectedScriptId === script.id ? 'text-fortis-brand' : 'text-fortis-surface'} />
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">{script.title}</p>
                    <p className="text-[9px] font-medium opacity-50 uppercase tracking-wider">
                      {new Date(script.updatedAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <select
                    value={scriptFolderMap[script.id] || ''}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => moveScriptToFolder(script.id, e.target.value || null)}
                    className="bg-fortis-dark border border-fortis-surface rounded px-1.5 py-0.5 text-[10px] text-fortis-mid outline-none hover:text-white focus:border-fortis-brand transition-all cursor-pointer mr-1"
                    title="Mover para pasta"
                  >
                    <option value="">Sem Pasta</option>
                    {folders.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                  <button 
                    onClick={(e) => handleDelete(script.id, e)}
                    className="p-1 text-fortis-mid hover:text-rose-400 transition-all"
                    title="Excluir Script"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );

            if (filteredScripts.length === 0) {
              return (
                <div className="flex flex-col items-center justify-center py-12 text-fortis-mid/40">
                  <FileText size={48} strokeWidth={1} className="mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Nenhum script encontrado</p>
                </div>
              );
            }

            return (
              <div className="space-y-4">
                {/* Render Folders */}
                {folders.map(folder => {
                  const folderScripts = filteredScripts.filter(s => scriptFolderMap[s.id] === folder.id);
                  const isExpanded = !!(expandedFolders[folder.id] || searchQuery);
                  
                  if (searchQuery && folderScripts.length === 0) return null;

                  return (
                    <div key={folder.id} className="space-y-1 bg-fortis-dark/20 p-1.5 rounded-2xl border border-fortis-surface/30">
                      <div 
                        onClick={() => toggleFolder(folder.id)}
                        className="group flex items-center justify-between p-2 rounded-xl hover:bg-white/5 cursor-pointer text-white transition-all"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="text-fortis-mid">
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </div>
                          <Folder size={14} className="text-fortis-brand" />
                          <span className="text-xs font-black uppercase tracking-wider truncate">{folder.name}</span>
                          <span className="text-[10px] text-fortis-mid font-semibold bg-fortis-surface px-1.5 py-0.5 rounded-md">
                            {folderScripts.length}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button
                            onClick={(e) => handleRenameFolder(folder.id, folder.name, e)}
                            className="p-1 text-fortis-mid hover:text-white transition-all"
                            title="Renomear Pasta"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={(e) => handleDeleteFolder(folder.id, e)}
                            className="p-1 text-fortis-mid hover:text-rose-400 transition-all"
                            title="Excluir Pasta"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="pl-3 pr-1 pb-1 space-y-1 border-l border-fortis-surface/50 ml-3.5 mt-1">
                          {folderScripts.length === 0 ? (
                            <div className="text-[10px] text-fortis-mid/40 py-2 pl-2">
                              Pasta vazia
                            </div>
                          ) : (
                            folderScripts.map(script => renderScriptItem(script))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Render Uncategorized Scripts */}
                {(() => {
                  const uncategorizedScripts = filteredScripts.filter(s => !scriptFolderMap[s.id]);
                  if (uncategorizedScripts.length === 0) return null;

                  return (
                    <div className="space-y-1">
                      {folders.length > 0 && (
                        <div className="px-2 py-1">
                          <span className="text-[9px] font-black text-fortis-mid uppercase tracking-widest">Sem Pasta</span>
                        </div>
                      )}
                      <div className="space-y-1">
                        {uncategorizedScripts.map(script => renderScriptItem(script))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col min-w-0 space-y-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-3 bg-fortis-panel border border-fortis-surface rounded-2xl text-fortis-mid hover:text-white transition-all shadow-lg"
          >
            <Layout size={20} className={isSidebarOpen ? '' : 'rotate-180'} />
          </button>
          
          <div className="flex-1 flex items-center justify-between bg-fortis-panel border border-fortis-surface rounded-2xl p-2 pl-4 shadow-lg">
            <input 
              type="text"
              placeholder="Título do script..."
              className="flex-1 bg-transparent border-none text-lg font-black text-white outline-none placeholder:text-fortis-mid/30 mr-4"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="flex items-center gap-2 mr-2">
              <Folder size={14} className="text-fortis-mid" />
              <select
                value={selectedScriptId ? (scriptFolderMap[selectedScriptId] || '') : ''}
                onChange={(e) => {
                  if (selectedScriptId) {
                    moveScriptToFolder(selectedScriptId, e.target.value || null);
                  }
                }}
                disabled={!selectedScriptId}
                className="bg-fortis-dark border border-fortis-surface rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-fortis-brand transition-all cursor-pointer disabled:opacity-50"
              >
                <option value="">Sem Pasta</option>
                {folders.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
            <button 
              onClick={handleSave}
              disabled={isSaving || !title.trim()}
              className="flex items-center gap-2 px-6 py-2 bg-fortis-brand text-white rounded-xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-fortis-brand/80 transition-all shadow-lg shadow-fortis-brand/20 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {selectedScriptId ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-fortis-panel border border-fortis-surface rounded-3xl shadow-2xl overflow-hidden min-h-0">
          <MenuBar editor={editor} />
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-fortis-dark/50">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
        .prose blockquote {
          border-left: 4px solid #588575;
          padding-left: 1rem;
          font-style: italic;
          color: #94a3b8;
        }
        .prose h1 { font-size: 2.25rem; font-weight: 900; margin-bottom: 1.5rem; }
        .prose h2 { font-size: 1.5rem; font-weight: 800; margin-top: 2rem; margin-bottom: 1rem; }
        .prose ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1rem; }
        .prose ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 1rem; }
      `}} />
    </div>
  );
};
