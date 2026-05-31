import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Eye, EyeOff, Mail, Info } from "lucide-react";
import { cleanAddressInput, formatHeightInput, fetchAddressFromCEP } from "@/lib/formUtils";
import type { FormData } from "@/hooks/useLocalStorageForm";
import PdfUpload from "./PdfUpload";

interface Props {
  nome: string;
  pdfFile: string;
  email: string;
  senha: string;
  cep: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  complemento: string;
  estadoCivil: FormData["titularEstadoCivil"];
  documentoIdentidade: string;
  altura: string;
  corOlhos: FormData["prenotamiCorOlhos"];
  updateField: <K extends keyof FormData>(field: K, value: FormData[K]) => void;
}

const estadoCivilOptions = [
  { value: "16", label: "Solteiro(a)" },
  { value: "13", label: "Casado(a)" },
  { value: "14", label: "Divorciado(a)" },
  { value: "15", label: "Viúvo(a)" },
  { value: "17", label: "Separado(a)" },
  { value: "18", label: "Em união estável" },
  { value: "19", label: "Separado(a) de união estável" },
  { value: "20", label: "Dissolvido(a) de união estável" },
  { value: "21", label: "Viúvo(a) de companheiro(a)" },
] as const;

const eyeColors = [
  { value: "azul", label: "Azul" },
  { value: "castanho", label: "Castanho" },
  { value: "cinza", label: "Cinza" },
  { value: "preto", label: "Preto" },
  { value: "verde", label: "Verde" },
] as const;

const StepDadosTitular = ({
  nome,
  pdfFile,
  email,
  senha,
  cep,
  logradouro,
  numero,
  bairro,
  cidade,
  estado,
  complemento,
  estadoCivil,
  documentoIdentidade,
  altura,
  corOlhos,
  updateField,
}: Props) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  const handleCepChange = async (value: string) => {
    updateField("titularCep", value);
    setAddressError(null);

    const cleanCep = value.replace(/\D/g, "");

    if (cleanCep.length === 8) {
      setIsFetchingAddress(true);

      try {
        const addressData = await fetchAddressFromCEP(cleanCep);

        if (addressData) {
          updateField("titularLogradouro", addressData.logradouro || "");
          updateField("titularBairro", addressData.bairro || "");
          updateField("titularCidade", addressData.localidade || "");
          updateField("titularEstado", addressData.uf || "");
          updateField("titularComplemento", addressData.complemento || "");
        } else {
          setAddressError("CEP não encontrado. Preencha o endereço manualmente.");
        }
      } catch (error) {
        setAddressError("Erro ao buscar CEP. Preencha o endereço manualmente.");
      } finally {
        setIsFetchingAddress(false);
      }
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-2">
          Dados do Titular (Prenotami)
        </h2>
        <p className="text-base text-muted-foreground">
          Informações pessoais e credenciais de acesso
        </p>
      </div>

      <div className="grid gap-6">
        {/* Nome Completo */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="clienteNome" className="text-sm font-medium">
              Nome completo
            </Label>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Informe o nome completo do titular da conta Prenotami</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="clienteNome"
            type="text"
            value={nome}
            onChange={(e) => updateField("clienteNome", e.target.value)}
            placeholder="Ex: Maria da Silva Santos"
            className="h-11"
          />
        </div>

        {/* Email Prenotami */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="prenotamiEmail" className="text-sm font-medium">
              Email Prenotami
            </Label>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Informe o email do titular da conta Prenotami</p>
              </TooltipContent>
            </Tooltip>
          </div>
            <Input
              id="prenotamiEmail"
              type="email"
              value={email}
              onChange={(e) => updateField("prenotamiEmail", e.target.value)}
              placeholder="Ex: maria.santos@gmail.com"
              className="h-11"
            />
        </div>

        {/* Senha */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="prenotamiSenha" className="text-sm font-medium">
              Senha Prenotami
            </Label>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Informe a senha do titular da conta Prenotami</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="relative">
            <Input
              id="prenotamiSenha"
              type={showPassword ? "text" : "password"}
              value={senha}
              onChange={(e) => updateField("prenotamiSenha", e.target.value)}
              placeholder="Ex: SuaSenha123"
              className="h-11 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* CEP */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="titularCep" className="text-sm font-medium">
              CEP
            </Label>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Apenas números (8 dígitos)</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="relative">
            <Input
              id="titularCep"
              type="text"
              inputMode="numeric"
              value={cep}
              onChange={(e) => handleCepChange(cleanAddressInput(e.target.value))}
              placeholder="05410001"
              className="h-11 uppercase pr-10"
              disabled={isFetchingAddress}
            />
            {isFetchingAddress && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
              </div>
            )}
          </div>
          {addressError && (
            <p className="text-xs text-destructive">{addressError}</p>
          )}
        </div>

        {/* Endereço */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Logradouro */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="titularLogradouro" className="text-sm font-medium">
              Rua / Avenida
            </Label>
            <Input
              id="titularLogradouro"
              type="text"
              value={logradouro}
              onChange={(e) => updateField("titularLogradouro", e.target.value)}
              placeholder="Ex: Av. Paulista"
              className="h-11"
            />
          </div>

          {/* Número */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label htmlFor="titularNumero" className="text-sm font-medium">
                Número
              </Label>
            </div>
            <Input
              id="titularNumero"
              type="text"
              value={numero}
              onChange={(e) => updateField("titularNumero", e.target.value)}
              placeholder="Ex: 1000"
              className="h-11"
            />
          </div>

          {/* Complemento */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label htmlFor="titularComplemento" className="text-sm font-medium">
                Complemento (Opcional)
              </Label>
            </div>
            <Input
              id="titularComplemento"
              type="text"
              value={complemento}
              onChange={(e) => updateField("titularComplemento", e.target.value)}
              placeholder="Ex: Apto 101"
              className="h-11"
            />
          </div>

          {/* Bairro */}
          <div className="space-y-2">
            <Label htmlFor="titularBairro" className="text-sm font-medium">
              Bairro
            </Label>
            <Input
              id="titularBairro"
              type="text"
              value={bairro}
              onChange={(e) => updateField("titularBairro", e.target.value)}
              placeholder="Ex: Bela Vista"
              className="h-11"
            />
          </div>

          {/* Cidade */}
          <div className="space-y-2">
            <Label htmlFor="titularCidade" className="text-sm font-medium">
              Cidade
            </Label>
            <Input
              id="titularCidade"
              type="text"
              value={cidade}
              onChange={(e) => updateField("titularCidade", e.target.value)}
              placeholder="Ex: São Paulo"
              className="h-11"
            />
          </div>

          {/* Estado */}
          <div className="space-y-2">
            <Label htmlFor="titularEstado" className="text-sm font-medium">
              Estado
            </Label>
            <Input
              id="titularEstado"
              type="text"
              value={estado}
              onChange={(e) => updateField("titularEstado", e.target.value)}
              placeholder="Ex: SP"
              className="h-11 uppercase"
              maxLength={2}
            />
          </div>
        </div>

        {/* Estado Civil */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="titularEstadoCivil" className="text-sm font-medium">
              Estado Civil
            </Label>

          </div>
          <Select value={estadoCivil} onValueChange={(value) => updateField("titularEstadoCivil", value as FormData["titularEstadoCivil"])}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Selecione o estado civil" />
            </SelectTrigger>
            <SelectContent>
              {estadoCivilOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

                {/* Altura */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="prenotamiAltura" className="text-sm font-medium">
              Altura
            </Label>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Informe apenas números em centímetros (ex: 185 para 1,85m)</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="prenotamiAltura"
            type="text"
            inputMode="numeric"
            value={altura}
            onChange={(e) => updateField("prenotamiAltura", formatHeightInput(e.target.value))}
            placeholder="185"
            className="h-11"
          />
        </div>

        {/* Cor dos Olhos */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="prenotamiCorOlhos" className="text-sm font-medium">
              Cor dos olhos
            </Label>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Somente estas cores são fornecidas pelo sistema. Escolha a cor que melhor se adapta à sua.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Select value={corOlhos} onValueChange={(value) => updateField("prenotamiCorOlhos", value as FormData["prenotamiCorOlhos"])}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Selecione a cor dos olhos" />
            </SelectTrigger>
            <SelectContent>
              {eyeColors.map((color) => (
                <SelectItem key={color.value} value={color.value}>
                  {color.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Documento de Identidade */}
        <PdfUpload
          title="Documento de Identidade (PDF)"
          fileName={documentoIdentidade}
          onFileSelect={(file) => updateField("titularDocumentoIdentidade", file?.name || "")}
          onFileRemove={() => updateField("titularDocumentoIdentidade", "")}
          tooltipText="Frente e verso da Identidade do Titular em promato de PDF"
        />

        {/* Comprovante de Residência (Opcional) */}
        <PdfUpload
          title="Comprovante de Residência (PDF) - Opcional"
          fileName={pdfFile}
          onFileSelect={(file) => updateField("clientePdfFile", file?.name || "")}
          onFileRemove={() => updateField("clientePdfFile", "")}
          tooltipText="Conta de luz, água ou telefone dos últimos 3 meses"
        />
      </div>
    </div>
    </TooltipProvider>
  );
};

export default StepDadosTitular;
