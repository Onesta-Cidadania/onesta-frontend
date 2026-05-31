import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Edit, User, Users, StickyNote, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FormData } from "@/hooks/useLocalStorageForm";

interface Props {
  formData: FormData;
  onEditStep: (step: number) => void;
  isSubmitting: boolean;
  onConfirm: () => void;
  updateField: <K extends keyof FormData>(field: K, value: FormData[K]) => void;
  stepIndices: {
    tipo: number;
    assessor?: number;
    titular: number;
    requerentes: number;
    observacoes: number;
  };
}

const estadoCivilLabels: Record<FormData["titularEstadoCivil"], string> = {
  "13": "Casado(a)",
  "14": "Divorciado(a)",
  "15": "Viúvo(a)",
  "16": "Solteiro(a)",
  "17": "Separado(a)",
  "18": "Em união estável",
  "19": "Separado(a) de união estável",
  "20": "Dissolvido(a) de união estável",
  "21": "Viúvo(a) de companheiro(a)",
  "": "",
};

const corOlhosLabels: Record<FormData["prenotamiCorOlhos"], string> = {
  azul: "Azul",
  castanho: "Castanho",
  cinza: "Cinza",
  preto: "Preto",
  verde: "Verde",
  "": "",
};

const tipoUsuarioLabels: Record<FormData["tipoUsuario"], string> = {
  cliente: "Cliente",
  assessor: "Assessor",
  "": "",
};

const StepRevisaoConfirmacao = ({ formData, onEditStep, isSubmitting, onConfirm, updateField, stepIndices }: Props) => {
  const isAssessor = formData.tipoUsuario === "assessor";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-2">
          Revisão e Confirmação
        </h2>
        <p className="text-base text-muted-foreground">
          Verifique todas as informações antes de enviar
        </p>
      </div>

      {/* Section Cards */}
      <div className="space-y-4">
        {/* Tipo de Usuário */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Tipo de Usuário</CardTitle>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onEditStep(stepIndices.tipo)}
                className="gap-2"
              >
                <Edit className="w-4 h-4" />
                Editar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <span className="text-sm font-medium">
              {tipoUsuarioLabels[formData.tipoUsuario] || "-"}
            </span>
          </CardContent>
        </Card>

        {/* Dados do Assessor - only show if assessor */}
        {isAssessor && (
          <Card className="border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">Dados do Assessor</CardTitle>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onEditStep(stepIndices.assessor!)}
                  className="gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 text-sm">
                <div className="flex">
                  <span className="text-muted-foreground w-40">Email:</span>
                  <span className="font-medium">{formData.assessorEmail || "-"}</span>
                </div>
                <div className="flex">
                  <span className="text-muted-foreground w-40">Nome/Empresa:</span>
                  <span className="font-medium">{formData.assessorNome || "-"}</span>
                </div>
                <div className="flex">
                  <span className="text-muted-foreground w-40">Telefone:</span>
                  <span className="font-medium">{formData.assessorTelefone || "-"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dados do Titular */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Dados do Titular</CardTitle>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onEditStep(stepIndices.titular)}
                className="gap-2"
              >
                <Edit className="w-4 h-4" />
                Editar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 text-sm">
              <div className="flex">
                <span className="text-muted-foreground w-40">Nome:</span>
                <span className="font-medium">{formData.clienteNome || "-"}</span>
              </div>
              <div className="flex">
                <span className="text-muted-foreground w-40">Email Prenotami:</span>
                <span className="font-medium">{formData.prenotamiEmail || "-"}</span>
              </div>
              <div className="flex">
                <span className="text-muted-foreground w-40">CEP:</span>
                <span className="font-medium">{formData.titularCep || "-"}</span>
              </div>
              <div className="flex">
                <span className="text-muted-foreground w-40">Estado Civil:</span>
                <span className="font-medium">{estadoCivilLabels[formData.titularEstadoCivil] || "-"}</span>
              </div>
              <div className="flex">
                <span className="text-muted-foreground w-40">Altura:</span>
                <span className="font-medium">{formData.prenotamiAltura ? `${formData.prenotamiAltura} cm` : "-"}</span>
              </div>
              <div className="flex">
                <span className="text-muted-foreground w-40">Cor dos Olhos:</span>
                <span className="font-medium">{corOlhosLabels[formData.prenotamiCorOlhos] || "-"}</span>
              </div>
              <div className="flex">
                <span className="text-muted-foreground w-40">Comprovante de Residência:</span>
                <span className="font-medium">{formData.clientePdfFile || "-"}</span>
              </div>
              <div className="flex">
                <span className="text-muted-foreground w-40">Doc. Identidade PDF:</span>
                <span className="font-medium">{formData.titularDocumentoIdentidade || "-"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requerentes Adicionais */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Requerentes Adicionais</CardTitle>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onEditStep(stepIndices.requerentes)}
                className="gap-2"
              >
                <Edit className="w-4 h-4" />
                Editar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {formData.requerentes.length > 0 ? (
              <div className="space-y-3">
                {formData.requerentes.map((req, idx) => (
                  <div key={idx} className="p-3 bg-muted/30 rounded-lg">
                    <p className="font-medium text-sm">{req.nomeCompleto || `Requerente ${idx + 2}`}</p>
                    <p className="text-xs text-muted-foreground">
                      Nascimento: {req.dataNascimento ? new Date(req.dataNascimento).toLocaleDateString("pt-BR") : "-"} •
                      Altura: {req.altura ? `${req.altura}cm` : "-"} •
                      Olhos: {corOlhosLabels[req.corOlhos] || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Documento: {req.documentoIdentidade || "-"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Nenhum requerente adicional</span>
            )}
          </CardContent>
        </Card>

        {/* Observações e Restrições */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StickyNote className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Observações e Restrições</CardTitle>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onEditStep(stepIndices.observacoes)}
                className="gap-2"
              >
                <Edit className="w-4 h-4" />
                Editar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Seção Observações */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Observações Adicionais
              </p>
              {formData.observacoes ? (
                <p className="text-sm">{formData.observacoes}</p>
              ) : (
                <span className="text-sm text-muted-foreground">Nenhuma observação</span>
              )}
            </div>

            {/* Seção Restrições de Datas */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Restrições de Datas
              </p>
              {formData.datasRestricao.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {formData.datasRestricao
                    .sort()
                    .map((dateStr) => (
                      <Badge key={dateStr} variant="secondary">
                        {new Date(dateStr).toLocaleDateString("pt-BR")}
                      </Badge>
                    ))}
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Sem restrições de datas</span>
              )}
            </div>


          </CardContent>
        </Card>
      </div>

      {/* Confirmation Checkbox */}
      <label
        className={cn(
          "flex items-start gap-6 rounded-xl border-2 p-5 cursor-pointer transition-all",
          "hover:border-primary/30 hover:bg-primary/5",
          formData.revisaoConfirmado ? "border-primary bg-primary/5" : "border-border bg-card"
        )}
      >
        <Checkbox
          checked={formData.revisaoConfirmado}
          onCheckedChange={(checked) => updateField("revisaoConfirmado", checked === true)}
          className="mt-0.5"
        />
        <span className="text-sm font-medium leading-relaxed">
          Confirmo que todas as informações estão corretas e desejo enviar a solicitação.
        </span>
      </label>

      {/* Submit Button */}
      <Button
        onClick={onConfirm}
        disabled={!formData.revisaoConfirmado || isSubmitting}
        className="w-full gap-2"
        size="lg"
      >
        {isSubmitting ? (
          <>Enviando...</>
        ) : (
          <>Enviar Solicitação</>
        )}
      </Button>
    </div>
  );
};

export default StepRevisaoConfirmacao;
