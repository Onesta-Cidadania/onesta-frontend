import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "agendamento-draft";

export interface RequerenteData {
  nomeCompleto: string;
  dataNascimento: string;
  altura: string;
  corOlhos: "azul" | "castanho" | "cinza" | "preto" | "verde" | "";
  documentoIdentidade: string;
  documentoIdentidadeFile?: File | null;
}

export interface FormData {
  // Step 0: Tipo de Usuário
  tipoUsuario: "cliente" | "assessor" | "";
  
  // Step 0.5: Serviço Selecionado
  servicoSelecionado: string; // Código do serviço (ex: 'sp-primeiro-passaporte')
  servicoId: string; // ID do serviço no banco

  // Step 1: Dados do Assessor
  assessorEmail: string;
  assessorNome: string;
  assessorTelefone: string;

  // Step 2: Dados do Titular (Prenotami)
  clienteNome: string;
  clientePdfFile: string;
  clientePdfFileObject?: File | null;
  prenotamiEmail: string;
  prenotamiSenha: string;
  titularCep: string;
  titularEstadoCivil: "13" | "14" | "15" | "16" | "17" | "18" | "19" | "20" | "21" | "";
  titularDocumentoIdentidade: string;
  titularDocumentoIdentidadeFile?: File | null;
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
  datasRestricao: Array<{ inicio: Date | null; fim: Date | null }>;

  // Step 5: Observações
  observacoes: string;

  // Campos adicionais para integração com bot/CSV
  qtde_filhos: number;
  tipo_reserva: string;
  email_otp: string;
  senha_email_otp: string;
  data_alvo: string;

  // Step 6: Revisão e Confirmação
  revisaoConfirmado: boolean;
}

const defaultFormData: FormData = {
  tipoUsuario: "",
  servicoSelecionado: "",
  servicoId: "",
  assessorEmail: "",
  assessorNome: "",
  assessorTelefone: "",
  clienteNome: "",
  clientePdfFile: "",
  clientePdfFileObject: null,
  prenotamiEmail: "",
  prenotamiSenha: "",
  titularCep: "",
  titularEstadoCivil: "",
  titularDocumentoIdentidade: "",
  titularDocumentoIdentidadeFile: null,
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
  qtde_filhos: 0,
  tipo_reserva: "",
  email_otp: "",
  senha_email_otp: "",
  data_alvo: "",
  revisaoConfirmado: false,
};

// Helper function to deserialize dates from localStorage
function deserializeFormData(data: Partial<FormData>): FormData {
  const result = { ...data };
  
  // Convert datasRestricao dates back to Date objects
  if (result.datasRestricao && Array.isArray(result.datasRestricao)) {
    result.datasRestricao = result.datasRestricao.map((range: { inicio: string | Date | null; fim: string | Date | null }) => ({
      inicio: range.inicio ? new Date(range.inicio) : null,
      fim: range.fim ? new Date(range.fim) : null,
    }));
  }
  
  return result;
}

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
        return deserializeFormData({ ...defaultFormData, ...parsed }) as FormData;
      }
    } catch {
      // Ignore JSON parse errors
    }
    return defaultFormData;
  });

  const [currentStep, setCurrentStep] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + "-step");
      if (saved) return parseInt(saved, 10);
    } catch {
      // Ignore JSON parse errors
    }
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
    (index: number, field: keyof RequerenteData, value: string | File | null) => {
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
            documentoIdentidadeFile: null,
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

  const fillDemoData = useCallback((isAssessor: boolean = false) => {
    const demoData: Partial<FormData> = {
      tipoUsuario: isAssessor ? "assessor" : "cliente",
      servicoSelecionado: "sp-primeiro-passaporte",
      servicoId: "",
      
      // Dados do Assessor (se aplicável)
      //assessorEmail: "assessor@exemplo.com",
      //assessorNome: "João Silva Assessor",
      //assessorTelefone: "+55 11 98765-4321",
      
      // Dados do Titular
      clienteNome: "Maria Santos Oliveira",
      clientePdfFile: "", // Deixar vazio para anexar manualmente
      clientePdfFileObject: null,
      prenotamiEmail: "maria.santos@email.com",
      prenotamiSenha: "SenhaDemo123!",
      titularCep: "01310-100",
      titularEstadoCivil: "15", // Casado
      titularDocumentoIdentidade: null,
      titularDocumentoIdentidadeFile: null,
      prenotamiAltura: "165",
      prenotamiCorOlhos: "castanho",
      titularLogradouro: "Av. Paulista",
      titularNumero: "1000",
      titularBairro: "Bela Vista",
      titularCidade: "São Paulo",
      titularEstado: "SP",
      titularComplemento: "Apto 101",
      
      // Requerentes Adicionais
      requerentes: [
        {
          nomeCompleto: "João Santos Oliveira",
          dataNascimento: "2015-03-15",
          altura: "140",
          corOlhos: "castanho",
          documentoIdentidade: null,
          documentoIdentidadeFile: null,
        },
        {
          nomeCompleto: "Ana Santos Oliveira",
          dataNascimento: "2018-07-22",
          altura: "115",
          corOlhos: "verde",
          documentoIdentidade: null,
          documentoIdentidadeFile: null,
        },
      ],
      
      // Restrições de Datas (períodos)
      datasRestricao: [
        {
          inicio: new Date("2026-05-15"),
          fim: new Date("2026-05-20")
        },
        {
          inicio: new Date("2026-06-01"),
          fim: new Date("2026-06-05")
        }
      ],
      
      // Observações
      observacoes: "Gostaria de agendar para período de manhã se possível. Preferência para datas após o dia 10 do mês.",
      
      // Campos adicionais para integração
      qtde_filhos: 2,
      tipo_reserva: "",
      email_otp: "",
      senha_email_otp: "",
      data_alvo: "",
      
      revisaoConfirmado: false,
    };
    
    setFormData({ ...defaultFormData, ...demoData });
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
    fillDemoData,
  };
}