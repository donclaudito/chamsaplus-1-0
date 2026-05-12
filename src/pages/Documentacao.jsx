import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Navigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, Code2, FileText, Layers, Zap } from 'lucide-react';

const sections = [
  {
    id: 'app',
    icon: '🏗️',
    title: 'App.jsx — Raiz da Aplicação',
    color: 'indigo',
    functions: [
      {
        name: 'App',
        type: 'Componente React',
        description: 'Componente raiz da aplicação. Configura os provedores de autenticação (AuthProvider), query client (QueryClientProvider), roteador (Router) e dados médicos (MedicalDataProvider). Renderiza AuthenticatedApp e Toaster.',
        params: [],
        returns: { type: 'JSX.Element', description: 'Estrutura principal da aplicação com todos os provedores e roteamento configurado.' },
      },
      {
        name: 'AuthenticatedApp',
        type: 'Componente React',
        description: 'Gerencia o fluxo de autenticação e autorização. Exibe diferentes rotas baseadas no estado de carregamento, erros de auth, verificação de e-mail e status de aprovação do usuário.',
        params: [],
        returns: { type: 'JSX.Element | null', description: 'AppLoader durante carregamento, páginas de erro/verificação, ou as rotas principais se autenticado e autorizado.' },
      },
    ],
  },
  {
    id: 'chat',
    icon: '💬',
    title: 'pages/Chat.jsx — Página Principal de Chat',
    color: 'violet',
    functions: [
      {
        name: 'Chat',
        type: 'Componente React',
        description: 'Página principal de chat. Gerencia mensagens, modelos de LLM, upload de documentos, integração com Google Drive e funcionalidade Canvas. Lida com envio de mensagens, roteamento de modelos e persistência do histórico.',
        params: [],
        returns: { type: 'JSX.Element', description: 'Interface completa do chat com área de mensagens, input, seletores de modelo e painel Canvas opcional.' },
      },
      {
        name: 'handleSaveDriveFolder',
        type: 'Callback (useCallback)',
        description: 'Salva o ID da pasta do Google Drive selecionada no localStorage, associando ao e-mail do usuário atual.',
        params: [{ name: 'id', type: 'string', description: 'ID da pasta do Google Drive a ser salva.' }],
        returns: { type: 'void', description: 'Efeito colateral: salva no localStorage e atualiza o estado driveFolderId.' },
      },
      {
        name: 'handleUploadDocument',
        type: 'Callback Async (useCallback)',
        description: 'Lida com o upload de documentos. Envia o arquivo ao backend, processa via função Deno e, se bem-sucedido, adiciona à lista de documentos e dispara mensagem automática no chat.',
        params: [{ name: 'file', type: 'File', description: 'Objeto File do documento a ser carregado.' }],
        returns: { type: 'Promise<void>', description: 'Promessa que resolve após upload e processamento, ou atualiza status para erro.' },
      },
      {
        name: 'handleRemoveDoc',
        type: 'Callback (useCallback)',
        description: 'Remove um documento da lista de documentos enviados (apenas na UI).',
        params: [{ name: 'docId', type: 'string', description: 'ID único do documento a ser removido.' }],
        returns: { type: 'void', description: 'Atualiza o estado uploadedDocs removendo o documento pelo ID.' },
      },
      {
        name: 'sendMessage',
        type: 'Callback Async (useCallback)',
        description: 'Envia mensagem do usuário ao assistente. Atualiza o histórico, roteia o modelo de LLM, executa busca RAG, invoca o LLM via backend, processa resposta Canvas e registra o uso. Define título automático na primeira mensagem.',
        params: [{ name: 'text', type: 'string', description: 'Conteúdo da mensagem a ser enviada pelo usuário.' }],
        returns: { type: 'Promise<void>', description: 'Promessa que resolve após processar a resposta, ou adiciona mensagem de erro em caso de falha.' },
      },
      {
        name: 'handleTool',
        type: 'Callback (useCallback)',
        description: 'Manipula ações de ferramentas específicas no chat, como alternar o modo Canvas.',
        params: [{ name: 'toolId', type: 'string', description: 'Identificador da ferramenta. Ex: "canvas".' }],
        returns: { type: 'void', description: 'Aciona a ação correspondente à ferramenta informada.' },
      },
      {
        name: 'handlePasteData',
        type: 'Callback (useCallback)',
        description: 'Lida com colagem de dados clínicos. Insere um bloco de dados no histórico e envia mensagem automática ao assistente para análise.',
        params: [
          { name: 'title', type: 'string', description: 'Título do bloco de dados clínicos.' },
          { name: 'content', type: 'string', description: 'Conteúdo textual dos dados clínicos.' },
        ],
        returns: { type: 'void', description: 'Insere data-block no estado de mensagens e dispara sendMessage automaticamente.' },
      },
    ],
  },
  {
    id: 'chatmessage',
    icon: '📨',
    title: 'components/chat/ChatMessage.jsx',
    color: 'blue',
    functions: [
      {
        name: 'stripTags',
        type: 'Função utilitária',
        description: 'Remove tags especiais <CANVAS> e <SEARCH_PROMPT> do conteúdo de uma string usando regex.',
        params: [{ name: 'content', type: 'string', description: 'String da qual as tags devem ser removidas.' }],
        returns: { type: 'string', description: 'String limpa, sem as tags especificadas.' },
      },
      {
        name: 'ChatMessage',
        type: 'Componente React (memo)',
        description: 'Exibe uma mensagem de chat (usuário, assistente ou bloco de dados). Renderiza Markdown para respostas do assistente e inclui ações de copiar, exportar PDF e feedback de utilidade.',
        params: [
          { name: 'message', type: 'Object', description: 'Objeto da mensagem: { role, content, timestamp, pubmedResults?, searchPrompt? }.' },
          { name: 'onRetryWithoutCanvas', type: 'Function | undefined', description: 'Callback para tentar novamente sem o modo Canvas.' },
        ],
        returns: { type: 'JSX.Element', description: 'Representação visual de uma mensagem de chat com ações interativas.' },
      },
      {
        name: 'handleCopy',
        type: 'Função interna',
        description: 'Copia o conteúdo limpo da mensagem para a área de transferência e exibe indicador visual temporário de "Copiado!".',
        params: [],
        returns: { type: 'void', description: 'Efeito colateral: copia para clipboard e seta estado copied=true por 2s.' },
      },
      {
        name: 'handlePrintPDF',
        type: 'Função interna',
        description: 'Abre nova janela com o HTML renderizado da mensagem formatado com CSS para impressão, simulando exportação para PDF.',
        params: [],
        returns: { type: 'void', description: 'Abre janela de impressão com o conteúdo formatado em HTML/CSS.' },
      },
    ],
  },
  {
    id: 'applayout',
    icon: '🗂️',
    title: 'components/layout/AppLayout.jsx',
    color: 'emerald',
    functions: [
      {
        name: 'AppLayout',
        type: 'Componente React',
        description: 'Layout global da aplicação com sidebar redimensionável via react-resizable-panels. Gerencia sessões de chat (seleção, criação, exclusão, renomeação, fixação) e expõe o contexto para as rotas filhas via Outlet.',
        params: [],
        returns: { type: 'JSX.Element', description: 'Estrutura de layout com sidebar redimensionável e área de conteúdo das rotas filhas.' },
      },
    ],
  },
  {
    id: 'chatinput',
    icon: '⌨️',
    title: 'components/chat/ChatInput.jsx',
    color: 'amber',
    functions: [
      {
        name: 'ChatInput',
        type: 'Componente React',
        description: 'Campo de entrada do chat com suporte a texto, upload de arquivos, colagem de dados clínicos e alternância do modo Canvas. Inclui autoexpansão do textarea e atalho Enter para enviar.',
        params: [
          { name: 'onSend', type: 'Function', description: 'Callback para enviar a mensagem digitada.' },
          { name: 'onPaste', type: 'Function', description: 'Callback para acionar a colagem de dados clínicos.' },
          { name: 'onTool', type: 'Function', description: 'Callback para ferramentas. Ex: alternar Canvas.' },
          { name: 'onUpload', type: 'Function', description: 'Callback para lidar com upload de arquivos.' },
          { name: 'isLoading', type: 'boolean', description: 'Indica se resposta do LLM está em processamento.' },
          { name: 'canvasMode', type: 'boolean', description: 'Indica se o modo Canvas está ativo.' },
          { name: 'uploadedDocs', type: 'Array', description: 'Lista de documentos enviados na sessão.' },
          { name: 'onRemoveDoc', type: 'Function', description: 'Callback para remover um documento enviado.' },
        ],
        returns: { type: 'JSX.Element', description: 'Área de input com textarea, botões de ação e indicadores visuais de estado.' },
      },
      {
        name: 'handleFileChange',
        type: 'Função interna',
        description: 'Valida o tamanho do arquivo selecionado (máx 20MB) e invoca onUpload se válido.',
        params: [{ name: 'e', type: 'React.ChangeEvent<HTMLInputElement>', description: 'Evento de mudança do input de arquivo.' }],
        returns: { type: 'void', description: 'Invoca onUpload com o arquivo ou exibe alerta se exceder o limite.' },
      },
      {
        name: 'handleSend',
        type: 'Função interna',
        description: 'Verifica que o input não está vazio e não está carregando, então invoca onSend e limpa o textarea.',
        params: [],
        returns: { type: 'void', description: 'Invoca onSend(input) e reseta o estado e altura do textarea.' },
      },
      {
        name: 'handleKeyDown',
        type: 'Função interna',
        description: 'Intercepta Enter sem Shift para enviar mensagem (previne nova linha padrão).',
        params: [{ name: 'e', type: 'React.KeyboardEvent<HTMLTextAreaElement>', description: 'Evento de teclado do textarea.' }],
        returns: { type: 'void', description: 'Chama handleSend() se Enter pressionado sem Shift.' },
      },
      {
        name: 'handleChange',
        type: 'Função interna',
        description: 'Atualiza o estado do input e ajusta a altura do textarea dinamicamente para acomodar o conteúdo (máx 160px).',
        params: [{ name: 'e', type: 'React.ChangeEvent<HTMLTextAreaElement>', description: 'Evento de mudança do textarea.' }],
        returns: { type: 'void', description: 'Atualiza estado input e ajusta style.height do textarea.' },
      },
    ],
  },
  {
    id: 'canvaspanel',
    icon: '🖼️',
    title: 'components/chat/CanvasPanel.jsx',
    color: 'rose',
    functions: [
      {
        name: 'CanvasPanel',
        type: 'Componente React',
        description: 'Painel lateral de edição de documentos gerados pelo assistente. Suporta modos preview (Markdown renderizado) e edição (textarea). Inclui histórico de undo/redo, toolbar de formatação e exportação.',
        params: [
          { name: 'content', type: 'string', description: 'Conteúdo Markdown inicial do documento.' },
          { name: 'title', type: 'string', description: 'Título do documento exibido no header.' },
          { name: 'onClose', type: 'Function', description: 'Callback para fechar o painel Canvas.' },
        ],
        returns: { type: 'JSX.Element | null', description: 'Painel de edição ou null se content estiver vazio.' },
      },
      {
        name: 'commit',
        type: 'Função interna',
        description: 'Registra uma nova versão do texto no histórico de undo/redo e atualiza o estado atual.',
        params: [{ name: 'newText', type: 'string', description: 'Novo conteúdo a ser salvo no histórico.' }],
        returns: { type: 'void', description: 'Atualiza history e historyIdx, e seta o texto atual.' },
      },
      {
        name: 'undo',
        type: 'Função interna',
        description: 'Navega para a versão anterior no histórico de edição, se existir.',
        params: [],
        returns: { type: 'void', description: 'Decrementa historyIdx e atualiza o texto exibido.' },
      },
      {
        name: 'redo',
        type: 'Função interna',
        description: 'Navega para a versão seguinte no histórico de edição, se existir.',
        params: [],
        returns: { type: 'void', description: 'Incrementa historyIdx e atualiza o texto exibido.' },
      },
      {
        name: 'wrap',
        type: 'Função interna',
        description: 'Envolve o texto selecionado no textarea com marcadores Markdown (ex: ** para negrito, * para itálico).',
        params: [
          { name: 'before', type: 'string', description: 'Marcador a inserir antes da seleção.' },
          { name: 'after', type: 'string', description: 'Marcador a inserir após a seleção (padrão: igual a before).' },
        ],
        returns: { type: 'void', description: 'Aplica wrap no texto selecionado via commit e reposiciona o cursor.' },
      },
      {
        name: 'insertLinePrefix',
        type: 'Função interna',
        description: 'Insere um prefixo no início da linha atual do textarea (ex: "- " para lista ou "1. " para lista numerada).',
        params: [{ name: 'prefix', type: 'string', description: 'String a ser inserida no início da linha.' }],
        returns: { type: 'void', description: 'Atualiza o texto via commit com o prefixo adicionado.' },
      },
      {
        name: 'applyHeading',
        type: 'Função interna',
        description: 'Aplica um nível de cabeçalho Markdown (H1, H2, H3 ou normal) à linha atual com base no valor do select.',
        params: [{ name: 'e', type: 'React.ChangeEvent<HTMLSelectElement>', description: 'Evento de mudança do select de nível de cabeçalho.' }],
        returns: { type: 'void', description: 'Substitui o prefixo de cabeçalho da linha atual e alterna para modo edição.' },
      },
      {
        name: 'handleCopy',
        type: 'Função interna',
        description: 'Copia todo o conteúdo Markdown atual do canvas para a área de transferência.',
        params: [],
        returns: { type: 'void', description: 'Copia texto para clipboard e seta estado copied=true por 2s.' },
      },
      {
        name: 'handleExport',
        type: 'Função interna',
        description: 'Exporta o conteúdo atual do Canvas como arquivo .md (Markdown) via download do navegador.',
        params: [],
        returns: { type: 'void', description: 'Cria Blob do conteúdo e aciona download com nome baseado no título.' },
      },
      {
        name: 'handlePrint',
        type: 'Função interna',
        description: 'Abre uma nova janela com o HTML renderizado do preview do Canvas, formatado com CSS para impressão.',
        params: [],
        returns: { type: 'void', description: 'Abre janela de impressão com conteúdo estilizado.' },
      },
      {
        name: 'switchMode',
        type: 'Função interna',
        description: 'Alterna entre os modos "preview" (leitura com Markdown renderizado) e "edit" (textarea para edição).',
        params: [],
        returns: { type: 'void', description: 'Alterna state mode entre "preview" e "edit", commitando o texto ao sair da edição.' },
      },
      {
        name: 'ToolBtn',
        type: 'Sub-componente interno',
        description: 'Botão reutilizável da toolbar do Canvas com suporte a estado ativo, desabilitado e título de acessibilidade.',
        params: [
          { name: 'onClick', type: 'Function', description: 'Handler de clique do botão.' },
          { name: 'disabled', type: 'boolean', description: 'Se o botão está desabilitado.' },
          { name: 'title', type: 'string', description: 'Título para tooltip e aria-label.' },
          { name: 'children', type: 'ReactNode', description: 'Conteúdo interno do botão (ícone).' },
          { name: 'active', type: 'boolean | undefined', description: 'Se o botão está em estado ativo.' },
        ],
        returns: { type: 'JSX.Element', description: 'Botão estilizado da toolbar.' },
      },
      {
        name: 'Divider',
        type: 'Sub-componente interno',
        description: 'Separador visual vertical para a toolbar do Canvas.',
        params: [],
        returns: { type: 'JSX.Element', description: 'Div com estilo de divisória vertical.' },
      },
    ],
  },
];

const colorMap = {
  indigo: { badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800', header: 'bg-indigo-50 dark:bg-indigo-900/20' },
  violet: { badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300', border: 'border-violet-200 dark:border-violet-800', header: 'bg-violet-50 dark:bg-violet-900/20' },
  blue: { badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800', header: 'bg-blue-50 dark:bg-blue-900/20' },
  emerald: { badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800', header: 'bg-emerald-50 dark:bg-emerald-900/20' },
  amber: { badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800', header: 'bg-amber-50 dark:bg-amber-900/20' },
  rose: { badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800', header: 'bg-rose-50 dark:bg-rose-900/20' },
};

function FunctionCard({ fn, color }) {
  const [open, setOpen] = useState(false);
  const c = colorMap[color];
  return (
    <div className={`border rounded-xl overflow-hidden ${c.border}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:opacity-80 ${c.header}`}
      >
        {open ? <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground" />}
        <span className="font-mono font-semibold text-sm text-foreground">{fn.name}()</span>
        <span className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full ${c.badge}`}>{fn.type}</span>
      </button>

      {open && (
        <div className="px-5 py-4 bg-card space-y-4 border-t border-border">
          <p className="text-sm text-muted-foreground leading-relaxed">{fn.description}</p>

          {fn.params.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wider">Parâmetros de Entrada</p>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Parâmetro</th>
                      <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Tipo</th>
                      <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Descrição</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fn.params.map((p, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="px-3 py-2 font-mono text-primary font-medium">{p.name}</td>
                        <td className="px-3 py-2 font-mono text-amber-600 dark:text-amber-400">{p.type}</td>
                        <td className="px-3 py-2 text-foreground">{p.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {fn.params.length === 0 && (
            <p className="text-xs text-muted-foreground italic">Nenhum parâmetro de entrada.</p>
          )}

          <div>
            <p className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wider">Valor de Retorno</p>
            <div className="flex items-start gap-3 bg-muted/50 rounded-lg px-3 py-2">
              <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-semibold shrink-0">{fn.returns.type}</span>
              <span className="text-xs text-muted-foreground">{fn.returns.description}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionBlock({ section }) {
  const [open, setOpen] = useState(true);
  const c = colorMap[section.color];
  return (
    <div className={`border-2 rounded-2xl overflow-hidden ${c.border}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-3 px-5 py-4 text-left transition-colors hover:opacity-90 ${c.header}`}
      >
        <span className="text-xl">{section.icon}</span>
        <span className="font-bold text-base text-foreground flex-1">{section.title}</span>
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${c.badge}`}>
          {section.functions.length} {section.functions.length === 1 ? 'função' : 'funções'}
        </span>
        {open ? <ChevronDown className="w-5 h-5 text-muted-foreground" /> : <ChevronRight className="w-5 h-5 text-muted-foreground" />}
      </button>

      {open && (
        <div className="p-4 space-y-3 bg-background">
          {section.functions.map((fn) => (
            <FunctionCard key={fn.name} fn={fn} color={section.color} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Documentacao() {
  const { user } = useAuth();

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const totalFunctions = sections.reduce((acc, s) => acc + s.functions.length, 0);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground leading-tight">Documentação Técnica</h1>
            <p className="text-[11px] text-muted-foreground">Chamsa ISA — Referência de Funções e Componentes</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[10px] font-mono bg-destructive/10 text-destructive px-2 py-1 rounded-md font-semibold">
              🔒 Admin only
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Arquivos', value: sections.length, icon: <Layers className="w-4 h-4" />, color: 'text-indigo-500' },
            { label: 'Funções', value: totalFunctions, icon: <Code2 className="w-4 h-4" />, color: 'text-violet-500' },
            { label: 'Componentes', value: sections.filter(s => s.functions.some(f => f.type.includes('Componente'))).length, icon: <Zap className="w-4 h-4" />, color: 'text-amber-500' },
            { label: 'Versão', value: 'v4.1', icon: <FileText className="w-4 h-4" />, color: 'text-emerald-500' },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border border-border rounded-xl p-4 flex flex-col gap-1">
              <div className={`${stat.color}`}>{stat.icon}</div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Intro */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5">
          <p className="text-sm text-foreground leading-relaxed">
            Esta documentação cobre todas as funções, callbacks, hooks e componentes React do código-fonte da <strong>Chamsa ISA</strong>.
            Cada entrada contém descrição, tabela de parâmetros tipados e valor de retorno. Clique em qualquer função para expandir os detalhes.
          </p>
        </div>

        {/* Sections */}
        {sections.map((section) => (
          <SectionBlock key={section.id} section={section} />
        ))}

        <p className="text-center text-xs text-muted-foreground pb-8">
          Chamsa ISA v4.1 · Documentação gerada automaticamente · {new Date().toLocaleDateString('pt-BR')}
        </p>
      </div>
      </div>
    </div>
  );
}