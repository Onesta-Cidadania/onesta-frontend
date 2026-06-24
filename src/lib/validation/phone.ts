export const formatPhoneWithDdi = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 13);

  if (digits.length === 0) return "";
  if (digits.length <= 2) return `+${digits}`;
  if (digits.length <= 4) return `+${digits.slice(0, 2)} (${digits.slice(2)}`;
  if (digits.length <= 8) return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4)}`;
  if (digits.length <= 12) {
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 8)}-${digits.slice(8)}`;
  }

  return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
};

export const displayPhoneWithDdi = (phone: string | null) => {
  if (!phone) return "—";

  const digits = phone.replace(/\D/g, "");
  return formatPhoneWithDdi(digits.length === 10 || digits.length === 11 ? `55${digits}` : digits);
};

export const normalizePhoneWithDdi = (phone: string) => {
  const digits = phone.replace(/\D/g, "");

  if (!digits) return null;

  return digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
};
