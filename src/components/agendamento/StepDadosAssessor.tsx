import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import type { FormData } from "@/hooks/useLocalStorageForm";

interface Props {
  formData: FormData;
  updateField: <K extends keyof FormData>(field: K, value: FormData[K]) => void;
}

// Função para aplicar máscara de telefone
const maskPhone = (value: string): string => {
  // Remove tudo que não é dígito
  const cleaned = value.replace(/\D/g, "");

  // Aplica a máscara (XX) XXXXX-XXXX
  if (cleaned.length <= 2) {
    return cleaned;
  } else if (cleaned.length <= 7) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
  } else {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
  }
};

const StepDadosAssessor = ({ formData, updateField }: Props) => (
  <TooltipProvider>
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-2">
          Dados do Assessor
        </h2>
        <p className="text-base text-muted-foreground">
          Informe seus dados de contato profissional
        </p>
      </div>

      {/* Form fields */}
      <div className="grid gap-6">
        {/* Nome / Empresa */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="assessorNome" className="text-sm font-medium">
              Nome / Empresa
            </Label>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Informe o nome completo ou nome da empresa</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="assessorNome"
            type="text"
            value={formData.assessorNome}
            onChange={(e) => updateField("assessorNome", e.target.value)}
            placeholder="Ex: João Silva - Turismo Brasil"
            className="h-11"
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="assessorEmail" className="text-sm font-medium">
              Email
            </Label>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Email para contato profissional</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="assessorEmail"
            type="email"
            value={formData.assessorEmail}
            onChange={(e) => updateField("assessorEmail", e.target.value)}
            placeholder="Ex: joao.silva@gmail.com"
            className="h-11"
          />
        </div>

        {/* Telefone */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="assessorTelefone" className="text-sm font-medium">
              Telefone
            </Label>
          </div>
          <Input
            id="assessorTelefone"
            type="tel"
            value={formData.assessorTelefone}
            onChange={(e) => updateField("assessorTelefone", maskPhone(e.target.value))}
            placeholder="Ex: (11) 98765-4321"
            className="h-11"
            maxLength={15}
          />
        </div>
      </div>
    </div>
  </TooltipProvider>
);

export default StepDadosAssessor;
