import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Info, User } from "lucide-react";
import { formatHeightInput } from "@/lib/formUtils";
import type { RequerenteData } from "@/hooks/useLocalStorageForm";
import PdfUpload from "./PdfUpload";

interface Props {
  requerentes: RequerenteData[];
  updateRequerente: (index: number, field: keyof RequerenteData, value: string) => void;
  addRequerente: () => void;
  removeRequerente: (index: number) => void;
}

const eyeColors = [
  { value: "azul", label: "Azul" },
  { value: "castanho", label: "Castanho" },
  { value: "cinza", label: "Cinza" },
  { value: "preto", label: "Preto" },
  { value: "verde", label: "Verde" },
] as const;

const StepRequerentesAdicionais = ({ requerentes, updateRequerente, addRequerente, removeRequerente }: Props) => {
  // Empty state
  if (requerentes.length === 0) {
    return (
      <TooltipProvider>
        <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-2">
            Requerentes Adicionais
          </h2>
          <p className="text-base text-muted-foreground">
            Adicione outros requerentes à solicitação (opcional)
          </p>
        </div>

        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/30 mb-4">
            <span className="text-3xl">👥</span>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Nenhum requerente adicional adicionado ainda.
          </p>
          <Button
            type="button"
            onClick={addRequerente}
            variant="outline"
            className="gap-2"
            disabled={requerentes.length >= 3}
          >
            <Plus className="w-4 h-4" />
            Adicionar requerente
          </Button>
        </div>
      </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-2">
          Requerentes Adicionais
        </h2>
        <p className="text-base text-muted-foreground">
          Informações dos demais requerentes ({requerentes.length}/3)
        </p>
      </div>

      {/* Requerente Cards */}
      <div className="space-y-6">
        {requerentes.map((requerente, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Card Header */}
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                  <User />
                </div>
                <h3 className="font-semibold text-foreground">
                  Requerente Adicional
                </h3>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeRequerente(idx)}
                className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
                Remover
              </Button>
            </div>

            {/* Card Fields */}
            <div className="grid gap-6">
              {/* Nome Completo */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor={`req-${idx}-nome`} className="text-sm font-medium">
                    Nome completo
                  </Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                    <p>Informe o nome completo do requerente adicional</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id={`req-${idx}-nome`}
                  type="text"
                  value={requerente.nomeCompleto}
                  onChange={(e) => updateRequerente(idx, "nomeCompleto", e.target.value)}
                  placeholder="Ex: Eduarda Silva Santos"
                  className="h-11"
                />
              </div>

              {/* Data de Nascimento */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor={`req-${idx}-nascimento`} className="text-sm font-medium">
                    Data de nascimento
                  </Label>
                </div>
                <Input
                  id={`req-${idx}-nascimento`}
                  type="date"
                  value={requerente.dataNascimento}
                  onChange={(e) => updateRequerente(idx, "dataNascimento", e.target.value)}
                  className="h-11"
                />
              </div>

              {/* Altura */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor={`req-${idx}-altura`} className="text-sm font-medium">
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
                  id={`req-${idx}-altura`}
                  type="text"
                  inputMode="numeric"
                  value={requerente.altura}
                  onChange={(e) => updateRequerente(idx, "altura", formatHeightInput(e.target.value))}
                  placeholder="185"
                  className="h-11"
                />
              </div>

              {/* Cor dos Olhos */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor={`req-${idx}-cor-olhos`} className="text-sm font-medium">
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
                <Select
                  value={requerente.corOlhos}
                  onValueChange={(value) =>
                    updateRequerente(idx, "corOlhos", value as RequerenteData["corOlhos"])
                  }
                >
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

              {/* PDF Upload */}
              <PdfUpload
                title="Documento de Identidade (PDF)"
                fileName={requerente.documentoIdentidade}
                onFileSelect={(file) => updateRequerente(idx, "documentoIdentidade", file?.name || "")}
                onFileRemove={() => updateRequerente(idx, "documentoIdentidade", "")}
                tooltipText="Frente e verso da Identidade do Requerente Adicional em formato PDF"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Add Button */}
      {requerentes.length < 3 && (
        <div className="flex justify-center">
          <Button
            type="button"
            onClick={addRequerente}
            variant="outline"
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Adicionar outro requerente
          </Button>
        </div>
      )}
    </div>
    </TooltipProvider>
  );
};

export default StepRequerentesAdicionais;
