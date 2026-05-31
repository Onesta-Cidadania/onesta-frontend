import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "agendamento-draft";

export interface RequerenteData {
  nomeCompleto: string;
  dataNascimento: string;
  altura: string;
  corOlhos: "azul" | "castanho" | "cinza" | "preto" | "verde" | "";
  documentoIdentidade: string;
}

export interface FormData {
  // Step 0: Tipo de Usuário
  tipoUsuario: "cliente" | "assessor" | "";

  // Step 1: Dados do Assessor
  assessorEmail: string;
  assessorNome: string;
  assessorTelefone: string;

  // Step 2: Dados do Titular (Prenotami)
  clienteNome: string;
  clientePdfFile: string;
  prenotamiEmail: string;
  prenotamiSenha: string;
  titularCep: string;
  titularEstadoCivil: "13" | "14" | "15" | "16" | "17" | "18" | "19" | "20" | "21" | "";
  titularDocumentoIdentidade: string;
  prenotamiAltura: string;
  prenotamiCorOlhos: "azul" | "castanho" | "cinza" | "preto" | "verde" | "";
  titularLogradouro: string;
  titularNumero: string;
  titularBairro: string;
  titularCidade: string;
  titularEstado: string;
  titularComplemento: string;

  // Step 3: Requerentes Adicionais
  requerentes: RequerenteData[];

  // Step 4: Restrições de Datas
  datasRestricao: string[];

  // Step 5: Observações
  observacoes: string;

  // Step 6: Revisão e Confirmação
  revisaoConfirmado: boolean;
}

const defaultFormData: FormData = {
  tipoUsuario: "",
  assessorEmail: "",
  assessorNome: "",
  assessorTelefone: "",
  clienteNome: "",
  clientePdfFile: "",
  prenotamiEmail: "",
  prenotamiSenha: "",
  titularCep: "",
  titularEstadoCivil: "",
  titularDocumentoIdentidade: "",
  prenotamiAltura: "",
  prenotamiCorOlhos: "",
  titularLogradouro: "",
  titularNumero: "",
  titularBairro: "",
  titularCidade: "",
  titularEstado: "",
  titularComplemento: "",
  requerentes: [],
  datasRestricao: [],
  observacoes: "",
  revisaoConfirmado: false,
};

export function useLocalStorageForm() {
  const [formData, setFormData] = useState<FormData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Migration: datasPreferencia → datasRestricao
        if (parsed.datasPreferencia && !parsed.datasRestricao) {
          parsed.datasRestricao = parsed.datasPreferencia;
          delete parsed.datasPreferencia;
        }
        return { ...defaultFormData, ...parsed };
      }
    } catch {}
    return defaultFormData;
  });

  const [currentStep, setCurrentStep] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + "-step");
      if (saved) return parseInt(saved, 10);
    } catch {}
    return 0;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + "-step", String(currentStep));
  }, [currentStep]);

  const updateField = useCallback(<K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const updateRequerente = useCallback(
    (index: number, field: keyof RequerenteData, value: string) => {
      setFormData((prev) => {
        const requerentes = [...prev.requerentes];
        requerentes[index] = { ...requerentes[index], [field]: value };
        return { ...prev, requerentes };
      });
    },
    []
  );

  const addRequerente = useCallback(() => {
    setFormData((prev) => {
      if (prev.requerentes.length >= 3) return prev;
      return {
        ...prev,
        requerentes: [
          ...prev.requerentes,
          {
            nomeCompleto: "",
            dataNascimento: "",
            altura: "",
            corOlhos: "",
            documentoIdentidade: "",
          },
        ],
      };
    });
  }, []);

  const removeRequerente = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      requerentes: prev.requerentes.filter((_, i) => i !== index),
    }));
  }, []);

  const resetForm = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY + "-step");
    setFormData(defaultFormData);
    setCurrentStep(0);
  }, []);

  return {
    formData,
    currentStep,
    setCurrentStep,
    updateField,
    updateRequerente,
    addRequerente,
    removeRequerente,
    resetForm,
  };
}
