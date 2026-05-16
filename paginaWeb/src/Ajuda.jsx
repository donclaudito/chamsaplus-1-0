import React, { useState, useMemo } from 'react';
import { useAuth } from './lib/AuthContext';
import { ChevronDown, ChevronUp, MessageSquare, FolderSearch, Beaker, Plug, Users, Brain, Upload, Share2, Pin, Trash2, Search, Key, Zap, BookOpen, HelpCircle, Shield, X, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Conteúdo detalhado em Markdown por seção ───────────────────────────────
const DETAILS = {
  chat: `
## 💬 Guia Completo — Como usar o Chat

O chat é o coração do Chamsa ISA. Aqui você conversa com a IA como se fosse um colega especialista, disponível 24h.

---

### 📝 Como formular boas perguntas

A qualidade da resposta depende diretamente da qualidade da pergunta. A IA precisa de **contexto clínico** para ser útil.

**Estrutura recomendada:**
> *Paciente [sexo, idade], com [queixa principal] há [tempo], histórico de [comorbidades]. Exames: [valores]. Medicações em uso: [lista]. Quais hipóteses diagnósticas? Qual conduta recomendada?*

**Exemplos práticos:**

✅ *"Paciente masculino, 58 anos, HAS e DM2, com dispneia progressiva há 2 semanas e edema MMII. Glicemia 180, creatinina 1.8, BNP 850. Hipóteses e conduta?"*

✅ *"Criança 4 anos com febre há 5 dias, linfadenopatia cervical, hiperemia conjuntival bilateral e língua em framboesa. Qual síndrome suspeitar? Critérios diagnósticos e tratamento?"*

❌ *"me ajude com dispneia"* — sem contexto, a resposta será genérica.

---

### 📋 Colar Dados Clínicos (ícone de clipe)

1. Clique no ícone de **clipe** (📎) na barra de entrada.
2. Dê um título descritivo ao bloco: ex. *"Hemograma 10/05/2025"*.
3. Cole os valores em texto livre — não precisa formatar.
4. A IA analisa automaticamente e retorna: **Red Flags**, hipóteses ordenadas por probabilidade, exames complementares recomendados e conduta.

**Exemplos de dados que você pode colar:**
- Hemograma completo
- Painel metabólico (sódio, potássio, creatinina, glicemia)
- Gasometria arterial
- Troponina, BNP, PCR
- Relatório de exame de imagem (texto)
- Laudo de ECG

---

### 📄 Upload de Documentos (PDF / TXT)

- Clique no ícone de **upload** (⬆️) no campo de texto.
- Tamanho máximo: **20 MB** por arquivo.
- Formatos aceitos: **PDF, TXT, MD**.
- Após o upload, o documento é indexado automaticamente e fica disponível como contexto para toda a sessão.
- Você pode fazer perguntas diretamente sobre o documento: *"Quais são as conclusões deste laudo?"*, *"Há contraindicações mencionadas neste protocolo?"*

**Dúvida frequente:** *"O documento é compartilhado com outros usuários?"*
> Não. Cada documento enviado no chat é privado e visível apenas para você na sessão atual.

---

### 💾 Salvar e Exportar Respostas

| Método | Como fazer |
|--------|-----------|
| **Copiar texto** | Passe o mouse sobre a mensagem → clique no ícone 📋 |
| **Imprimir / PDF** | Passe o mouse sobre a mensagem → clique no ícone 🖨️ |
| **Canvas** | Ative o modo Canvas → a resposta abre como documento editável |
| **Download .md** | No Canvas → clique em "Download" |

---

### 🔁 O que são Sessões?

- Cada conversa é uma **sessão independente** com seu próprio histórico.
- Sessões são salvas automaticamente na barra lateral.
- Você pode criar sessões temáticas: *"Casos de Cardiologia"*, *"Pesquisa — Sepse"*, *"Protocolos UTI"*.
- O histórico de cada sessão é mantido indefinidamente, a menos que você exclua.

**Dúvida frequente:** *"A IA lembra de uma sessão anterior?"*
> Não diretamente. Cada sessão tem seu próprio contexto isolado. Se quiser continuar um raciocínio, use a mesma sessão ou copie o contexto relevante para a nova sessão.

---

### ⚠️ Aviso Médico Importante

O Chamsa ISA é uma **ferramenta de apoio à decisão clínica**, não um substituto ao julgamento médico. Todas as respostas devem ser avaliadas pelo profissional de saúde responsável. Não use como fonte única para condutas em emergências.
`,

  sessions: `
## 📌 Guia Completo — Gerenciar Sessões

---

### ➕ Criar uma nova sessão

1. Clique no botão **"+"** (Nova Consulta) no topo da barra lateral esquerda.
2. A sessão é criada imediatamente com uma mensagem inicial do assistente.
3. O título é gerado automaticamente a partir da sua **primeira mensagem** — você pode renomear depois.

---

### ⋯ Menu de opções (três pontinhos ao lado da sessão)

| Ação | O que faz |
|------|-----------|
| 📌 **Fixar** | Mantém a sessão sempre no topo da lista, independente da data |
| ✏️ **Renomear** | Permite dar um título personalizado e descritivo |
| 🔗 **Compartilhar** | Gera um link público de leitura para a sessão |
| 🗑️ **Excluir** | Remove a sessão permanentemente (não tem como desfazer) |

---

### 🗑️ Excluir várias sessões de uma vez

1. Clique no ícone de seleção **(☐)** no topo da barra lateral.
2. Uma caixa de seleção aparece ao lado de cada sessão.
3. Marque todas as sessões que deseja remover.
4. Clique em **"Excluir selecionadas"** e confirme.

> ⚠️ **Atenção:** A exclusão é permanente. O histórico de mensagens não pode ser recuperado após a exclusão.

---

### 🔗 Compartilhamento de Sessões

- O link gerado é **público** — qualquer pessoa com o link pode acessar e ler a conversa.
- O link **não expira automaticamente**. Para revogar o acesso, exclua a sessão.
- O conteúdo compartilhado é **somente leitura** — quem acessa pelo link não pode responder nem editar.
- O link pode ser copiado diretamente pelo menu e enviado por WhatsApp, e-mail ou qualquer meio.

**Dúvida frequente:** *"Posso compartilhar sem que vejam meu nome?"*
> O link compartilhado mostra apenas o conteúdo da conversa. Informações de identificação do usuário não são exibidas.

---

### 📌 Dica de organização

Crie sessões temáticas para manter seu trabalho organizado:

- *🫀 Cardiologia — Casos Agosto/2025*
- *🧪 Revisão de Exames — UTI*
- *📚 Pesquisa — Protocolo Sepse*
- *📝 Elaboração de Laudos*

Fixe as sessões mais usadas para acesso rápido no topo da lista.

---

### ❓ Dúvidas frequentes

**"Minha sessão sumiu. O que aconteceu?"**
> Sessões são carregadas do servidor. Se a lista estiver vazia, tente recarregar a página. Se o problema persistir, entre em contato com o administrador.

**"Posso recuperar uma sessão excluída?"**
> Não. A exclusão é permanente. Recomendamos exportar sessões importantes antes de excluir.

**"Quantas sessões posso ter?"**
> Não há limite definido. Para melhor performance, recomendamos manter até 100 sessões ativas.
`,

  models: `
## 🧠 Guia Completo — Modelos de IA

---

### 🤖 O que é roteamento automático?

O **roteamento automático** analisa cada mensagem e escolhe o modelo de IA mais adequado para aquela tarefa específica — balanceando **qualidade**, **velocidade** e **custo**.

Você não precisa saber qual modelo usar. O sistema decide por você.

---

### 📊 Lógica de roteamento

| Tipo de tarefa | Modelo escolhido | Motivo |
|----------------|-----------------|--------|
| Pergunta simples / consulta rápida | Groq / Llama 3 | Ultraveloz, baixo custo |
| Análise clínica complexa | GPT-4o / Claude Sonnet | Alto raciocínio estruturado |
| Dados laboratoriais extensos | Claude / Gemini Pro | Longa janela de contexto |
| Busca com RAG ativo | Modelo com contexto amplo | Precisa processar muitos trechos |
| Modo Canvas ativo | Modelo de alta qualidade | Gera documentos longos e coerentes |

---

### 🔒 Fixar um modelo manualmente

Se você preferir sempre usar o mesmo modelo:

1. Clique em **"fixar modelo"** no topo do chat (link discreto na barra de roteamento).
2. Selecione o modelo desejado no seletor dropdown.
3. Um ícone de cadeado (🔒) aparece indicando que o modelo está fixado.
4. Para voltar ao automático, clique em **"voltar auto"**.

---

### 📋 Modelos disponíveis

| Modelo | Velocidade | Qualidade | Melhor para |
|--------|-----------|-----------|-------------|
| **Llama 3 (Groq)** | ⚡⚡⚡ Ultrarrápido | ⭐⭐⭐ | Consultas rápidas, triagem |
| **GPT-4o** | ⚡⚡ Rápido | ⭐⭐⭐⭐⭐ | Análise clínica geral |
| **Claude Sonnet** | ⚡⚡ Rápido | ⭐⭐⭐⭐⭐ | Textos longos, protocolos |
| **Gemini Pro** | ⚡⚡ Rápido | ⭐⭐⭐⭐ | Dados tabulares, multimodal |
| **Modelos custom** | Variável | Variável | Configurados pelo usuário |

---

### 💰 Impacto no custo de tokens

- Modelos mais leves (Groq/Llama) consomem **menos tokens** por interação.
- Modelos avançados (GPT-4o, Claude) consomem **mais tokens**, mas entregam respostas mais precisas.
- O roteamento automático **otimiza o custo** sem sacrificar qualidade para cada tipo de tarefa.
- Você pode acompanhar o consumo em tempo real na barra superior do chat e no Laboratório.

---

### ❓ Dúvidas frequentes

**"Por que a resposta foi mais lenta dessa vez?"**
> A mensagem pode ter sido roteada para um modelo mais poderoso por conter dados complexos. Isso é esperado.

**"Como sei qual modelo foi usado?"**
> Quando um modelo externo (não o padrão) é utilizado, aparece um badge colorido no topo do chat indicando o modelo ativo.

**"Posso usar meu próprio GPT-4 com minha API key?"**
> Sim! Configure em **Laboratório → Configuração LLM** ou em **Integrações** e insira sua chave de API OpenAI.
`,

  canvas: `
## 🖊️ Guia Completo — Ferramenta Canvas

---

### 📄 O que é o Canvas?

O **Canvas** é um editor de documentos integrado ao lado do chat. Quando ativado, as respostas da IA são formatadas como **documentos estruturados e editáveis** — ideal para criar:

- 📋 Protocolos clínicos
- 🗒️ Resumos de caso
- 📑 Laudos e relatórios
- 📚 Notas de evolução (SOAP)
- 🔬 Revisões de literatura

---

### ▶️ Como ativar o Canvas

1. Clique no ícone **Canvas** (📄) na barra de ferramentas do campo de entrada.
2. O ícone ficará destacado (colorido) indicando que o modo está ativo.
3. Envie sua mensagem normalmente.
4. A resposta da IA aparecerá automaticamente no **painel Canvas** ao lado direito.

> 💡 **Dica:** Antes de ativar, peça à IA para criar um documento específico: *"Crie um protocolo de atendimento à sepse em formato SOAP"*

---

### 🛠️ Ferramentas do editor

| Botão | Ação | Atalho Markdown |
|-------|------|----------------|
| **B** | Negrito | \`**texto**\` |
| *I* | Itálico | \`*texto*\` |
| H1 | Título grande | \`# Título\` |
| H2 | Título médio | \`## Título\` |
| H3 | Título pequeno | \`### Título\` |
| — | Lista com marcadores | \`- item\` |
| 1. | Lista numerada | \`1. item\` |
| ↩ | Desfazer | (botão na toolbar) |
| ↪ | Refazer | (botão na toolbar) |

---

### 👁️ Modos de visualização

- **Preview (padrão):** exibe o documento com formatação visual renderizada — como o resultado final.
- **Edição:** exibe o texto Markdown bruto em um textarea para edição direta.

Alterne entre os modos pelo botão no topo do painel Canvas.

---

### 📤 Exportar o documento

| Opção | O que faz |
|-------|-----------|
| **Copiar (📋)** | Copia o Markdown bruto para a área de transferência |
| **Download (.md)** | Salva o documento como arquivo Markdown no computador |
| **Imprimir (🖨️)** | Abre janela de impressão com o documento formatado (pode salvar como PDF pelo navegador) |

---

### ❓ Dúvidas frequentes

**"A IA não abriu o Canvas mesmo com o modo ativado. Por quê?"**
> Em raras situações, a IA pode não gerar a tag Canvas esperada. Tente reformular a pergunta pedindo explicitamente um documento: *"Crie um documento estruturado com..."*

**"Perdi minha edição. Tem como recuperar?"**
> O Canvas tem histórico de undo (↩). Se fechar acidentalmente o painel, o conteúdo pode não ser recuperado — recomendamos copiar ou baixar o documento antes de fechar.

**"Posso continuar editando depois de fechar?"**
> Após fechar o Canvas, o documento não é salvo automaticamente na plataforma. Para persistir, use a Biblioteca de Documentos.

**"O Canvas funciona no celular?"**
> Sim. No celular, o Canvas abre como uma tela sobreposta (fullscreen) ao invés de painel lateral.
`,

  biblioteca: `
## 📁 Guia Completo — Biblioteca de Documentos

---

### 🎯 Para que serve a Biblioteca?

A Biblioteca é o **repositório central de conhecimento** da plataforma. Documentos indexados aqui ficam disponíveis como contexto automático para o Chat — a IA os consulta via **busca semântica (RAG)** antes de responder.

Isso significa que você pode perguntar algo no Chat e a IA vai automaticamente buscar trechos relevantes dos seus documentos para embasar a resposta.

---

### 📂 Tipos de documentos suportados

| Tipo | Extensão | Exemplos |
|------|----------|---------|
| Documento de texto | PDF | Artigos, protocolos, laudos |
| Texto simples | TXT | Notas, resumos, diretrizes |
| Markdown | MD | Protocolos formatados |
| Nota manual | — | Criada diretamente na plataforma |

---

### 📁 Como criar pastas

1. Na barra lateral da Biblioteca, clique em **"+ Nova Pasta"**.
2. Escolha um **nome**, **emoji/ícone** e **cor** para identificação visual.
3. Pastas podem conter subpastas para organização hierárquica.

**Sugestão de organização por especialidade:**
- 🫀 Cardiologia
- 🧠 Neurologia
- 🫁 Pneumologia
- 👶 Pediatria
- 🧪 Exames Laboratoriais

---

### ⬆️ Como fazer upload de documentos

1. Clique no botão **"Novo Documento"** (canto superior direito).
2. Selecione **"Upload de arquivo"** para enviar um PDF/TXT existente.
3. Ou selecione **"Criar nota"** para escrever um documento diretamente na plataforma.
4. O documento é **indexado automaticamente** em segundos para busca semântica.

---

### 🔍 Como a IA usa os documentos (RAG)

O sistema **RAG (Retrieval-Augmented Generation)** funciona assim:

1. Você envia uma mensagem no Chat.
2. O sistema converte sua mensagem em um vetor semântico.
3. Busca os **trechos mais relevantes** da Biblioteca (não o documento inteiro).
4. Injeta esses trechos como contexto para a IA antes de gerar a resposta.
5. A IA responde com base no seu conhecimento + os trechos encontrados.

**Dúvida frequente:** *"A IA vai ler meu documento inteiro?"*
> Não. O sistema divide os documentos em **chunks** (pedaços) de ~500 palavras e recupera apenas os mais relevantes para cada pergunta. Isso é mais eficiente e preciso do que enviar o documento completo.

---

### 🔗 Configurar fonte do Drive

No Chat, você pode configurar uma **pasta do Google Drive** como fonte adicional de contexto:

1. Clique no ícone de Drive (🗂️) na barra superior do chat.
2. Cole o ID da pasta do Google Drive.
3. Os arquivos da pasta serão indexados e usados como contexto adicional.

---

### ❓ Dúvidas frequentes

**"Quanto tempo leva para o documento ficar disponível para o Chat?"**
> A indexação é automática e geralmente leva menos de 30 segundos após o upload.

**"Outros usuários podem ver meus documentos?"**
> Não. Cada usuário vê apenas seus próprios documentos. Apenas administradores têm visibilidade total.

**"O que acontece se eu atualizar um documento?"**
> Você precisará fazer um novo upload da versão atualizada. O documento antigo pode ser excluído.

**"Há limite de documentos?"**
> Não há limite definido de quantidade, mas documentos muito grandes (acima de 50 páginas) podem ter desempenho de indexação mais lento.
`,

  laboratorio: `
## 🧪 Guia Completo — Laboratório

O Laboratório é o painel de configuração avançada da plataforma. Aqui você personaliza o comportamento da IA, monitora o uso e gerencia integrações técnicas.

---

### 🎯 Skills Personalizadas

**Skills** são instruções especiais que a IA segue automaticamente em **todas as conversas** enquanto estão ativas — como regras de comportamento permanentes.

**Exemplos de Skills úteis:**

| Skill | Prompt template |
|-------|----------------|
| Formato SOAP | *"Sempre estruture respostas clínicas no formato SOAP: Subjetivo, Objetivo, Avaliação, Plano."* |
| CID-10 obrigatório | *"Inclua o código CID-10 correspondente em toda hipótese diagnóstica."* |
| Linguagem simples | *"Use linguagem acessível para pacientes, evitando termos técnicos sem explicação."* |
| Referências | *"Sempre cite a fonte ou diretriz utilizada ao final de cada recomendação."* |
| Alerta de interações | *"Identifique e alerte sobre potenciais interações medicamentosas em toda prescrição analisada."* |

**Como criar uma Skill:**
1. Vá para **Laboratório → aba Skills**.
2. Clique em **"+ Nova Skill"**.
3. Defina: **título**, **ícone**, **categoria** e **template de prompt**.
4. Ative/desative com o toggle ao lado da skill.

> ⚠️ Skills criadas por administradores ficam ativas para **todos os usuários**. Skills de usuários comuns são privadas.

---

### ⚙️ Configuração de API Própria (LLM)

Você pode usar sua própria chave de API para ter acesso direto a modelos sem intermediários:

1. Vá para **Laboratório → aba Configuração LLM**.
2. Selecione o provedor: OpenAI, Anthropic, Google, Groq, Mistral.
3. Insira sua **chave de API** — armazenada criptografada no servidor.
4. Configure:
   - **Modelo:** ex. *gpt-4o*, *claude-3-5-sonnet*
   - **Temperatura:** controla criatividade (0.0 = determinístico, 1.0 = criativo)
   - **Max tokens:** limite de tamanho da resposta

**Dúvida frequente:** *"Minha API key fica visível para outros usuários?"*
> Não. As chaves são armazenadas **criptografadas** e nunca são exibidas na interface após salvas.

---

### 📊 Dashboard de Consumo de Tokens

Monitore o uso da plataforma em tempo real:

- 📅 **Uso diário e mensal** — tokens consumidos por período
- 🤖 **Por modelo** — veja quais modelos você usa mais
- 💰 **Custo estimado em USD** — baseado nas taxas oficiais de cada provedor
- 📋 **Por sessão** — identifique sessões com alto consumo

---

### 🔍 Indexação Vetorial (RAG)

O painel de indexação permite gerenciar os vetores semânticos dos documentos da Biblioteca:

- **Reindexar documento:** atualiza os vetores de um documento específico após edição.
- **Reindexar tudo:** reconstrói todos os vetores — útil após grandes atualizações na Biblioteca.
- **Ver status:** acompanhe quais documentos estão indexados e quais estão pendentes.

**Dúvida frequente:** *"Quando devo reindexar?"*
> Reindexe após atualizar, corrigir ou adicionar muitos documentos de uma vez. Em uso normal, a indexação é automática.

---

### 🎨 Temas e Personalização

No Laboratório você também pode personalizar a aparência da plataforma:
- Alterne entre tema **Claro**, **Escuro** e **Alto Contraste**.
- Suas preferências são salvas localmente no navegador.
`,

  integracoes: `
## 🔌 Guia Completo — Integrações

---

### 🎯 O que são Integrações?

Integrações permitem conectar **provedores externos de IA** à plataforma, usando suas próprias chaves de API. Isso dá a você:

- ✅ Controle total sobre qual modelo usar
- ✅ Acesso a modelos que não estão na plataforma por padrão
- ✅ Monitoramento do seu próprio consumo e custo
- ✅ Possibilidade de usar planos enterprise ou APIs corporativas

---

### 🏢 Provedores suportados

| Provedor | Modelos populares | Onde obter API key |
|----------|------------------|--------------------|
| **OpenAI** | GPT-4o, GPT-4 Turbo, GPT-3.5 | platform.openai.com |
| **Anthropic** | Claude 3.5 Sonnet, Claude Opus | console.anthropic.com |
| **Google** | Gemini 1.5 Pro, Gemini Flash | aistudio.google.com |
| **Groq** | Llama 3, Mixtral | console.groq.com |
| **Mistral** | Mistral Large, Codestral | console.mistral.ai |
| **Together AI** | Modelos open-source variados | api.together.xyz |

---

### ➕ Como adicionar uma integração

1. Acesse **Integrações** no menu lateral.
2. Clique em **"+ Adicionar Provedor"**.
3. Selecione o provedor na lista.
4. Cole sua **chave de API** no campo indicado.
5. Clique em **"Testar Conexão"** — um badge verde confirma o sucesso.
6. O modelo estará disponível no seletor do Chat após validação.

---

### 🔒 Segurança das chaves de API

- As chaves são armazenadas **criptografadas** no servidor.
- **Nunca são exibidas** após salvas (apenas os últimos 4 caracteres são mostrados).
- **Não são compartilhadas** com outros usuários.
- Apenas administradores podem gerenciar integrações globais.
- Para revogar o acesso, exclua a integração — a chave é removida imediatamente.

---

### 🔧 Integração Personalizada (Avançado)

Para APIs compatíveis com o formato OpenAI (qualquer serviço que siga o padrão de chat/completions):

1. Clique em **"+ Integração Customizada"**.
2. Configure:
   - **URL base:** ex. *https://minha-api.com*
   - **Endpoint:** ex. */v1/chat/completions*
   - **Header de autenticação:** ex. *Bearer {API_KEY}*
   - **Nome do secret:** variável de ambiente onde a chave será armazenada
   - **Formato de resposta:** mapeamento do campo de resposta, ex. *choices[0].message.content*

> Útil para APIs internas, modelos auto-hospedados (Ollama, LocalAI) ou qualquer provedor com formato OpenAI-compatible.

---

### 🧪 Testando uma integração

Após adicionar, clique em **"Testar"** no card da integração. O sistema envia uma mensagem de teste e verifica:
- ✅ Conectividade com o endpoint
- ✅ Autenticação válida
- ✅ Formato de resposta correto

---

### ❓ Dúvidas frequentes

**"Qual a diferença entre integração aqui e no Laboratório?"**
> Em **Integrações** você adiciona provedores de IA externos com API key. No **Laboratório** você configura qual modelo ativo usar como padrão para suas conversas.

**"Posso ter múltiplas integrações ativas ao mesmo tempo?"**
> Sim. Você pode ter várias integrações configuradas. O modelo usado em cada mensagem é determinado pelo roteamento automático ou pela seleção manual no chat.

**"Minha API key da OpenAI tem limite de uso. A plataforma respeita esse limite?"**
> Sim. A plataforma usa sua própria chave, então os limites são os que você configurou na sua conta OpenAI. Erros de limite aparecerão como mensagens de erro no chat.
`,

  admin: `
## 🛡️ Guia Completo do Administrador

---

### 👥 Gerenciar Usuários

Acesse **Admin → Usuários** no menu lateral para ver todos os usuários cadastrados.

**Status possíveis:**

| Status | Significado | Ação disponível |
|--------|-------------|----------------|
| ✅ Aprovado | Acesso total à plataforma | Revogar acesso |
| ⏳ Pendente | Aguardando aprovação manual | Aprovar |
| 🚫 Revogado | Acesso bloqueado | Reativar |

---

### 🔄 Fluxo de aprovação de novos usuários

\`\`\`
Usuário se cadastra
        ↓
   Via Google? ──→ SIM → Aprovado automaticamente ✅
        ↓ NÃO
 Fica "Pendente" ⏳
        ↓
  Admin recebe notificação
        ↓
  Admin aprova ou rejeita
        ↓
 Acesso liberado ✅ ou bloqueado 🚫
\`\`\`

---

### 🎯 Skills Globais vs. Skills Privadas

| Tipo | Quem cria | Quem vê | Quem pode editar |
|------|-----------|---------|-----------------|
| **Skill Global** | Admin | Todos os usuários | Apenas Admin |
| **Skill Privada** | Qualquer usuário | Apenas o criador | Apenas o criador |

> 💡 Use Skills Globais para padrões da instituição: formato de laudo, idioma, protocolos obrigatórios.

---

### 🔐 Segurança e Privacidade

**Isolamento de dados:**
- Cada usuário vê apenas suas próprias sessões de chat e documentos.
- Administradores têm visibilidade total de todos os dados da plataforma.
- Chaves de API são armazenadas criptografadas — nunca expostas.

**Controle de acesso:**
- Apenas admins podem criar/editar/excluir Skills globais.
- Apenas admins podem gerenciar integrações e chaves de API globais.
- Apenas admins podem acessar o painel de usuários.
- Apenas admins têm acesso à Documentação Técnica.

---

### 📊 Monitoramento de uso

No **Laboratório → Dashboard**, admins veem o consumo agregado de toda a plataforma:
- Tokens consumidos por usuário
- Custo estimado por período
- Modelos mais utilizados
- Sessões com maior consumo

---

### 🔍 Indexação RAG (Laboratório)

Como admin, você gerencia a indexação vetorial de toda a plataforma:

1. Vá para **Laboratório → Indexação Vetorial**.
2. Visualize o status de cada documento (indexado / pendente / erro).
3. Clique em **"Reindexar"** para documentos desatualizados.
4. Use **"Reindexar tudo"** após grandes updates.
`,

  dicas: `
## ⚡ Guia Completo — Dicas e Truques

---

### ⌨️ Atalhos de teclado

| Atalho | Ação |
|--------|------|
| \`Enter\` | Enviar mensagem |
| \`Shift + Enter\` | Nova linha sem enviar |
| \`Ctrl + C\` | Copiar texto selecionado |

---

### 🖱️ Ações ao passar o mouse nas mensagens

Ao passar o mouse sobre qualquer **mensagem da IA**, aparecem botões de ação:

- 📋 **Copiar** — copia o texto da mensagem
- 🖨️ **Imprimir/PDF** — abre janela de impressão formatada
- 👍 👎 **Feedback** — avalie a utilidade da resposta

---

### 🎯 Como obter respostas melhores

**Princípio 1: Seja específico**

| ❌ Pergunta vaga | ✅ Pergunta específica |
|-----------------|----------------------|
| "Me fale sobre diabetes" | "Paciente 52 anos, DM2, HbA1c 10.5%, em uso de metformina 1g/dia. Conduta para descompensação?" |
| "Qual o tratamento?" | "Protocolo para sepse abdominal em paciente pós-operatório de colecistectomia" |
| "Analise isso" | "Paciente 70 anos, hipertenso. Analise este hemograma e identifique Red Flags" |

---

### 📱 Usando no celular

- O layout se adapta automaticamente para telas pequenas.
- A barra lateral abre como menu deslizante (toque no ícone ☰).
- O Canvas abre em tela cheia no mobile.

---

### 🔄 Lidando com respostas imperfeitas

| Problema | O que fazer |
|----------|------------|
| Resposta truncada | *"Continue de onde parou"* |
| Resposta muito longa | *"Resuma em 3 pontos principais"* |
| Resposta genérica | Adicione mais contexto clínico à pergunta |
`,
};

// ─── Componentes ────────────────────────────────────────────────────────────

const Section = ({ icon: Icon, color, title, subtitle, detailsKey, onOpenDetails, children }) => {
  const [open, setOpen] = useState(false);
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color} shadow-inner`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
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
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
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
  const [searchQuery, setSearchQuery] = useState("");

  if (!user) return null;

  const openDetails = (title, content) => setModal({ title, content });
  const closeDetails = () => setModal(null);

  const sections = useMemo(() => {
    const s = [
      { id: 'chat', icon: MessageSquare, color: "bg-indigo-100 text-indigo-600", title: "Como usar o Chat", subtitle: "Converse com a IA e obtenha análises clínicas", detailsKey: "chat", tips: [
        { emoji: "💬", text: "Digite sua pergunta ou dúvida clínica na caixa de texto no rodapé da tela." },
        { emoji: "🤖", text: "A IA responde com base em conhecimento médico atualizado." },
        { emoji: "📋", text: "Você pode colar dados clínicos clicando no ícone de clipe." }
      ]},
      { id: 'sessions', icon: Pin, color: "bg-purple-100 text-purple-600", title: "Gerenciar suas Sessões", subtitle: "Organize, renomeie e compartilhe conversas", detailsKey: "sessions", tips: [
        { emoji: "📌", text: "Clique nos três pontinhos ao lado de uma sessão para gerenciar." },
        { emoji: "🔗", text: "Gere links públicos para leitura da conversa." }
      ]},
      { id: 'models', icon: Brain, color: "bg-blue-100 text-blue-600", title: "Escolher o Modelo de IA", subtitle: "Entenda o que é roteamento automático", detailsKey: "models", tips: [
        { emoji: "⚡", text: "O sistema escolhe automaticamente o modelo mais adequado." },
        { emoji: "🔒", text: "Você pode fixar um modelo específico se desejar." }
      ]},
      { id: 'canvas', icon: BookOpen, color: "bg-emerald-100 text-emerald-600", title: "Ferramenta Canvas", subtitle: "Crie e edite documentos a partir das respostas da IA", detailsKey: "canvas", tips: [
        { emoji: "🖊️", text: "O Canvas é um editor de documentos integrado para protocolos e laudos." },
        { emoji: "💾", text: "Exporte ou imprima o conteúdo do Canvas a qualquer momento." }
      ]},
      { id: 'biblioteca', icon: FolderSearch, color: "bg-teal-100 text-teal-600", title: "Biblioteca de Documentos", subtitle: "Guarde protocolos, laudos e pesquisas", detailsKey: "biblioteca", tips: [
        { emoji: "📁", text: "Organize seus documentos em pastas por especialidade." },
        { emoji: "🔍", text: "A IA consulta seus documentos automaticamente." }
      ]},
      { id: 'laboratorio', icon: Beaker, color: "bg-violet-100 text-violet-600", title: "Laboratório", subtitle: "Personalize o comportamento da IA", detailsKey: "laboratorio", tips: [
        { emoji: "🧪", text: "Configure Skills e instruções personalizadas para a IA." },
        { emoji: "📊", text: "Acompanhe seu consumo de tokens e custos." }
      ]},
      { id: 'integracoes', icon: Plug, color: "bg-amber-100 text-amber-600", title: "Integrações", subtitle: "Conecte outros serviços de IA", detailsKey: "integracoes", tips: [
        { emoji: "🔌", text: "Conecte chaves de API da OpenAI, Anthropic, Google Gemini e Groq." }
      ]},
      { id: 'dicas', icon: Zap, color: "bg-yellow-100 text-yellow-600", title: "Dicas Rápidas", subtitle: "Pequenos truques para aproveitar melhor", detailsKey: "dicas", tips: [
        { emoji: "🖱️", text: "Passe o mouse sobre as mensagens para ver opções rápidas." },
        { emoji: "💡", text: "Quanto mais contexto clínico você der, melhor a precisão da IA." }
      ]}
    ];

    if (user?.role === 'admin') {
      s.push({ id: 'admin', icon: Users, color: "bg-rose-100 text-rose-600", title: "Controles do Administrador", subtitle: "Gerencie usuários e configurações avançadas", detailsKey: "admin", tips: [
        { emoji: "👥", text: "Aprove ou revogue o acesso de usuários cadastrados." },
        { emoji: "🔧", text: "Crie Skills globais para toda a sua equipe." }
      ], admin: true });
    }
    return s;
  }, [user]);

  const filteredSections = useMemo(() => {
    return sections.filter(s => 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sections, searchQuery]);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Header with Background Image */}
      <div className="relative h-72 shrink-0 flex items-center justify-center overflow-hidden">
        <motion.img 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
          src="/hero-bg.png" 
          alt="Medical AI Background" 
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background/80 to-background" />
        
        <div className="relative z-10 text-center px-4 w-full max-w-2xl">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center justify-center gap-3 mb-6"
          >
            <div className="w-16 h-16 bg-white rounded-2xl shadow-2xl flex items-center justify-center animate-float">
              <Brain className="w-10 h-10 text-primary" />
            </div>
          </motion.div>
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-bold text-foreground mb-3 tracking-tight"
          >
            Como podemos ajudar?
          </motion.h1>
          
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="relative mt-6 group"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Pesquisar por ferramentas, guias ou configurações..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 pl-12 pr-4 bg-white/80 backdrop-blur-md border border-border rounded-2xl shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
            />
          </motion.div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-8">
        <div className="max-w-3xl mx-auto space-y-6 pb-20">

          {/* Intro card */}
          {!searchQuery && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-primary/5 border border-primary/20 rounded-2xl p-6 relative overflow-hidden group shadow-sm"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <HelpCircle className="w-24 h-24 text-primary" />
              </div>
              <p className="text-sm text-foreground leading-relaxed relative z-10">
                👋 <strong>Bem-vindo ao Chamsa ISA!</strong> Este é um assistente de inteligência artificial feito para ajudar profissionais de saúde. Aqui você encontra tudo que precisa saber para usar a plataforma com segurança e eficiência.
              </p>
            </motion.div>
          )}

          <div className="grid gap-4">
            <AnimatePresence mode="popLayout">
              {filteredSections.map((section) => (
                <Section 
                  key={section.id}
                  icon={section.icon} 
                  color={section.color} 
                  title={section.title} 
                  subtitle={section.subtitle} 
                  detailsKey={section.detailsKey} 
                  onOpenDetails={openDetails}
                >
                  {section.admin ? (
                    <AdminBlock>
                      {section.tips.map((tip, idx) => (
                        <Tip key={idx} emoji={tip.emoji} text={tip.text} />
                      ))}
                    </AdminBlock>
                  ) : (
                    section.tips.map((tip, idx) => (
                      <Tip key={idx} emoji={tip.emoji} text={tip.text} />
                    ))
                  )}
                </Section>
              ))}
            </AnimatePresence>
            
            {filteredSections.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Nenhum resultado encontrado</h3>
                <p className="text-sm text-muted-foreground">Tente usar palavras-chave diferentes.</p>
              </motion.div>
            )}
          </div>

          <footer className="text-center text-xs text-muted-foreground pb-12 pt-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Shield className="w-3 h-3 text-emerald-500" />
              <span>Plataforma Segura e Criptografada</span>
            </div>
            <p>Chamsa ISA · Central de Ajuda · v4.1</p>
          </footer>
        </div>
      </div>

      {/* Modal de detalhes */}
      <AnimatePresence>
        {modal && (
          <Dialog open={!!modal} onOpenChange={closeDetails}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{modal.title}</DialogTitle>
              </DialogHeader>
              <div className="dialog-body">
                <div className="chamsa-prose">
                  <ReactMarkdown>{modal.content}</ReactMarkdown>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}
