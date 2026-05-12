import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { ChevronDown, ChevronUp, MessageSquare, FolderSearch, Beaker, Plug, Users, Brain, Upload, Share2, Pin, Trash2, Search, Key, Zap, BookOpen, HelpCircle, Shield } from 'lucide-react';

const Section = ({ icon: Icon, color, title, subtitle, children }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="w-4.5 h-4.5 w-5 h-5" />
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

export default function Ajuda() {
  const { user } = useAuth();

  if (!user) return null;

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
          <Section icon={MessageSquare} color="bg-indigo-100 text-indigo-600" title="Como usar o Chat" subtitle="Converse com a IA e obtenha análises clínicas">
            <Tip emoji="💬" text="Digite sua pergunta ou dúvida clínica na caixa de texto no rodapé da tela e pressione Enter ou clique no botão de enviar." />
            <Tip emoji="🤖" text="A IA responde com base em conhecimento médico atualizado. Quanto mais detalhes você fornecer, melhor será a resposta." />
            <Tip emoji="📋" text="Você pode colar dados clínicos (como exames laboratoriais) clicando no ícone de clipe. A IA vai analisar e gerar hipóteses diagnósticas." />
            <Tip emoji="📄" text="Também é possível fazer upload de documentos (PDF, TXT) para que a IA os leia e responda perguntas sobre o conteúdo." />
            <Tip emoji="🖨️" text="Para salvar uma resposta, use o botão de impressão que aparece ao passar o mouse sobre a mensagem da IA." />
            <Tip emoji="🔁" text="Cada conversa é uma 'sessão'. Você pode criar várias sessões para organizar temas diferentes — elas ficam salvas na barra lateral." />
          </Section>

          {/* SESSÕES */}
          <Section icon={Pin} color="bg-purple-100 text-purple-600" title="Gerenciar suas Sessões" subtitle="Organize, renomeie e compartilhe conversas">
            <Tip emoji="📌" text="Clique nos três pontinhos ao lado de uma sessão para fixar, renomear, compartilhar ou excluir." />
            <Tip emoji="🔗" text="Ao compartilhar, é gerado um link público que qualquer pessoa pode acessar para ler a conversa (somente leitura)." />
            <Tip emoji="🗑️" text="Para excluir várias sessões de uma vez, clique no ícone de seleção (quadradinho) no topo da lista e marque as que deseja apagar." />
          </Section>

          {/* MODELOS */}
          <Section icon={Brain} color="bg-blue-100 text-blue-600" title="Escolher o Modelo de IA" subtitle="Entenda o que é roteamento automático">
            <Tip emoji="⚡" text="Por padrão, o sistema escolhe automaticamente o modelo mais adequado para cada mensagem — você não precisa se preocupar com isso." />
            <Tip emoji="🔒" text="Se quiser sempre usar o mesmo modelo, clique em 'fixar modelo' no topo do chat. Para voltar ao automático, clique em 'voltar auto'." />
            <Tip emoji="🧠" text="Modelos mais potentes são usados para perguntas complexas. Modelos mais rápidos são usados para perguntas simples." />
          </Section>

          {/* CANVAS */}
          <Section icon={BookOpen} color="bg-emerald-100 text-emerald-600" title="Ferramenta Canvas" subtitle="Crie e edite documentos a partir das respostas da IA">
            <Tip emoji="🖊️" text="O Canvas é um editor de documentos integrado. Quando ativado, as respostas da IA aparecem como um documento editável ao lado do chat." />
            <Tip emoji="✅" text="Para ativar, clique no ícone de Canvas no campo de texto. Para desativar, clique novamente." />
            <Tip emoji="💾" text="Você pode copiar, exportar ou imprimir o conteúdo do Canvas a qualquer momento." />
          </Section>

          {/* BIBLIOTECA */}
          <Section icon={FolderSearch} color="bg-teal-100 text-teal-600" title="Biblioteca de Documentos" subtitle="Guarde protocolos, laudos e pesquisas">
            <Tip emoji="📁" text="Na Biblioteca, você pode criar pastas para organizar seus documentos (protocolos, laudos, notas, etc.)." />
            <Tip emoji="⬆️" text="Faça upload de arquivos PDF ou TXT, ou crie notas diretamente pela plataforma." />
            <Tip emoji="🔍" text="Use a busca para encontrar documentos rapidamente pelo título ou conteúdo." />
            <Tip emoji="📎" text="Os documentos indexados ficam disponíveis como contexto para o Chat — a IA pode consultá-los automaticamente." />
          </Section>

          {/* LABORATÓRIO */}
          <Section icon={Beaker} color="bg-violet-100 text-violet-600" title="Laboratório" subtitle="Personalize o comportamento da IA">
            <Tip emoji="🧪" text="No Laboratório, você pode configurar Skills — instruções especiais que a IA segue em todas as conversas quando ativadas." />
            <Tip emoji="⚙️" text="Você também pode configurar sua própria chave de API para usar modelos de IA externos (OpenAI, Anthropic, etc.)." />
            <Tip emoji="📊" text="Veja o histórico de uso de tokens e o custo estimado das suas interações com a IA." />
          </Section>

          {/* INTEGRAÇÕES */}
          <Section icon={Plug} color="bg-amber-100 text-amber-600" title="Integrações" subtitle="Conecte outros serviços de IA">
            <Tip emoji="🔌" text="Em Integrações, você pode adicionar provedores externos de IA como Groq, OpenAI, Anthropic, Google Gemini e outros." />
            <Tip emoji="🔑" text="Para usar um provedor externo, você precisará de uma chave de API do respectivo serviço." />
            <Tip emoji="🧪" text="Você pode testar a integração diretamente pela plataforma antes de usá-la no chat." />
          </Section>

          {/* ADMIN */}
          {user?.role === 'admin' && (
            <Section icon={Users} color="bg-rose-100 text-rose-600" title="Controles do Administrador" subtitle="Gerencie usuários e configurações avançadas">
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
          <Section icon={Zap} color="bg-yellow-100 text-yellow-600" title="Dicas Rápidas" subtitle="Pequenos truques para aproveitar melhor">
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
    </div>
  );
}