const isNode = typeof window === 'undefined';
const windowObj = isNode ? { localStorage: new Map() } : window;
const storage = windowObj.localStorage;

// Centraliza todas as chaves de token para garantir limpeza consistente
const TOKEN_KEYS = ['base44_access_token', 'base44_token', 'token'];

const toSnakeCase = (str) => str.replace(/([A-Z])/g, '_$1').toLowerCase();

// Recebe urlParams já instanciado para evitar duplicação de URLSearchParams
const getAppParamValue = (paramName, urlParams, { defaultValue = undefined, removeFromUrl = false } = {}) => {
	if (isNode) return defaultValue;

	const storageKey = `base44_${toSnakeCase(paramName)}`;
	const searchParam = urlParams.get(paramName);

	if (removeFromUrl && searchParam) {
		urlParams.delete(paramName);
		const qs = urlParams.toString();
		const newUrl = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`;
		window.history.replaceState({}, document.title, newUrl);
	}

	if (searchParam) {
		storage.setItem(storageKey, searchParam);
		return searchParam;
	}
	if (defaultValue !== undefined) {
		storage.setItem(storageKey, defaultValue);
		return defaultValue;
	}
	return storage.getItem(storageKey) || null;
};

const getAppParams = () => {
	// URLSearchParams instanciado uma única vez e reutilizado em todas as chamadas
	const urlParams = new URLSearchParams(
		typeof window !== 'undefined' ? window.location.search : ''
	);

	if (getAppParamValue("clear_access_token", urlParams) === 'true') {
		TOKEN_KEYS.forEach(k => storage.removeItem(k));
	}

	// Se há um token novo na URL (ex: redirect do Google OAuth), salva e limpa a URL sem recarregar
	const incomingToken = urlParams.get("access_token") || urlParams.get("_b44_token");
	if (incomingToken) {
		// Limpa tokens antigos e salva o novo
		TOKEN_KEYS.forEach(k => storage.removeItem(k));
		storage.setItem('base44_access_token', incomingToken);
		// Remove o token da URL sem recarregar a página (evita 401 nos assets dinâmicos)
		urlParams.delete("access_token");
		urlParams.delete("_b44_token");
		const qs = urlParams.toString();
		const newUrl = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`;
		window.history.replaceState({}, document.title, newUrl);
		// Não faz reload — o AuthContext já lê o token do localStorage na inicialização
	}

	return {
		appId:            getAppParamValue("app_id",            urlParams, { defaultValue: import.meta.env.VITE_BASE44_APP_ID ?? '' }),
		token:            getAppParamValue("access_token",      urlParams, { removeFromUrl: true }),
		fromUrl:          getAppParamValue("from_url",          urlParams, { defaultValue: typeof window !== 'undefined' ? window.location.href : '' }),
		functionsVersion: getAppParamValue("functions_version", urlParams, { defaultValue: import.meta.env.VITE_BASE44_FUNCTIONS_VERSION ?? '' }),
		appBaseUrl:       getAppParamValue("app_base_url",      urlParams, { defaultValue: import.meta.env.VITE_BASE44_APP_BASE_URL ?? '' }),
	};
};

export const appParams = { ...getAppParams() };