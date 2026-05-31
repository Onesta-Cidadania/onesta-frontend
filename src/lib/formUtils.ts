/**
 * Utility functions for form data cleaning and formatting
 */

/**
 * Remove accents from Portuguese text
 * @param text - Input string
 * @returns String without accents
 *
 * Example: "São Paulo" -> "Sao Paulo"
 */
export function removeAccents(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Clean address input - only letters, numbers, space, hyphen
 * Removes accents, commas, and special characters
 * @param text - Raw address input
 * @returns Cleaned address in uppercase
 *
 * Example: "Av. Brigadeiro Luís Antônio, 100" -> "AV BRIGADEIRO LUIS ANTONIO 100"
 */
export function cleanAddressInput(text: string): string {
  return removeAccents(text)
    .toUpperCase()
    .replace(/[^A-Z0-9\s-]/g, "") // Keep only letters, numbers, space, hyphen
    .replace(/,/g, "") // Explicitly remove commas
    .replace(/\s+/g, " ") // Normalize spaces
    .trim();
}

/**
 * Clean observations field - max 100 chars, no special chars
 * Allows only: A-Z, 0-9, space, hyphen (-)
 * @param text - Raw observation input
 * @param maxLength - Maximum characters (default 100)
 * @returns Cleaned and truncated observation
 */
export function cleanObservations(text: string, maxLength: number = 100): string {
  return removeAccents(text)
    .replace(/[^a-zA-Z0-9\s\-]/g, "") // Keep only letters, numbers, space, hyphen
    .replace(/\s+/g, " ")
    .slice(0, maxLength);
}

/**
 * Format height input - numeric only, max 3 digits
 * @param value - Raw height input
 * @returns Formatted height (numbers only, max 999)
 *
 * Example: "185cm" -> "185", "abc" -> ""
 */
export function formatHeightInput(value: string): string {
  return value.replace(/\D/g, "").slice(0, 3);
}

/**
 * Character counter helper
 * @param text - Text to count
 * @param maxLength - Maximum allowed
 * @returns Current count, remaining, and limit status
 */
export function getCharCount(text: string, maxLength: number) {
  return {
    current: text.length,
    remaining: maxLength - text.length,
    isNearLimit: text.length > maxLength * 0.8,
    isAtLimit: text.length >= maxLength,
  };
}

/**
 * Format phone number input
 * @param value - Raw phone input
 * @returns Formatted phone (XX) XXXXX-XXXX
 *
 * Example: "11987654321" -> "(11) 98765-4321"
 */
export function formatPhoneInput(value: string): string {
  const numbers = value.replace(/\D/g, "").slice(0, 11);
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
}

/**
 * Validate email format
 * @param email - Email to validate
 * @returns True if valid format
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate Brazilian CEP
 * @param cep - CEP to validate
 * @returns True if valid (8 digits)
 */
export function isValidCEP(cep: string): boolean {
  return /^\d{8}$/.test(cep.replace(/\D/g, ""));
}

/**
 * ViaCEP API response interface
 */
export interface ViaCEPResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

/**
 * Fetch address from ViaCEP API
 * @param cep - 8-digit CEP (numbers only)
 * @returns Address data or null if not found/error
 *
 * Example: fetchAddressFromCEP("01310200") -> { logradouro: "Av. Paulista", ... }
 */
export async function fetchAddressFromCEP(
  cep: string
): Promise<ViaCEPResponse | null> {
  const cleanCep = cep.replace(/\D/g, "");

  if (!isValidCEP(cleanCep)) {
    return null;
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);

    if (!response.ok) {
      return null;
    }

    const data: ViaCEPResponse = await response.json();

    // ViaCEP returns { erro: true } for invalid CEPs
    if (data.erro) {
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error fetching address from ViaCEP:", error);
    return null;
  }
}

/**
 * Validate phone number
 * @param phone - Phone to validate
 * @returns True if valid (10 or 11 digits)
 */
export function isValidPhone(phone: string): boolean {
  const numbers = phone.replace(/\D/g, "");
  return numbers.length === 10 || numbers.length === 11;
}

/**
 * Validate required field
 * @param value - Value to validate
 * @returns True if not empty
 */
export function validateRequired(value: string): boolean {
  return value.trim().length > 0;
}
