import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { ChevronDown, ChevronUp, MessageSquare, FolderSearch, Beaker, Plug, Users, Brain, Upload, Share2, Pin, Trash2, Search, Key, Zap, BookOpen, HelpCircle, Shield, X, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// ─── Conteúdo detalhado em Markdown por seção ───────────────────────────────

const DETAILS = {
  chat: `
## 💬 Guia Completo — Chat

### Como formular boas perguntas
Quanto mais contexto clínico você fornecer, mais precisa será a resposta da IA. Prefira perguntas como:

> *"Paciente masculino, 58 anos, hipertenso, com dispneia aos esforços há 2 semanas e edema em MMII. Glicemia 180, creatinina 1.8. Quais hipóteses diagnósticas?"*

em vez de simplesmente *"me ajude com dispneia"*.

### Colar Dados Clínicos (ícone de clipe 📎)
1. Clique no ícone de **clipe** na barra de entrada.
2. Dê um título ao bloco (ex: *"Hemograma 10/05"*).
3. Cole os valores laboratoriais em texto livre.
4. A IA vai analisar automaticamente e gerar hipóteses, Red Flags e recomendações.

### Upload de Documentos (PDF / TXT)
- Clique no ícone de **upload** no campo de texto.
- Limite: **20 MB** por arquivo.
- O documento é indexado e fica disponível como contexto para toda a sessão.

### Salvar / Exportar Respostas
- **Copiar:** passe o mouse sobre a mensagem e clique no ícone de cópia.
- **Imprimir/PDF:** clique no ícone de impressora — abre uma janela de impressão formatada.
- **Canvas:** ative o modo Canvas para editar e exportar a resposta como documento **.md**.

### Sessões
- Cada conversa é uma **sessão** independente.
- Sessões ficam salvas na barra lateral e podem ser acessadas a qualquer momento.
- Você pode ter sessões temáticas: *Casos Clínicos*, *Protocolos*, *Pesquisa*, etc.
`,

  sessions: `
## 📌 Guia Completo — Sessões

### Criar uma nova sessão
- Clique no botão **"+"** (Nova Consulta) no topo da barra lateral.
- A sessão recebe o título automático baseado na sua primeira mensagem.

### Gerenciar sessões (menu de três pontinhos ⋯)
| Ação | Descrição |
|------|-----------|
| 📌 Fixar | Mantém a sessão no topo da lista |
| ✏️ Renomear | Permite dar um título personalizado |
| 🔗 Compartilhar | Gera link público (somente leitura) |
| 🗑️ Excluir | Remove a sessão permanentemente |

### Excluir várias sessões de uma vez
1. Clique no ícone de seleção (☐) no topo da barra lateral.
2. Marque as sessões desejadas.
3. Clique em **"Excluir selecionadas"**.

### Compartilhamento de sessões
- O link gerado é **público** — qualquer pessoa com o link pode ler a conversa.
- O link não expira automaticamente. Para revogar, exclua a sessão.
- O conteúdo compartilhado é **somente leitura** — ninguém pode editar.
`,

  models: `
## 🧠 Guia Completo — Modelos de IA

### Roteamento Automático
O sistema analisa cada mensagem e escolhe automaticamente o modelo mais adequado:

| Tipo de tarefa | Modelo usado |
|----------------|-------------|
| Pergunta simples / rápida | Modelo leve (Groq / Llama) |
| Análise clínica complexa | Modelo avançado (GPT-4 / Claude) |
| Dados laboratoriais | Modelo com raciocínio estruturado |
| Contexto RAG ativo | Modelo com longa janela de contexto |

### Fixar um modelo manualmente
1. Clique em **"fixar modelo"** no topo do chat.
2. Selecione o modelo desejado no seletor.
3. Para voltar ao automático, clique em **"voltar auto"**.

### Modelos disponíveis
- **Groq / Llama 3** — Ultra-rápido, ideal para consultas rápidas
- **GPT-4o** — Excelente raciocínio clínico geral
- **Claude Sonnet** — Ótimo para textos longos e análises detalhadas
- **Gemini Pro** — Multimodal, bom com dados tabulares
- **Modelos personalizados** — Configure em *Integrações*

### Dica de custo
Modelos mais leves consomem menos créditos. Use o roteamento automático para otimizar o custo sem perder qualidade.
`,

  canvas: `
## 🖊️ Guia Completo — Ferramenta Canvas

### O que é o Canvas?
O Canvas é um **editor de documentos integrado** que aparece ao lado do chat. Quando ativado, as respostas da IA são formatadas como documentos editáveis — perfeito para criar protocolos, laudos e resumos clínicos.

### Como ativar
1. Clique no ícone **Canvas** (📄) no campo de entrada do chat.
2. O ícone ficará destacado indicando que o modo está ativo.
3. A próxima resposta da IA abrirá automaticamente no painel Canvas.

### Funcionalidades do editor
| Ferramenta | Ação |
|-----------|------|
| **B** | Negrito |
| *I* | Itálico |
| H1 / H2 / H3 | Títulos e subtítulos |
| — | Lista com marcadores |
| 1. | Lista numerada |
| ↩ / ↪ | Desfazer / Refazer |

### Modos de visualização
- **Preview:** exibe o documento renderizado com formatação Markdown.
- **Edição:** textarea para editar o texto diretamente.

### Exportar o documento
- **Copiar (📋):** copia o Markdown bruto.
- **Download (.md):** salva como arquivo Markdown.
- **Imprimir:** abre a janela de impressão com o documento formatado.
`,

  biblioteca: `
## 📁 Guia Completo — Biblioteca de Documentos

### Para que serve?
A Biblioteca é o repositório central de conhecimento da plataforma. Documentos indexados aqui ficam disponíveis como contexto para o Chat — a IA os consulta automaticamente via busca semântica (RAG).

### Tipos de documentos suportados
- 📄 **PDF** — laudos, artigos, protocolos
- 📝 **TXT / MD** — notas, resumos, diretrizes
- ✍️ **Notas manuais** — criadas diretamente na plataforma

### Como criar uma pasta
1. Na barra lateral da Biblioteca, clique em **"+ Nova Pasta"**.
2. Escolha um nome, ícone e cor.
3. Arraste documentos para organizar.

### Como fazer upload
1. Clique no botão **"Novo Documento"**.
2. Selecione **"Upload de arquivo"** ou **"Criar nota"**.
3. O documento é indexado automaticamente para busca semântica.

### Como a IA usa os documentos (RAG)
- Quando você envia uma mensagem no Chat, o sistema busca os trechos mais relevantes da Biblioteca.
- Esses trechos são incluídos como contexto para a IA antes de gerar a resposta.
- Você pode ver a fonte do trecho utilizado na resposta.

### Dicas de organização
- Use pastas por especialidade: *Cardiologia*, *Endocrinologia*, *Pediatria*.
- Mantenha documentos atualizados — versões antigas podem gerar respostas desatualizadas.
`,

  laboratorio: `
## 🧪 Guia Completo — Laboratório

### Skills Personalizadas
Skills são **instruções especiais** que a IA segue em todas as conversas enquanto estão ativas.

**Exemplos de uso:**
- *"Sempre responda em formato SOAP"*
- *"Inclua o CID-10 em toda hipótese diagnóstica"*
- *"Use linguagem simplificada para o paciente"*

**Como criar uma Skill:**
1. Vá para Laboratório → aba **Skills**.
2. Clique em **"+ Nova Skill"**.
3. Defina título, categoria e o template de prompt.
4. Ative ou desative a skill a qualquer momento.

### Configuração de API Própria
Você pode conectar sua própria chave de API para usar modelos externos:

1. Vá para Laboratório → aba **Configuração LLM**.
2. Selecione o provedor (OpenAI, Anthropic, Google, etc.).
3. Insira sua chave de API — ela é armazenada de forma **criptografada** no servidor.
4. Defina o modelo padrão e os parâmetros (temperatura, max tokens).

### Dashboard de Consumo
- Visualize o uso de tokens por sessão, por modelo e por período.
- Acompanhe o custo estimado em USD.
- Identifique quais modelos estão sendo mais utilizados.

### Indexação Vetorial (RAG)
- Administradores podem iniciar a reindexação de documentos da Biblioteca.
- Útil após atualizar ou adicionar muitos documentos de uma vez.
`,

  integracoes: `
## 🔌 Guia Completo — Integrações

### O que são Integrações?
Integrações permitem conectar provedores externos de IA à plataforma, usando suas próprias chaves de API para ter controle total sobre custo, modelos e limites de uso.

### Provedores suportados
| Provedor | Modelos populares |
|----------|------------------|
| **OpenAI** | GPT-4o, GPT-4 Turbo, GPT-3.5 |
| **Anthropic** | Claude 3.5 Sonnet, Claude Opus |
| **Google** | Gemini 1.5 Pro, Gemini Flash |
| **Groq** | Llama 3, Mixtral (ultra-rápido) |
| **Mistral** | Mistral Large, Codestral |
| **Together AI** | Modelos open-source variados |

### Como adicionar uma integração
1. Acesse **Integrações** no menu lateral.
2. Clique em **"+ Adicionar Provedor"**.
3. Selecione o provedor e insira sua chave de API.
4. Clique em **"Testar"** para validar a conexão.
5. Após validado, o modelo estará disponível no seletor do Chat.

### Segurança das chaves de API
- As chaves são armazenadas **criptografadas** no servidor.
- Nunca são expostas para outros usuários.
- Apenas administradores podem gerenciar integrações globais.

### Integração personalizada (avançado)
- Em *"Integração Customizada"*, você pode configurar qualquer API compatível com o formato OpenAI.
- Defina a URL base, endpoint, header de autenticação e formato de resposta.
`,

  admin: `
## 🛡️ Guia do Administrador

### Gerenciar Usuários
- Acesse **Admin → Usuários** no menu lateral.
- Veja todos os usuários cadastrados com status de aprovação.
- **Aprovar:** libera o acesso do usuário à plataforma.
- **Revogar:** bloqueia o acesso imediatamente (o usuário vê tela de acesso negado).

### Fluxo de aprovação
\`\`\`
Usuário se cadastra → Fica "Pendente" → Admin aprova → Acesso liberado
\`\`\`

> Usuários que entram via **Google** são aprovados automaticamente. Usuários via e-mail/senha aguardam aprovação manual.

### Skills Globais
- Skills criadas por administradores ficam disponíveis para **todos os usuários**.
- Skills de usuários comuns são visíveis apenas para eles mesmos.

### Segurança
- **Chaves de API** nunca são visíveis para usuários comuns — ficam criptografadas no servidor.
- **Documentos** da Biblioteca: usuários veem apenas os próprios documentos. Admins veem tudo.
- **Sessões de chat:** cada usuário vê apenas as próprias sessões.

### Indexação RAG (Laboratório)
- Inicie a reindexação sempre que houver muitos documentos novos na Biblioteca.
- A indexação cria vetores semânticos que permitem à IA buscar conteúdo relevante.

### Documentação Técnica
- Acesse **Admin → Documentação** para ver a referência técnica completa de todas as funções e componentes do sistema.
`,

  dicas: `
## ⚡ Guia de Dicas Rápidas

### Atalhos e truques

**No Chat:**
- \`Enter\` → Envia a mensagem
- \`Shift + Enter\` → Nova linha sem enviar
- Passe o mouse sobre qualquer mensagem da IA para ver as ações (copiar, PDF, feedback)

**Na barra lateral:**
- Clique nos **três pontinhos** ao lado de uma sessão para ver as opções de gerenciamento
- Clique no ícone de seleção **(☐)** para selecionar múltiplas sessões

**No Canvas:**
- Alterne entre **Preview** e **Edição** pelo botão no topo do painel
- Use os botões da toolbar para formatar sem precisar saber Markdown

### Como obter melhores respostas

| ❌ Evite | ✅ Prefira |
|--------|----------|
| "Me fale sobre diabetes" | "Paciente 52 anos, DM2 descompensado, HbA1c 10.5. Ajuste terapêutico?" |
| "Qual o tratamento?" | "Protocolo de tratamento para sepse abdominal — paciente pós-cirúrgico" |
| "Analise isso" + (texto sem contexto) | "Paciente [dados]. Analise este hemograma e identifique alterações críticas" |

### Organize seu fluxo de trabalho
1. **Sessões temáticas** — crie sessões separadas por caso ou especialidade
2. **Skills ativas** — configure as skills que você usa sempre (ex: formato SOAP)
3. **Biblioteca atualizada** — mantenha seus protocolos indexados para RAG automático
4. **Canvas** — use para gerar documentos prontos para copiar/imprimir

### Dicas de desempenho
- Se a resposta vier truncada, peça: *"continue de onde parou"*
- Para respostas mais curtas: *"responda de forma resumida em tópicos"*
- Para mais detalhes: *"aprofunde o item X da resposta anterior"*
`,
};

// ─── Componentes ────────────────────────────────────────────────────────────

const Section = ({ icon: Icon, color, title, subtitle, detailsKey, onOpenDetails, children }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-5 pb-5 pt-2 border-t border-border space-y-3">
          {children}
          {detailsKey && DETAILS[detailsKey] && (
            <div className="pt-2 border-t border-dashed border-border mt-1">
              <button
                onClick={() => onOpenDetails(title, DETAILS[detailsKey])}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 hover:underline transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Ler guia completo
                <ExternalLink className="w-3 h-3 opacity-60" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Tip = ({ emoji, text }) => (
  <div className="flex items-start gap-2 text-sm text-muted-foreground">
    <span className="text-base shrink-0">{emoji}</span>
    <span>{text}</span>
  </div>
);

const AdminBlock = ({ children }) => (
  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
    <div className="flex items-center gap-2 text-amber-700 font-semibold text-xs uppercase tracking-wide">
      <Shield className="w-3.5 h-3.5" /> Área do Administrador
    </div>
    {children}
  </div>
);

// ─── Página ─────────────────────────────────────────────────────────────────

export default function Ajuda() {
  const { user } = useAuth();
  const [modal, setModal] = useState(null); // { title, content }

  if (!user) return null;

  const openDetails = (title, content) => setModal({ title, content });
  const closeDetails = () => setModal(null);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="px-4 sm:px-8 py-6 border-b border-border bg-card/80 shrink-0">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <HelpCircle className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Central de Ajuda</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Entenda como usar o Chamsa ISA no seu dia a dia — sem complicações.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 space-y-4">

          {/* Intro card */}
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5">
            <p className="text-sm text-foreground leading-relaxed">
              👋 <strong>Bem-vindo ao Chamsa ISA!</strong> Este é um assistente de inteligência artificial feito para ajudar profissionais de saúde. Aqui você encontra tudo que precisa saber para usar a plataforma com segurança e eficiência.
            </p>
          </div>

          {/* CHAT */}
          <Section icon={MessageSquare} color="bg-indigo-100 text-indigo-600" title="Como usar o Chat" subtitle="Converse com a IA e obtenha análises clínicas" detailsKey="chat" onOpenDetails={openDetails}>
            <Tip emoji="💬" text="Digite sua pergunta ou dúvida clínica na caixa de texto no rodapé da tela e pressione Enter ou clique no botão de enviar." />
            <Tip emoji="🤖" text="A IA responde com base em conhecimento médico atualizado. Quanto mais detalhes você fornecer, melhor será a resposta." />
            <Tip emoji="📋" text="Você pode colar dados clínicos (como exames laboratoriais) clicando no ícone de clipe. A IA vai analisar e gerar hipóteses diagnósticas." />
            <Tip emoji="📄" text="Também é possível fazer upload de documentos (PDF, TXT) para que a IA os leia e responda perguntas sobre o conteúdo." />
            <Tip emoji="🖨️" text="Para salvar uma resposta, use o botão de impressão que aparece ao passar o mouse sobre a mensagem da IA." />
            <Tip emoji="🔁" text="Cada conversa é uma 'sessão'. Você pode criar várias sessões para organizar temas diferentes — elas ficam salvas na barra lateral." />
          </Section>

          {/* SESSÕES */}
          <Section icon={Pin} color="bg-purple-100 text-purple-600" title="Gerenciar suas Sessões" subtitle="Organize, renomeie e compartilhe conversas" detailsKey="sessions" onOpenDetails={openDetails}>
            <Tip emoji="📌" text="Clique nos três pontinhos ao lado de uma sessão para fixar, renomear, compartilhar ou excluir." />
            <Tip emoji="🔗" text="Ao compartilhar, é gerado um link público que qualquer pessoa pode acessar para ler a conversa (somente leitura)." />
            <Tip emoji="🗑️" text="Para excluir várias sessões de uma vez, clique no ícone de seleção (quadradinho) no topo da lista e marque as que deseja apagar." />
          </Section>

          {/* MODELOS */}
          <Section icon={Brain} color="bg-blue-100 text-blue-600" title="Escolher o Modelo de IA" subtitle="Entenda o que é roteamento automático" detailsKey="models" onOpenDetails={openDetails}>
            <Tip emoji="⚡" text="Por padrão, o sistema escolhe automaticamente o modelo mais adequado para cada mensagem — você não precisa se preocupar com isso." />
            <Tip emoji="🔒" text="Se quiser sempre usar o mesmo modelo, clique em 'fixar modelo' no topo do chat. Para voltar ao automático, clique em 'voltar auto'." />
            <Tip emoji="🧠" text="Modelos mais potentes são usados para perguntas complexas. Modelos mais rápidos são usados para perguntas simples." />
          </Section>

          {/* CANVAS */}
          <Section icon={BookOpen} color="bg-emerald-100 text-emerald-600" title="Ferramenta Canvas" subtitle="Crie e edite documentos a partir das respostas da IA" detailsKey="canvas" onOpenDetails={openDetails}>
            <Tip emoji="🖊️" text="O Canvas é um editor de documentos integrado. Quando ativado, as respostas da IA aparecem como um documento editável ao lado do chat." />
            <Tip emoji="✅" text="Para ativar, clique no ícone de Canvas no campo de texto. Para desativar, clique novamente." />
            <Tip emoji="💾" text="Você pode copiar, exportar ou imprimir o conteúdo do Canvas a qualquer momento." />
          </Section>

          {/* BIBLIOTECA */}
          <Section icon={FolderSearch} color="bg-teal-100 text-teal-600" title="Biblioteca de Documentos" subtitle="Guarde protocolos, laudos e pesquisas" detailsKey="biblioteca" onOpenDetails={openDetails}>
            <Tip emoji="📁" text="Na Biblioteca, você pode criar pastas para organizar seus documentos (protocolos, laudos, notas, etc.)." />
            <Tip emoji="⬆️" text="Faça upload de arquivos PDF ou TXT, ou crie notas diretamente pela plataforma." />
            <Tip emoji="🔍" text="Use a busca para encontrar documentos rapidamente pelo título ou conteúdo." />
            <Tip emoji="📎" text="Os documentos indexados ficam disponíveis como contexto para o Chat — a IA pode consultá-los automaticamente." />
          </Section>

          {/* LABORATÓRIO */}
          <Section icon={Beaker} color="bg-violet-100 text-violet-600" title="Laboratório" subtitle="Personalize o comportamento da IA" detailsKey="laboratorio" onOpenDetails={openDetails}>
            <Tip emoji="🧪" text="No Laboratório, você pode configurar Skills — instruções especiais que a IA segue em todas as conversas quando ativadas." />
            <Tip emoji="⚙️" text="Você também pode configurar sua própria chave de API para usar modelos de IA externos (OpenAI, Anthropic, etc.)." />
            <Tip emoji="📊" text="Veja o histórico de uso de tokens e o custo estimado das suas interações com a IA." />
          </Section>

          {/* INTEGRAÇÕES */}
          <Section icon={Plug} color="bg-amber-100 text-amber-600" title="Integrações" subtitle="Conecte outros serviços de IA" detailsKey="integracoes" onOpenDetails={openDetails}>
            <Tip emoji="🔌" text="Em Integrações, você pode adicionar provedores externos de IA como Groq, OpenAI, Anthropic, Google Gemini e outros." />
            <Tip emoji="🔑" text="Para usar um provedor externo, você precisará de uma chave de API do respectivo serviço." />
            <Tip emoji="🧪" text="Você pode testar a integração diretamente pela plataforma antes de usá-la no chat." />
          </Section>

          {/* ADMIN */}
          {user?.role === 'admin' && (
            <Section icon={Users} color="bg-rose-100 text-rose-600" title="Controles do Administrador" subtitle="Gerencie usuários e configurações avançadas" detailsKey="admin" onOpenDetails={openDetails}>
              <AdminBlock>
                <Tip emoji="👥" text="Em 'Gerenciar Usuários', você vê todos os usuários cadastrados. Pode aprovar ou revogar o acesso de cada um." />
                <Tip emoji="✅" text="Novos usuários ficam pendentes de aprovação até que um administrador os libere." />
                <Tip emoji="🚫" text="Ao revogar o acesso de um usuário, ele é redirecionado para uma tela de acesso bloqueado automaticamente." />
              </AdminBlock>
              <AdminBlock>
                <Tip emoji="🔧" text="Você pode criar Skills globais no Laboratório — elas ficam disponíveis para todos os usuários." />
                <Tip emoji="📂" text="O administrador pode visualizar todas as conversas e documentos da plataforma." />
                <Tip emoji="🗂️" text="A indexação vetorial (RAG) permite que a IA busque informações nos documentos da biblioteca automaticamente." />
              </AdminBlock>
              <AdminBlock>
                <Tip emoji="⚠️" text="As chaves de API ficam armazenadas de forma segura no ambiente do servidor — nunca expostas para os usuários comuns." />
                <Tip emoji="🔒" text="Somente administradores podem criar, editar ou excluir Skills, configurações de IA e integrações globais." />
              </AdminBlock>
            </Section>
          )}

          {/* DICAS GERAIS */}
          <Section icon={Zap} color="bg-yellow-100 text-yellow-600" title="Dicas Rápidas" subtitle="Pequenos truques para aproveitar melhor" detailsKey="dicas" onOpenDetails={openDetails}>
            <Tip emoji="🖱️" text="Passe o mouse sobre qualquer mensagem da IA para ver as opções de copiar, avaliar e exportar." />
            <Tip emoji="📱" text="A plataforma funciona no celular também — o layout se adapta automaticamente." />
            <Tip emoji="💡" text="Seja específico nas perguntas. Em vez de 'me ajude com diabetes', tente 'paciente 45 anos, glicemia 280, sem complicações, qual protocolo?'" />
            <Tip emoji="🔄" text="Se a resposta vier estranha ou incompleta, tente reformular a pergunta com mais contexto clínico." />
          </Section>

          <p className="text-center text-xs text-muted-foreground pb-6 pt-2">
            Chamsa ISA · Central de Ajuda · Dúvidas? Fale com o administrador do sistema.
          </p>
        </div>
      </div>

      {/* Modal de detalhes */}
      <Dialog open={!!modal} onOpenChange={(open) => !open && closeDetails()}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-base font-bold">{modal?.title}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-1">
            <div className="chamsa-prose text-sm">
              <ReactMarkdown>{modal?.content || ''}</ReactMarkdown>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}