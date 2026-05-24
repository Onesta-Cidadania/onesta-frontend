/**
 * Funções de validação reutilizáveis para campos de formulário.
 * Todas retornam `string | null` — a mensagem de erro ou null se válido.
 */

/** Valida campo obrigatório (não vazio após trim) */
export const validateRequired = (value: string, label: string): string | null => {
  if (!value?.trim()) return `O campo ${label} é obrigatório`;
  return null;
};

/** Valida formato de email */
export const validateEmail = (value: string): string | null => {
  if (!value?.trim()) return "O email é obrigatório";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return "Digite um email válido";
  return null;
};

/** Valida telefone com DDD (mínimo 10 dígitos) */
export const validatePhone = (value: string): string | null => {
  if (!value?.trim()) return "O telefone é obrigatório";
  const digits = value.replace(/\D/g, "");
  if (digits.length < 10) return "Digite um telefone válido com DDD";
  return null;
};