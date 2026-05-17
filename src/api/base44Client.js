// Mock local autônomo do @base44/sdk para o Chamsa ISA Plus
// Permite execução 100% offline, persistência no localStorage e chamadas diretas de IA

function getCurrentUserEmail() {
  if (typeof window === 'undefined') return 'default';
  const localUser = localStorage.getItem('authUser');
  if (localUser) {
    try {
      const parsed = JSON.parse(localUser);
      if (parsed.email) return parsed.email;
    } catch (_) {}
  }
  return 'default';
}

function createLocalStorageEntity(entityName, initialData = [], isGlobal = false) {
  const getStorageKey = () => {
    if (isGlobal) return `chamsa_entity_${entityName}`;
    return `chamsa_entity_${entityName}_${getCurrentUserEmail()}`;
  };

  const getItems = () => {
    if (typeof window === 'undefined') return initialData;
    const storageKey = getStorageKey();
    const curUser = getCurrentUserEmail();
    const isAdmin = curUser === 'dr.chamsa@hospital.gov' || curUser === 'clauorenstein@gmail.com';
    const init = (entityName === 'UserLLMConfig' && !isAdmin) ? [] : initialData;

    const existing = localStorage.getItem(storageKey);
    if (!existing) {
      localStorage.setItem(storageKey, JSON.stringify(init));
      return init;
    }
    try {
      const parsed = JSON.parse(existing);
      if (entityName === 'UserLLMConfig') {
        if (isAdmin) {
          if (!parsed.some(c => c.id === 'cfg_mixtral')) {
            const mixtralCfg = init.find(c => c.id === 'cfg_mixtral');
            if (mixtralCfg) {
              parsed.forEach(c => c.is_active = false);
              parsed.unshift(mixtralCfg);
              localStorage.setItem(storageKey, JSON.stringify(parsed));
            }
          }
        } else {
          const userOnly = parsed.filter(c => !c.id.startsWith('cfg_'));
          if (userOnly.length < parsed.length) {
            localStorage.setItem(storageKey, JSON.stringify(userOnly));
          }
          return userOnly;
        }
      }
      if (entityName === 'User') {
        const uniqueUsers = [];
        const seenIds = new Set();
        const seenEmails = new Set();
        for (const u of parsed) {
          if (!seenIds.has(u.id) && !seenEmails.has(u.email)) {
            seenIds.add(u.id);
            if (u.email) seenEmails.add(u.email);
            uniqueUsers.push(u);
          }
        }
        if (uniqueUsers.length < parsed.length) {
          localStorage.setItem(storageKey, JSON.stringify(uniqueUsers));
        }
        return uniqueUsers;
      }
      return parsed;
    } catch (_) {
      return init;
    }
  };

  const saveItems = (items) => {
    if (typeof window !== 'undefined') {
      const storageKey = getStorageKey();
      localStorage.setItem(storageKey, JSON.stringify(items));
    }
  };

  return {
    list: async (sortParam = '-created_date', limit = 100) => {
      const items = getItems();
      const isDesc = sortParam ? sortParam.startsWith('-') : false;
      const field = sortParam ? (isDesc ? sortParam.slice(1) : sortParam) : 'created_date';
      
      const sorted = [...items].sort((a, b) => {
        const valA = a[field] || '';
        const valB = b[field] || '';
        if (valA < valB) return isDesc ? 1 : -1;
        if (valA > valB) return isDesc ? -1 : 1;
        return 0;
      });

      return sorted.slice(0, limit);
    },
    filter: async (whereClause = {}, sortParam = '-created_date', limit = 100) => {
      const items = getItems();
      const filtered = items.filter(item => {
        return Object.entries(whereClause).every(([key, val]) => {
          if (val === undefined || val === null) return true;
          return item[key] === val;
        });
      });

      const isDesc = sortParam ? sortParam.startsWith('-') : false;
      const field = sortParam ? (isDesc ? sortParam.slice(1) : sortParam) : 'created_date';

      const sorted = [...filtered].sort((a, b) => {
        const valA = a[field] || '';
        const valB = b[field] || '';
        if (valA < valB) return isDesc ? 1 : -1;
        if (valA > valB) return isDesc ? -1 : 1;
        return 0;
      });

      return sorted.slice(0, limit);
    },
    create: async (data) => {
      const items = getItems();
      if (entityName === 'User') {
        const existingIndex = items.findIndex(item => (data.id && item.id === data.id) || (data.email && item.email === data.email));
        if (existingIndex !== -1) {
          const updatedItem = { ...items[existingIndex], ...data };
          items[existingIndex] = updatedItem;
          saveItems([...items]);
          return updatedItem;
        }
      }
      const newItem = {
        id: `${entityName.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        created_date: new Date().toISOString(),
        ...data
      };
      saveItems([newItem, ...items]);
      return newItem;
    },
    update: async (id, data) => {
      const items = getItems();
      let updatedItem = null;
      const newItems = items.map(item => {
        if (item.id === id) {
          updatedItem = { ...item, ...data };
          return updatedItem;
        }
        return item;
      });
      if (!updatedItem) throw new Error(`[${entityName}] Item não encontrado: ${id}`);
      saveItems(newItems);
      return updatedItem;
    },
    delete: async (id) => {
      const items = getItems();
      const newItems = items.filter(item => item.id !== id);
      saveItems(newItems);
      return { success: true };
    }
  };
}

// Dados de Seed Clínico Inicial
const SEED_USERS = [
  { id: 'usr_chamsa_123', email: 'dr.chamsa@hospital.gov', name: 'Dr. Chamsa', role: 'admin', is_approved: true, is_verified: true }
];

const SEED_CHATS = [
  {
    id: 'chat_demo_1',
    title: 'Caso Clínico — HAS e DM2 Descompensada',
    created_by: 'dr.chamsa@hospital.gov',
    created_date: new Date(Date.now() - 3600000).toISOString(),
    pinned: true,
    messages: [
      { role: 'user', content: 'Paciente masculino, 62 anos, hipertenso e diabético, chega com PA 180/110 e glicemia capilar de 320 mg/dL. Queixas de cefaleia e turvação visual.', timestamp: new Date(Date.now() - 3600000).toISOString() },
      { role: 'assistant', content: '### 🚨 Avaliação de Risco e Manejo Inicial\n\nDiante do quadro de crise hipertensiva (PA 180/110 mmHg) associada a sintomas neurológicos (cefaleia e turvação visual), é imperativo afastar **Emergência Hipertensiva** (lesão de órgão-alvo agudo, como encefalopatia hipertensiva ou retinopatia).\n\n#### 1. Conduta Imediata\n- **Acesso venoso e monitorização:** ECG de 12 derivações, oximetria e monitorização contínua da PA.\n- **Exames laboratoriais urgentes:** Glicemia venosa, eletrólitos (Na, K), função renal (ureia, creatinina), hemograma e EAS (pesquisa de proteinúria/hematúria).\n- **Manejo da Pressão Arterial:** Se confirmada emergência hipertensiva, considerar anti-hipertensivo parenteral (ex: Nitroprussiato ou Labetalol), com meta de redução de PA não superior a 20-25% na primeira hora.\n\n#### 2. Compensação Glicêmica\n- Hidratação venosa vigorosa com SF 0,9% (avaliando status volêmico e função cardíaca).\n- Insulinoterapia regular conforme protocolo institucional para descompensação aguda (afastar CAD ou EHH).', timestamp: new Date(Date.now() - 3500000).toISOString() }
    ]
  },
  {
    id: 'chat_demo_2',
    title: 'Revisão — Protocolo Sepse',
    created_by: 'dr.chamsa@hospital.gov',
    created_date: new Date(Date.now() - 7200000).toISOString(),
    pinned: false,
    messages: [
      { role: 'user', content: 'Quais são os feixes do pacote de 1 hora para sepse segundo o Surviving Sepsis Campaign?', timestamp: new Date(Date.now() - 7200000).toISOString() },
      { role: 'assistant', content: '### 🏥 Pacote de 1 Hora da Sepse (Surviving Sepsis Campaign)\n\nO manejo inicial da sepse e choque séptico exige ações rápidas agrupadas no **Pacote de 1 Hora** (*1-Hour Bundle*):\n\n1. **Mensurar o Lactato:** Medir o nível de lactato no sangue. Ressangrar se o lactato inicial for > 2 mmol/L.\n2. **Hemoculturas:** Obter amostras para hemocultura antes da administração da antibioticoterapia.\n3. **Antibióticos de Amplo Espectro:** Administrar antimicrobianos empíricos de amplo espectro.\n4. **Ressuscitação Volêmica:** Iniciar infusão rápida de cristaloides (30 mL/kg) para hipotensão ou lactato ≥ 4 mmol/L.\n5. **Vasopressores:** Aplicar vasopressores (Noradrenalina como primeira escolha) se o paciente mantiver hipotensão durante ou após a ressuscitação volêmica, com meta de PAM ≥ 65 mmHg.', timestamp: new Date(Date.now() - 7100000).toISOString() }
    ]
  }
];

const SEED_SKILLS = [
  { id: 'skill_1', title: 'Formato SOAP Obrigatório', prompt_template: 'Estruture todas as notas clínicas utilizando o método SOAP (Subjetivo, Objetivo, Avaliação e Plano), utilizando marcadores claros e destacando Red Flags.', is_active: true, created_date: new Date().toISOString() },
  { id: 'skill_2', title: 'Dedução de CID-10', prompt_template: 'Ao final de cada diagnóstico ou hipótese diagnóstica, inclua os códigos CID-10 mais prováveis entre parênteses.', is_active: true, created_date: new Date().toISOString() },
  { id: 'skill_3', title: 'Assistente Virtual Atencioso', prompt_template: 'Você é um assistente virtual atencioso. Analise a mensagem do usuário a a seguir e forneça uma resposta útil, precisa e relevante baseada no conteúdo recebido. Mensagem do usuário: {MENSAGEM_AQUI}', is_active: true, created_date: new Date().toISOString() },
  { id: 'skill_4', title: 'Assistente Inteligente (Mistral AI)', prompt_template: 'Você é um assistente inteligente que utiliza o modelo Mistral para gerar respostas. Seu objetivo é ajudar o usuário através de um chat, fornecendo respostas claras, relevantes e precisas com base no que é solicitado. Ajuste seu tom e o nível de detalhe conforme a necessidade da conversa.', is_active: true, created_date: new Date().toISOString() },
  { id: 'skill_5', title: 'Especialista Mistral AI (Texto Puro)', prompt_template: 'Você é um assistente de IA especializado em modelos da Mistral AI. Sua missão é processar informações usando apenas texto puro e estruturas lógicas, ignorando completamente qualquer conteúdo codificado em base64. Responda sempre de forma clara, precisa e direta, utilizando as capacidades nativas do modelo Mistral para resolver problemas ou fornecer informações.', is_active: true, created_date: new Date().toISOString() },
  { id: 'skill_6', title: 'Reflexão e Engajamento Ativo', prompt_template: 'Você é um assistente que está sendo repetitivo e dando respostas genéricas, independentemente do que o usuário pergunta. Sua missão agora é analisar o histórico de conversas, identificar o padrão de respostas sem valor agregado e propor uma mudança na sua forma de interagir, tornando-a mais personalizada, útil e engajadora. Ative o uso de IA para gerar respostas realmente diferentes e relevantes.', is_active: true, created_date: new Date().toISOString() }
];

const SEED_KNOWLEDGE = [
  { id: 'kn_1', title: 'Protocolo de Dor Torácica', category: 'protocolo', content: 'Manejo inicial de SCA: AAS 300mg, Clopidogrel 300mg, ECG em até 10 minutos.', created_by: 'dr.chamsa@hospital.gov', created_date: new Date().toISOString() },
  { id: 'kn_2', title: 'Artigo — Novos Anticoagulantes na FA', category: 'pesquisa', content: 'Estudos demonstram não inferioridade dos DOACs em relação à Varfarina com menor sangramento intracraniano.', created_by: 'dr.chamsa@hospital.gov', created_date: new Date().toISOString() }
];

const SEED_FOLDERS = [
  { id: 'folder_1', name: '🫀 Cardiologia', created_by: 'dr.chamsa@hospital.gov', created_date: new Date().toISOString() },
  { id: 'folder_2', name: '🧪 Exames Laboratoriais', created_by: 'dr.chamsa@hospital.gov', created_date: new Date().toISOString() }
];

const SEED_INTEGRATIONS = [
  { id: 'int_groq', label: 'Groq Llama 3', baseUrl: 'https://api.groq.com/openai/v1', endpoint: '/chat/completions', method: 'POST', secretName: 'LLM_KEY_GROQ', color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
  { id: 'int_mistral', label: 'Mistral AI', baseUrl: 'https://api.mistral.ai/v1', endpoint: '/chat/completions', method: 'POST', secretName: 'LLM_KEY_MISTRAL', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' }
];

const SEED_USER_LLM_CONFIG = [
  { id: 'cfg_mixtral', provider: 'mistral', model_id: 'open-mixtral-8x22b', model_label: 'Open Mixtral', api_key_encrypted: 'n5XSGigY••••••••', max_tokens: 2048, temperature: 0.3, is_active: true, created_date: new Date().toISOString() },
  { id: 'cfg_mistral', provider: 'mistral', model_id: 'codestral-latest', model_label: 'Codestral', api_key_encrypted: 'g28xd8Iw••••••••', max_tokens: 2048, temperature: 0.3, is_active: false, created_date: new Date().toISOString() },
  { id: 'cfg_1', provider: 'groq', model_id: 'llama-3.3-70b-versatile', model_label: 'Balanced', is_active: false, created_date: new Date().toISOString() }
];

// Instanciação das Entidades
const entities = {
  User: createLocalStorageEntity('User', SEED_USERS, true), // Global para que o Admin veja todos os usuários cadastrados
  ChatSession: createLocalStorageEntity('ChatSession', SEED_CHATS, false), // Isolado por usuário
  CustomSkill: createLocalStorageEntity('CustomSkill', SEED_SKILLS, false), // Isolado por usuário
  Knowledge: createLocalStorageEntity('Knowledge', SEED_KNOWLEDGE, false), // Isolado por usuário
  KnowledgeFolder: createLocalStorageEntity('KnowledgeFolder', SEED_FOLDERS, false), // Isolado por usuário
  KnowledgeVector: createLocalStorageEntity('KnowledgeVector', [], false), // Isolado por usuário
  CustomIntegration: createLocalStorageEntity('CustomIntegration', SEED_INTEGRATIONS, false), // Isolado por usuário
  LLMUsageLog: createLocalStorageEntity('LLMUsageLog', [], false), // Isolado por usuário
  UserLLMConfig: createLocalStorageEntity('UserLLMConfig', SEED_USER_LLM_CONFIG, false), // Isolado por usuário (chaves individuais)
  CustomPlatform: createLocalStorageEntity('CustomPlatform', [], true) // Global para plataformas base
};

export const base44 = {
  auth: {
    me: async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const res = await fetch('http://localhost:3000/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            const email = data.dadosUsuario?.email || 'usuario@chamsa.gov';
            const role = (email === 'clauorenstein@gmail.com' || email === 'dr.chamsa@hospital.gov') ? 'admin' : 'user';
            const uObj = {
              id: data.dadosUsuario?.id ? `usr_${data.dadosUsuario.id}` : 'usr_1',
              email,
              name: data.dadosUsuario?.nome || email,
              role,
              is_approved: true,
              is_verified: true,
              created_date: new Date().toISOString(),
              last_login_date: new Date().toISOString()
            };
            await entities.User.create(uObj);
            return uObj;
          }
        } catch (e) {
          console.warn('[base44Client] Backend de autenticação indisponível. Usando fallback local.');
        }
      }

      // Fallback local: se tiver authUser salvo no localStorage pelo login/cadastro local
      const localUser = localStorage.getItem('authUser');
      if (localUser) {
        try {
          const parsed = JSON.parse(localUser);
          const email = parsed.email || 'usuario@chamsa.gov';
          const role = (email === 'clauorenstein@gmail.com' || email === 'dr.chamsa@hospital.gov') ? 'admin' : 'user';
          const uObj = {
            id: parsed.id || 'usr_local',
            email,
            name: parsed.nome || email,
            role,
            is_approved: true,
            is_verified: true,
            created_date: new Date().toISOString(),
            last_login_date: new Date().toISOString()
          };
          await entities.User.create(uObj);
          return uObj;
        } catch (_) {}
      }

      // Se não tiver token nem usuário local, não está autenticado
      throw new Error('401 Unauthorized');
    },
    redirectToLogin: () => {
      console.log('[base44Client] redirectToLogin acionado.');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    },
    logout: () => {
      console.log('[base44Client] logout acionado.');
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      sessionStorage.removeItem('initial_chat_created');
      window.location.href = '/login';
    }
  },
  integrations: {
    Core: {
      UploadFile: async ({ file }) => {
        const file_url = URL.createObjectURL(file);
        return { file_url };
      }
    }
  },
  entities,
  functions: {
    invoke: async (functionName, args = {}) => {
      console.log(`[base44Client] function invoke: ${functionName}`, args);

      if (functionName === 'listSecrets') {
        const getConf = (p) => {
          const sanitizeKey = (k) => k ? k.replace(/[^\x20-\x7E]/g, '').trim() : '';
          const pUpper = p.toUpperCase();
          if (sanitizeKey(localStorage.getItem(`ADMIN_${pUpper}_API_KEY`))) return true;
          if (sanitizeKey(localStorage.getItem(`${pUpper}_API_KEY`)) || sanitizeKey(localStorage.getItem(`LLM_KEY_${pUpper}`))) return true;
          const adminEmails = ['dr.chamsa@hospital.gov', 'clauorenstein@gmail.com'];
          for (const email of adminEmails) {
            try {
              const raw = localStorage.getItem(`chamsa_entity_UserLLMConfig_${email}`);
              if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed.some(c => c.provider === p && c.api_key_encrypted && c.api_key_encrypted.trim().length > 0)) return true;
              }
            } catch (_) {}
          }
          return false;
        };

        const secrets = [];
        if (getConf('groq')) secrets.push({ name: 'GROQ_API_KEY', configured: true });
        if (getConf('openai')) secrets.push({ name: 'OPENAI_API_KEY', configured: true });
        if (getConf('mistral')) secrets.push({ name: 'MISTRAL_API_KEY', configured: true });
        if (getConf('google') || getConf('gemini')) secrets.push({ name: 'GOOGLE_API_KEY', configured: true });
        if (getConf('anthropic')) secrets.push({ name: 'ANTHROPIC_API_KEY', configured: true });
        if (getConf('deepseek')) secrets.push({ name: 'DEEPSEEK_API_KEY', configured: true });
        if (getConf('xai')) secrets.push({ name: 'XAI_API_KEY', configured: true });
        if (getConf('perplexity')) secrets.push({ name: 'PERPLEXITY_API_KEY', configured: true });
        if (getConf('cohere')) secrets.push({ name: 'COHERE_API_KEY', configured: true });
        return { data: { secrets } };
      }

      if (functionName === 'saveApiKey') {
        const { secretName, apiKey, provider } = args;
        const curUser = getCurrentUserEmail();
        const isAdmin = curUser === 'dr.chamsa@hospital.gov' || curUser === 'clauorenstein@gmail.com';
        if (isAdmin) {
          localStorage.setItem(secretName, apiKey);
          if (provider) {
            localStorage.setItem(`ADMIN_${provider.toUpperCase()}_API_KEY`, apiKey);
            localStorage.setItem(`LLM_KEY_${provider.toUpperCase()}`, apiKey);
          }
        } else {
          if (provider) {
            localStorage.setItem(`USER_${provider.toUpperCase()}_API_KEY_${curUser}`, apiKey);
          }
        }
        return { data: { success: true } };
      }

      if (functionName === 'saveCustomIntegration') {
        const intEntity = entities.CustomIntegration;
        const created = await intEntity.create(args);
        return { data: { success: true, integration: created } };
      }

      if (functionName === 'fetchProviderModels') {
        const { providerId, baseUrl, apiKey } = args;
        try {
          const url = `${baseUrl.replace(/\/$/, '')}/models`;
          const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${apiKey}` }
          });
          if (res.ok) {
            const json = await res.json();
            const models = json.data?.map(m => m.id) || [];
            if (models.length > 0) return { data: { models } };
          }
        } catch (_) {}
        
        if (providerId === 'openai') return { data: { models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'] } };
        if (providerId === 'groq') return { data: { models: ['llama-3.3-70b-versatile', 'llama3-8b-8192', 'mixtral-8x7b-32768'] } };
        if (providerId === 'mistral') return { data: { models: ['mistral-large-latest', 'mistral-small-latest', 'codestral-latest'] } };
        if (providerId === 'anthropic') return { data: { models: ['claude-3-5-sonnet-latest', 'claude-3-haiku-20240307'] } };
        if (providerId === 'google') return { data: { models: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash'] } };
        return { data: { models: ['modelo-padrão-1', 'modelo-padrão-2'] } };
      }

      if (functionName === 'processUploadedDocument') {
        return { data: { success: true, folder_id: `upload_${Date.now()}` } };
      }

      if (functionName === 'semanticSearch') {
        return {
          data: {
            chunks: [
              { source_name: 'Protocolo Clínico Institucional', score: 0.88, chunk_text: 'Diretrizes de atendimento: Monitorização contínua de sinais vitais, acesso venoso calibroso e avaliação laboratorial completa.' },
              { source_name: 'Guia Farmacológico', score: 0.75, chunk_text: 'Ajuste posológico em disfunção renal: Avaliar clearence de creatinina antes da prescrição de antimicrobianos e antitrombóticos.' }
            ]
          }
        };
      }

      if (functionName === 'logLLMUsage') {
        const usageEntity = entities.LLMUsageLog;
        await usageEntity.create(args);
        return { data: { success: true } };
      }

      if (functionName === 'approveUser' || functionName === 'selfApprove') {
        return { data: { success: true } };
      }

      if (functionName === 'saveChatToDrive') {
        return { data: { success: true, file_id: `drive_${Date.now()}` } };
      }

      if (functionName === 'vectorizeKnowledge') {
        return { data: { success: true } };
      }

      if (functionName === 'testApiIntegration') {
        return { data: { success: true, message: 'Conexão validada com sucesso no modo autônomo!' } };
      }

      if (functionName === 'invokeCustomLLM') {
        return { data: { content: `[Resposta Custom LLM] Análise processada com sucesso para o prompt fornecido.` } };
      }

      if (functionName === 'invokeLLMUnified') {
        const { messages, model } = args;
        const lastMsg = messages[messages.length - 1]?.content || '';
        const systemMsg = messages.find(m => m.role === 'system')?.content || '';
        const isCanvasMode = systemMsg.includes('MODO CANVAS ATIVO');

        const allUserConfigs = await entities.UserLLMConfig.list('-created_date', 50);
        const validUserConfigs = allUserConfigs.filter(c => c.api_key_encrypted && c.api_key_encrypted.trim().length > 0 && !c.api_key_encrypted.includes('••••'));
        const activeCfg = validUserConfigs.find(c => c.is_active) || validUserConfigs[0];

        let provider = 'mock';
        let apiKey = null;
        let apiUrl = null;
        let apiModel = model;

        const sanitizeKey = (k) => k ? k.replace(/[^\x20-\x7E]/g, '').trim() : '';
        
        function getAdminFallbackKey(prov) {
          const pUpper = prov.toUpperCase();
          let key = sanitizeKey(localStorage.getItem(`ADMIN_${pUpper}_API_KEY`));
          if (key && !key.includes('••••')) return key;
          key = sanitizeKey(localStorage.getItem(`${pUpper}_API_KEY`)) || sanitizeKey(localStorage.getItem(`LLM_KEY_${pUpper}`));
          if (key && !key.includes('••••')) return key;
          const adminEmails = ['dr.chamsa@hospital.gov', 'clauorenstein@gmail.com'];
          for (const email of adminEmails) {
            try {
              const raw = localStorage.getItem(`chamsa_entity_UserLLMConfig_${email}`);
              if (raw) {
                const parsed = JSON.parse(raw);
                const match = parsed.find(c => c.provider === prov && c.api_key_encrypted && c.api_key_encrypted.trim().length > 0 && !c.api_key_encrypted.includes('••••'));
                if (match) return sanitizeKey(match.api_key_encrypted);
              }
            } catch (_) {}
          }
          return null;
        }

        let groqKey = getAdminFallbackKey('groq');
        let mistralKey = getAdminFallbackKey('mistral');
        let openaiKey = getAdminFallbackKey('openai');
        let geminiKey = getAdminFallbackKey('google') || getAdminFallbackKey('gemini');
        let anthropicKey = getAdminFallbackKey('anthropic');
        let deepseekKey = getAdminFallbackKey('deepseek');
        let xaiKey = getAdminFallbackKey('xai');
        let perplexityKey = getAdminFallbackKey('perplexity');
        let cohereKey = getAdminFallbackKey('cohere');

        if (activeCfg && activeCfg.api_key_encrypted) {
          provider = activeCfg.provider;
          apiKey = sanitizeKey(activeCfg.api_key_encrypted);
          apiModel = activeCfg.model_id || model;
          if (provider === 'openai') apiUrl = activeCfg.base_url || 'https://api.openai.com/v1/chat/completions';
          else if (provider === 'mistral') apiUrl = activeCfg.base_url || 'https://api.mistral.ai/v1/chat/completions';
          else if (provider === 'groq') apiUrl = activeCfg.base_url || 'https://api.groq.com/openai/v1/chat/completions';
          else if (provider === 'anthropic') apiUrl = activeCfg.base_url || 'https://api.anthropic.com/v1/messages';
          else if (provider === 'google') apiUrl = activeCfg.base_url || `https://generativelanguage.googleapis.com/v1beta/models/${apiModel}:generateContent?key=${apiKey}`;
          else if (provider === 'deepseek') apiUrl = activeCfg.base_url || 'https://api.deepseek.com/v1/chat/completions';
          else if (provider === 'xai') apiUrl = activeCfg.base_url || 'https://api.x.ai/v1/chat/completions';
          else if (provider === 'perplexity') apiUrl = activeCfg.base_url || 'https://api.perplexity.ai/chat/completions';
          else if (provider === 'ollama') apiUrl = activeCfg.base_url || 'http://localhost:11434/v1/chat/completions';
        } else if (model.includes('llama') || model.includes('mixtral') || model.includes('gemma')) {
          apiKey = groqKey || mistralKey || openaiKey || geminiKey;
          if (apiKey === groqKey && groqKey) { provider = 'groq'; apiUrl = 'https://api.groq.com/openai/v1/chat/completions'; }
          else if (apiKey === mistralKey && mistralKey) { provider = 'mistral'; apiUrl = 'https://api.mistral.ai/v1/chat/completions'; apiModel = 'mistral-large-latest'; }
          else if (apiKey === openaiKey && openaiKey) { provider = 'openai'; apiUrl = 'https://api.openai.com/v1/chat/completions'; apiModel = 'gpt-4o'; }
          else if (apiKey === geminiKey && geminiKey) { provider = 'google'; apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${geminiKey}`; }
        } else if (model.includes('mistral') || model.includes('codestral')) {
          apiKey = mistralKey || groqKey || openaiKey || geminiKey;
          if (apiKey === mistralKey && mistralKey) { provider = 'mistral'; apiUrl = 'https://api.mistral.ai/v1/chat/completions'; }
          else if (apiKey === groqKey && groqKey) { provider = 'groq'; apiUrl = 'https://api.groq.com/openai/v1/chat/completions'; apiModel = 'llama-3.3-70b-versatile'; }
          else if (apiKey === openaiKey && openaiKey) { provider = 'openai'; apiUrl = 'https://api.openai.com/v1/chat/completions'; apiModel = 'gpt-4o'; }
          else if (apiKey === geminiKey && geminiKey) { provider = 'google'; apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${geminiKey}`; }
        } else if (model.includes('gpt') || model.includes('o1') || model.includes('o3') || model.includes('mini')) {
          apiKey = openaiKey || mistralKey || groqKey || geminiKey;
          if (apiKey === openaiKey && openaiKey) { provider = 'openai'; apiUrl = 'https://api.openai.com/v1/chat/completions'; apiModel = model === 'gpt_5_mini' ? 'gpt-4o-mini' : model; }
          else if (apiKey === mistralKey && mistralKey) { provider = 'mistral'; apiUrl = 'https://api.mistral.ai/v1/chat/completions'; apiModel = 'mistral-small-latest'; }
          else if (apiKey === groqKey && groqKey) { provider = 'groq'; apiUrl = 'https://api.groq.com/openai/v1/chat/completions'; apiModel = 'llama-3.3-70b-versatile'; }
          else if (apiKey === geminiKey && geminiKey) { provider = 'google'; apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`; }
        } else if (model.includes('claude')) {
          apiKey = anthropicKey || mistralKey || groqKey || openaiKey || geminiKey;
          if (apiKey === anthropicKey && anthropicKey) { provider = 'anthropic'; apiUrl = 'https://api.anthropic.com/v1/messages'; apiModel = model === 'claude_sonnet_4_6' ? 'claude-3-5-sonnet-latest' : model; }
          else if (apiKey === mistralKey && mistralKey) { provider = 'mistral'; apiUrl = 'https://api.mistral.ai/v1/chat/completions'; apiModel = 'mistral-large-latest'; }
          else if (apiKey === groqKey && groqKey) { provider = 'groq'; apiUrl = 'https://api.groq.com/openai/v1/chat/completions'; apiModel = 'llama-3.3-70b-versatile'; }
          else if (apiKey === openaiKey && openaiKey) { provider = 'openai'; apiUrl = 'https://api.openai.com/v1/chat/completions'; apiModel = 'gpt-4o'; }
          else if (apiKey === geminiKey && geminiKey) { provider = 'google'; apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${geminiKey}`; }
        } else if (model.includes('deepseek')) {
          apiKey = deepseekKey || groqKey || openaiKey || mistralKey;
          if (apiKey === deepseekKey && deepseekKey) { provider = 'deepseek'; apiUrl = 'https://api.deepseek.com/v1/chat/completions'; }
          else if (apiKey === groqKey && groqKey) { provider = 'groq'; apiUrl = 'https://api.groq.com/openai/v1/chat/completions'; apiModel = 'deepseek-r1-distill-llama-70b'; }
          else if (apiKey === openaiKey && openaiKey) { provider = 'openai'; apiUrl = 'https://api.openai.com/v1/chat/completions'; apiModel = 'gpt-4o'; }
        } else if (model.includes('grok') || model.includes('xai')) {
          apiKey = xaiKey || openaiKey || groqKey;
          if (apiKey === xaiKey && xaiKey) { provider = 'xai'; apiUrl = 'https://api.x.ai/v1/chat/completions'; }
          else if (apiKey === openaiKey && openaiKey) { provider = 'openai'; apiUrl = 'https://api.openai.com/v1/chat/completions'; apiModel = 'gpt-4o'; }
        } else if (model.includes('sonar') || model.includes('perplexity')) {
          apiKey = perplexityKey || openaiKey || groqKey;
          if (apiKey === perplexityKey && perplexityKey) { provider = 'perplexity'; apiUrl = 'https://api.perplexity.ai/chat/completions'; }
          else if (apiKey === openaiKey && openaiKey) { provider = 'openai'; apiUrl = 'https://api.openai.com/v1/chat/completions'; apiModel = 'gpt-4o'; }
        } else if (model.includes('command') || model.includes('cohere')) {
          apiKey = cohereKey || openaiKey || groqKey;
          if (apiKey === cohereKey && cohereKey) { provider = 'cohere'; }
          else if (apiKey === openaiKey && openaiKey) { provider = 'openai'; apiUrl = 'https://api.openai.com/v1/chat/completions'; apiModel = 'gpt-4o'; }
        } else if (model === 'ollama' || model.includes('localhost')) {
          provider = 'ollama'; apiUrl = 'http://localhost:11434/v1/chat/completions';
        }

        if (!apiKey && provider !== 'ollama') {
          apiKey = openaiKey || groqKey || mistralKey || geminiKey || anthropicKey || deepseekKey || xaiKey || perplexityKey || cohereKey;
          if (apiKey === openaiKey && openaiKey) { provider = 'openai'; apiUrl = 'https://api.openai.com/v1/chat/completions'; apiModel = 'gpt-4o-mini'; }
          else if (apiKey === groqKey && groqKey) { provider = 'groq'; apiUrl = 'https://api.groq.com/openai/v1/chat/completions'; apiModel = 'llama-3.3-70b-versatile'; }
          else if (apiKey === mistralKey && mistralKey) { provider = 'mistral'; apiUrl = 'https://api.mistral.ai/v1/chat/completions'; apiModel = 'mistral-small-latest'; }
          else if (apiKey === geminiKey && geminiKey) { provider = 'google'; apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`; }
          else if (apiKey === anthropicKey && anthropicKey) { provider = 'anthropic'; apiUrl = 'https://api.anthropic.com/v1/messages'; apiModel = 'claude-3-5-sonnet-latest'; }
          else if (apiKey === deepseekKey && deepseekKey) { provider = 'deepseek'; apiUrl = 'https://api.deepseek.com/v1/chat/completions'; apiModel = 'deepseek-chat'; }
          else if (apiKey === xaiKey && xaiKey) { provider = 'xai'; apiUrl = 'https://api.x.ai/v1/chat/completions'; apiModel = 'grok-2-1212'; }
          else if (apiKey === perplexityKey && perplexityKey) { provider = 'perplexity'; apiUrl = 'https://api.perplexity.ai/chat/completions'; apiModel = 'sonar'; }
          else if (apiKey === cohereKey && cohereKey) { provider = 'cohere'; apiModel = 'command-r-08-2024'; }
        }

        if (apiUrl && (apiKey || provider === 'ollama')) {
          try {
            let res;
            if (provider === 'google') {
              const geminiContents = messages.filter(m => m.role !== 'system').map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }]
              }));
              res = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: geminiContents,
                  systemInstruction: { parts: [{ text: systemMsg }] },
                  generationConfig: { maxOutputTokens: 4096 }
                })
              });
              if (res.ok) {
                const data = await res.json();
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                if (text) {
                  let parsedCanvas = null;
                  if (isCanvasMode) {
                    const match = text.match(/<CANVAS[^>]*title="([^"]+)"[^>]*>([\s\S]*?)<\/CANVAS>/i);
                    if (match) parsedCanvas = { title: match[1], content: match[2].trim() };
                    else parsedCanvas = { title: 'Análise Clínica', content: text };
                  }
                  return { data: { content: text, canvas: parsedCanvas, searchPrompt: null, pubmedResults: null, usage: { prompt_tokens: 120, completion_tokens: 350 }, provider, model } };
                }
              } else {
                const errJson = await res.json().catch(() => ({}));
                throw new Error(`Google Gemini API Error (${res.status}): ${errJson.error?.message || res.statusText}`);
              }
            } else if (provider === 'anthropic') {
              const anthropicMessages = messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content }));
              res = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json', 'anthropic-dangerous-direct-browser-access': 'true' },
                body: JSON.stringify({ model: apiModel === 'claude_sonnet_4_6' ? 'claude-3-5-sonnet-latest' : apiModel, system: systemMsg, messages: anthropicMessages, max_tokens: 4096 })
              });
              if (res.ok) {
                const data = await res.json();
                const text = data.content?.[0]?.text || '';
                if (text) {
                  let parsedCanvas = null;
                  if (isCanvasMode) {
                    const match = text.match(/<CANVAS[^>]*title="([^"]+)"[^>]*>([\s\S]*?)<\/CANVAS>/i);
                    if (match) parsedCanvas = { title: match[1], content: match[2].trim() };
                    else parsedCanvas = { title: 'Análise Clínica', content: text };
                  }
                  return { data: { content: text, canvas: parsedCanvas, searchPrompt: null, pubmedResults: null, usage: { prompt_tokens: data.usage?.input_tokens || 150, completion_tokens: data.usage?.output_tokens || 400 }, provider, model } };
                }
              } else {
                const errJson = await res.json().catch(() => ({}));
                throw new Error(`Anthropic API Error (${res.status}): ${errJson.error?.message || res.statusText}`);
              }
            } else {
              const oaiMessages = messages.map(m => ({ role: m.role, content: m.content }));
              const headers = { 'Content-Type': 'application/json' };
              if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

              res = await fetch(apiUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify({ model: apiModel, messages: oaiMessages, max_tokens: 4096 })
              });
              if (res.ok) {
                const data = await res.json();
                const text = data.choices?.[0]?.message?.content || '';
                if (text) {
                  let parsedCanvas = null;
                  if (isCanvasMode) {
                    const match = text.match(/<CANVAS[^>]*title="([^"]+)"[^>]*>([\s\S]*?)<\/CANVAS>/i);
                    if (match) parsedCanvas = { title: match[1], content: match[2].trim() };
                    else parsedCanvas = { title: 'Análise Clínica', content: text };
                  }
                  return { data: { content: text, canvas: parsedCanvas, searchPrompt: null, pubmedResults: null, usage: data.usage || { prompt_tokens: 150, completion_tokens: 380 }, provider, model } };
                }
              } else {
                const errJson = await res.json().catch(() => ({}));
                const errMsg = errJson.error?.message || errJson.message || res.statusText;
                throw new Error(`API Error (${provider.toUpperCase()} - HTTP ${res.status}): ${errMsg}`);
              }
            }
          } catch (err) {
            console.warn(`[base44Client] Falha na chamada direta da API (${provider}). Erro:`, err);
            const isAuthError = err.message.includes('401') || err.message.includes('Unauthorized') || err.message.includes('invalid_api_key');
            const isQuotaError = err.message.includes('429') || err.message.includes('Too Many Requests') || err.message.includes('quota');
            const isCors = err.message.includes('Failed to fetch') || err.message.includes('NetworkError');

            let userFriendlyError = `### ❌ Falha na Conexão com ${provider.toUpperCase()}\n\nNão foi possível processar a resposta utilizando a API oficial do provedor selecionado.\n\n#### 🔍 Detalhes do Erro:\n\`\`\`text\n${err.message}\n\`\`\`\n\n`;

            if (isAuthError) {
              userFriendlyError += `#### 💡 Causa Provável:\n**Chave de API Inválida ou Expirada.** A chave configurada no sistema não foi aceita pelo servidor da ${provider.toUpperCase()}.\n\n#### 🛠️ Como Corrigir:\n1. Acesse o menu **Laboratório → Minha API** na barra lateral.\n2. Localize a configuração do **${provider.toUpperCase()}**.\n3. Clique no ícone de lápis para editar e insira uma chave válida e completa, sem caracteres de máscara ou espaços.`;
            } else if (isQuotaError) {
              userFriendlyError += `#### 💡 Causa Provável:\n**Cota Excedida / Limite de Taxa (Rate Limit).** Você atingiu o limite de requisições gratuitas ou o saldo da sua conta na ${provider.toUpperCase()} acabou.\n\n#### 🛠️ Como Corrigir:\nVerifique o painel de faturamento e uso no site oficial da ${provider.toUpperCase()} para liberar mais saldo ou aguarde a virada do minuto/hora.`;
            } else if (isCors) {
              userFriendlyError += `#### 💡 Causa Provável:\n**Bloqueio de CORS ou Falha de Rede.** O navegador bloqueou a conexão direta com a API da ${provider.toUpperCase()} por políticas de segurança (CORS) ou você está sem internet.\n\n#### 🛠️ Como Corrigir:\nVerifique sua conexão de internet ou utilize uma extensão de desbloqueio de CORS no navegador para ambiente de desenvolvimento local.`;
            } else {
              userFriendlyError += `#### 🛠️ Como Corrigir:\nVerifique os parâmetros da requisição ou tente selecionar outro modelo/provedor na barra superior.`;
            }

            const fullErrorContent = isCanvasMode
              ? `<CANVAS title="Erro de Conexão — ${provider.toUpperCase()}">\n${userFriendlyError}\n</CANVAS>`
              : userFriendlyError;

            const parsedCanvas = isCanvasMode ? { title: `Erro de Conexão — ${provider.toUpperCase()}`, content: userFriendlyError } : null;

            return {
              data: {
                content: fullErrorContent,
                canvas: parsedCanvas,
                searchPrompt: null,
                pubmedResults: null,
                usage: { prompt_tokens: 0, completion_tokens: 0 },
                provider: `${provider}-error`,
                model: apiModel
              }
            };
          }
        }

        console.log('[base44Client] Gerando resposta mock local avançada para o prompt:', lastMsg);
        let mockTitle = 'Análise Clínica Especializada';
        let mockBody = '';

        const lower = lastMsg.toLowerCase();

        if (lower.includes('sepse') || lower.includes('choque')) {
          mockTitle = 'Protocolo de Sepse e Choque Séptico';
          mockBody = `### 🚨 Protocolo de Sepse — Pacote de 1 Hora\n\nIdentificada suspeita de sepse, as seguintes medidas devem ser instituídas imediatamente:\n\n1. **Lactato:** Mensurar lactato sérico (ressangrar se > 2 mmol/L).\n2. **Culturas:** Colher hemoculturas antes do início da antibioticoterapia.\n3. **Antimicrobianos:** Administrar antibiótico de amplo espectro na primeira hora.\n4. **Ressuscitação Volêmica:** Infundir 30 mL/kg de cristaloides em caso de hipotensão ou lactato ≥ 4 mmol/L.\n5. **Vasopressores:** Iniciar Noradrenalina para manter PAM ≥ 65 mmHg se refratário à prova de volume.\n\n*(CID-10: A41.9 Sepse não especificada)*`;
        } else if (lower.includes('has') || lower.includes('pressão') || lower.includes('hipertens')) {
          mockTitle = 'Manejo da Crise Hipertensiva';
          mockBody = `### 📊 Manejo de Crise Hipertensiva\n\nDiante da elevação pressórica aguda, a diferenciação entre Urgência e Emergência Hipertensiva dita a conduta:\n\n#### 1. Avaliação de Lesão de Órgão-Alvo\n- Afastar encefalopatia, dissecção de aorta, EAP ou IAM.\n- Exames: ECG, Troponina, Radiografia de Tórax, Creatinina e EAS.\n\n#### 2. Terapia Medicamentosa\n- **Urgência:** Redução gradual em 24-48h com medicação via oral (ex: Captopril ou Clonidina).\n- **Emergência:** Internação em UTI e redução imediata de 20-25% da PA na primeira hora com anti-hipertensivo parenteral (Nitroprussiato de Sódio).\n\n*(CID-10: I10 Hipertensão essencial)*`;
        } else if (lower.includes('diabetes') || lower.includes('glicemi') || lower.includes('insulina') || lower.includes('dm2')) {
          mockTitle = 'Manejo Glicêmico e Diabetes';
          mockBody = `### 🩸 Avaliação de Descompensação Glicêmica\n\nDiante do quadro metabólico apresentado, é fundamental avaliar sinais de cetoacidose diabética (CAD) ou estado hiperosmolar hiperglicêmico (EHH).\n\n#### 1. Conduta Imediata\n- Mensurar glicemia capilar, cetonemia/cetonúria e gasometria arterial.\n- Avaliar hidratação venosa com SF 0,9% conforme o estado volêmico.\n\n#### 2. Insulinoterapia\n- Iniciar protocolo de insulina regular conforme os níveis glicêmicos e monitorar potássio sérico de perto.\n\n*(CID-10: E11 Diabetes mellitus não-insulinodependente)*`;
        } else if (lower.includes('dor') || lower.includes('cefaleia') || lower.includes('analgesi')) {
          mockTitle = 'Manejo de Quadro Álgico';
          mockBody = `### 💊 Protocolo de Analgesia e Investigação\n\nPara o manejo da queixa de dor apresentada, a abordagem deve ser estratificada pela escala visual analógica (EVA):\n\n#### 1. Avaliação (SOAP)\n- **S (Subjetivo):** Paciente refere dor aguda. Necessário caracterizar tempo de início, irradiação e fatores agravantes/atenuantes.\n- **O (Objetivo):** Sinais vitais estáveis. Sem sinais de irritação meníngea ou déficit focal agudo.\n- **A (Avaliação):** Quadro álgico a esclarecer. Afastar causas secundárias de alarme (Red Flags).\n- **P (Plano):** Prescrever analgesia escalonada (Dipirona 1g EV ou AINEs se função renal preservada) e reavaliar em 30 minutos.\n\n*(CID-10: R52.9 Dor não especificada)*`;
        } else if (lower.includes('ola') || lower.includes('olá') || lower.includes('bom dia') || lower.includes('boa tarde') || lower.includes('boa noite') || lower.includes('oi')) {
          mockTitle = 'Assistente Clínico Chamsa ISA';
          mockBody = `### 👋 Olá! Sou o Dr. Chamsa ISA Plus\n\nEstou pronto para auxiliar na sua tomada de decisão clínica, análise de exames e formulação de condutas médicas estruturadas no padrão SOAP.\n\n**💡 Dica:** Para utilizar inteligência artificial real com respostas dinâmicas para qualquer pergunta, acesse a aba **Integrações** no menu lateral e insira sua chave de API (Groq, Mistral, OpenAI, Gemini) ou ative o Ollama local!\n\nComo posso ajudar no seu plantão hoje?`;
        } else {
          mockTitle = 'Parecer Técnico Clínico';
          const cleanSnippet = lastMsg.length > 45 ? lastMsg.substring(0, 45) + '...' : lastMsg;
          mockBody = `### 🏥 Análise Clínica: "${cleanSnippet}"\n\nCom base na solicitação apresentada, realizamos a estruturação do raciocínio clínico e plano de manejo.\n\n#### 1. Avaliação do Quadro (SOAP)\n- **S (Subjetivo):** Análise das queixas e histórico apresentados na solicitação do usuário.\n- **O (Objetivo):** Recomendada correlação estrita com exame físico completo e sinais vitais atualizados.\n- **A (Avaliação):** Necessário aprofundar a investigação diagnóstica para afastar diagnósticos diferenciais de alarme.\n- **P (Plano):** \n  1. Manter observação clínica e monitorização contínua.\n  2. Considerar exames laboratoriais complementares direcionados à queixa principal.\n  3. Tratamento sintomático inicial e reavaliação seriada conforme evolução.\n\n> ⚠️ **Aviso de Modo Autônomo (Sem Chave de API):** Esta é uma resposta gerada pelo simulador clínico offline do sistema. Para obter respostas geradas por IA real e dinâmicas para o seu caso específico, acesse a aba **Integrações** no menu lateral esquerdo e configure sua chave de API (Groq, Mistral, OpenAI, Gemini)!`;
        }

        const fullMockContent = isCanvasMode
          ? `<CANVAS title="${mockTitle}">\n${mockBody}\n</CANVAS>`
          : mockBody;

        const parsedCanvas = isCanvasMode ? { title: mockTitle, content: mockBody } : null;

        return {
          data: {
            content: fullMockContent,
            canvas: parsedCanvas,
            searchPrompt: 'Diretrizes de manejo clínico e avaliação de risco hospitalar',
            pubmedResults: null,
            usage: { prompt_tokens: 140, completion_tokens: 310 },
            provider: 'local-mock',
            model: model || 'mock-clinical-ai'
          }
        };
      }

      return { data: { success: true } };
    }
  }
};