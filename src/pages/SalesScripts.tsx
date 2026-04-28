
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
  Layout
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
            <button 
              onClick={handleNew}
              className="p-2 bg-fortis-brand text-white rounded-xl hover:bg-fortis-brand/80 transition-all shadow-lg shadow-fortis-brand/20 active:scale-95"
              title="Novo Script"
            >
              <Plus size={20} />
            </button>
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
          {filteredScripts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-fortis-mid/40">
              <FileText size={48} strokeWidth={1} className="mb-4" />
              <p className="text-[10px] font-black uppercase tracking-widest">Nenhum script encontrado</p>
            </div>
          ) : (
            filteredScripts.map(script => (
              <div 
                key={script.id}
                onClick={() => setSelectedScriptId(script.id)}
                className={`group flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border ${selectedScriptId === script.id ? 'bg-fortis-brand/10 border-fortis-brand text-white shadow-lg shadow-fortis-brand/5' : 'bg-transparent border-transparent text-fortis-mid hover:bg-white/5 hover:text-white'}`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <FileText size={18} className={selectedScriptId === script.id ? 'text-fortis-brand' : 'text-fortis-surface'} />
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{script.title}</p>
                    <p className="text-[10px] font-medium opacity-50 uppercase tracking-wider">
                      {new Date(script.updatedAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={(e) => handleDelete(script.id, e)}
                  className="p-1.5 text-fortis-mid hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
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
              className="flex-1 bg-transparent border-none text-lg font-black text-white outline-none placeholder:text-fortis-mid/30"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
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
