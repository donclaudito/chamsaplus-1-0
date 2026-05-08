/**
 * appConfig.js
 * Configurações globais da aplicação.
 * Centraliza IDs, URLs e parâmetros sensíveis que não devem ser hardcoded nos componentes.
 */

// ID da pasta padrão do Google Drive usada como fonte RAG.
// Pode ser sobrescrito pelo usuário via DriveSourceConfig e persistido no localStorage.
export const DEFAULT_DRIVE_FOLDER_ID = '1eWosMBtk9N5tICSKLETbeECw9qlSpZed';