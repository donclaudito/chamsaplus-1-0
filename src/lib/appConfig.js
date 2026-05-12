/**
 * appConfig.js
 * Configurações globais da aplicação.
 * Centraliza IDs, URLs e parâmetros sensíveis que não devem ser hardcoded nos componentes.
 */

// ID da pasta padrão do Google Drive usada como fonte RAG.
// Pode ser sobrescrito pelo usuário via DriveSourceConfig e persistido no localStorage.
// Lido do localStorage para não expor o ID padrão no código-fonte.
export const DEFAULT_DRIVE_FOLDER_ID = (typeof window !== 'undefined' && localStorage.getItem('drive_folder_id')) || '';

// SSR-safe: garante que `window` existe antes de acessar propriedades do browser
export const isIframe = typeof window !== 'undefined' && window.self !== window.top;