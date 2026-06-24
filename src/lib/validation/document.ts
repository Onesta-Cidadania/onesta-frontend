const onlyDigits = (value: string) => value.replace(/\D/g, "");

const onlyAlphanumeric = (value: string) => value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

const hasRepeatedDigits = (value: string) => /^(\d)\1+$/.test(value);

const validateCpf = (value: string) => {
  const cpf = onlyDigits(value);

  if (cpf.length !== 11 || hasRepeatedDigits(cpf)) {
    return false;
  }

  let sum = 0;

  for (let i = 0; i < 9; i += 1) {
    sum += Number(cpf[i]) * (10 - i);
  }

  let digit = 11 - (sum % 11);
  const firstDigit = digit >= 10 ? 0 : digit;

  if (firstDigit !== Number(cpf[9])) {
    return false;
  }

  sum = 0;

  for (let i = 0; i < 10; i += 1) {
    sum += Number(cpf[i]) * (11 - i);
  }

  digit = 11 - (sum % 11);
  const secondDigit = digit >= 10 ? 0 : digit;

  return secondDigit === Number(cpf[10]);
};

const validateCnpj = (value: string) => {
  const cnpj = onlyAlphanumeric(value);

  if (cnpj.length !== 14 || /^([A-Z0-9])\1+$/.test(cnpj) || !/^[A-Z0-9]{12}[0-9]{2}$/.test(cnpj)) {
    return false;
  }

  const getValue = (character: string) => character.charCodeAt(0) - 48;

  const calculateDigit = (length: number) => {
    const weights = length === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    const sum = weights.reduce((acc, weight, index) => acc + getValue(cnpj[index]) * weight, 0);
    const rest = sum % 11;

    return rest < 2 ? 0 : 11 - rest;
  };

  return calculateDigit(12) === Number(cnpj[12]) && calculateDigit(13) === Number(cnpj[13]);
};

export const normalizeCpfCnpj = onlyAlphanumeric;

export const isValidCpfCnpj = (value: string) => {
  const document = onlyAlphanumeric(value);

  if (/^[0-9]{11}$/.test(document)) {
    return validateCpf(document);
  }

  if (document.length === 14) {
    return validateCnpj(document);
  }

  return false;
};

export const formatCpfCnpj = (value: string) => {
  const document = onlyAlphanumeric(value).slice(0, 14);

  if (!/[A-Z]/.test(document) && document.length <= 11) {
    return document
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1-$2");
  }

  return document
    .replace(/^([A-Z0-9]{2})([A-Z0-9])/, "$1.$2")
    .replace(/^([A-Z0-9]{2})\.([A-Z0-9]{3})([A-Z0-9])/, "$1.$2.$3")
    .replace(/\.([A-Z0-9]{3})([A-Z0-9])/, ".$1/$2")
    .replace(/([A-Z0-9]{4})([A-Z0-9])/, "$1-$2");
};
