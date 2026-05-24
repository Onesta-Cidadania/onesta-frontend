import { useMemo, useState, useCallback } from "react";
import { useLocalStorageForm } from "@/hooks/useLocalStorageForm";
import { salvarAgendamento } from "@/services/agendamento.service";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  User,
  Users,
  StickyNote,
  CheckCircle,
  Play,
} from "lucide-react";

import StepTipoUsuario from "@/components/agendamento/StepTipoUsuario";
import StepDadosAssessor from "@/components/agendamento/StepDadosAssessor";
import StepDadosTitular from "@/components/agendamento/StepDadosTitular";
import StepRequerentesAdicionais from "@/components/agendamento/StepRequerentesAdicionais";
import StepObservacoes from "@/components/agendamento/StepObservacoes";
import StepRevisaoConfirmacao from "@/components/agendamento/StepRevisaoConfirmacao";
import StepSucesso from "@/components/agendamento/StepSucesso";
import StepIndicator from "@/components/agendamento/StepIndicator";
import { validateRequired, validateEmail, validatePhone } from "@/lib/validations";

const Agendamento = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assessorErrors, setAssessorErrors] = useState<Record<string, string>>({});

  const isLocalEnvironment = import.meta.env.DEV;

  const {
    formData,
    currentStep,
    setCurrentStep,
    updateField,
    updateRequerente,
    addRequerente,
    removeRequerente,
    resetForm,
    fillDemoData,
  } = useLocalStorageForm();

  const isAssessor = formData.tipoUsuario === "assessor";

  const steps = useMemo(
    () => [
      { label: "Tipo", key: "tipo", icon: User },
      ...(isAssessor ? [{ label: "Assessor", key: "assessor", icon: Briefcase }] : []),
      { label: "Titular", key: "titular", icon: User },
      { label: "Requerentes", key: "requerentes", icon: Users },
      { label: "Observações", key: "observacoes", icon: StickyNote },
      { label: "Revisão", key: "revisao", icon: CheckCircle },
      { label: "Sucesso", key: "sucesso", icon: CheckCircle },
    ],
    [isAssessor]
  );

  const totalSteps = steps.length;
  const currentKey = steps[currentStep]?.key;
  const isSuccessStep = currentKey === "sucesso";

  const canGoNext = () => {
    // Step-specific validation
    if (currentKey === "tipo") {
      return formData.tipoUsuario !== "" && formData.servicoSelecionado !== "";
    }
    if (currentKey === "assessor") {
      const allFilled = formData.assessorNome?.trim() && formData.assessorEmail?.trim() && formData.assessorTelefone?.trim();
      return !!allFilled && Object.keys(assessorErrors).length === 0;
    }
    // TODO: Add validations for other steps
    return true;
  };

  const handleEditStep = useCallback((step: number) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const resultado = await salvarAgendamento(formData);
      
      if (resultado.success) {
        console.log('Agendamento salvo com sucesso:', resultado.data);
        
        if (resultado.jsoncUrl) {
          console.log('JSONC salvo no Storage:', resultado.jsoncUrl);
        } else if (resultado.jsoncError) {
          console.warn('Erro ao salvar JSONC:', resultado.jsoncError);
        }
        
        setCurrentStep(totalSteps - 1);
        
        localStorage.removeItem("agendamento-draft");
        localStorage.removeItem("agendamento-draft-step");
      } else {
        console.error('Erro ao salvar agendamento:', resultado.error);
        alert('Erro ao salvar agendamento: ' + resultado.error);
        setCurrentStep(totalSteps - 1);
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('Erro ao enviar formulário. Por favor, tente novamente.');
      setIsSubmitting(false);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, totalSteps]);

  const validateAssessorField = (field: string) => {
    setAssessorErrors((prev) => {
      const next = { ...prev };

      if (field === "assessorNome") {
        const error = validateRequired(formData.assessorNome || "", "nome");
        if (error) next.assessorNome = error;
        else delete next.assessorNome;
      }

      if (field === "assessorEmail") {
        const error = validateEmail(formData.assessorEmail || "");
        if (error) next.assessorEmail = error;
        else delete next.assessorEmail;
      }

      if (field === "assessorTelefone") {
        const error = validatePhone(formData.assessorTelefone || "");
        if (error) next.assessorTelefone = error;
        else delete next.assessorTelefone;
      }

      return next;
    });
  };

  const clearAssessorError = (field: string) => {
    setAssessorErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleNext = () => {
    if (currentKey === "revisao") {
      handleSubmit();
    } else if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const renderStep = () => {
    switch (currentKey) {
      case "tipo":
        return (
          <StepTipoUsuario
            value={formData.tipoUsuario}
            onChange={(v) => updateField("tipoUsuario", v)}
            servicoSelecionado={formData.servicoSelecionado}
            onServicoChange={(v) => updateField("servicoSelecionado", v)}
          />
        );
      case "assessor":
        return (
          <StepDadosAssessor
            formData={formData}
            updateField={updateField}
            errors={assessorErrors}
            onClearError={clearAssessorError}
            onValidateField={validateAssessorField}
          />
        );
      case "titular":
        return (
          <StepDadosTitular
            nome={formData.clienteNome}
            pdfFile={formData.clientePdfFile}
            pdfFileObject={formData.clientePdfFileObject}
            email={formData.prenotamiEmail}
            senha={formData.prenotamiSenha}
            cep={formData.titularCep}
            logradouro={formData.titularLogradouro}
            numero={formData.titularNumero}
            bairro={formData.titularBairro}
            cidade={formData.titularCidade}
            estado={formData.titularEstado}
            complemento={formData.titularComplemento}
            estadoCivil={formData.titularEstadoCivil}
            documentoIdentidade={formData.titularDocumentoIdentidade}
            documentoIdentidadeFile={formData.titularDocumentoIdentidadeFile}
            altura={formData.prenotamiAltura}
            corOlhos={formData.prenotamiCorOlhos}
            updateField={updateField}
            servicoSelecionado={formData.servicoSelecionado}
          />
        );
      case "requerentes":
        return (
          <StepRequerentesAdicionais
            requerentes={formData.requerentes}
            updateRequerente={updateRequerente}
            addRequerente={addRequerente}
            removeRequerente={removeRequerente}
            servicoSelecionado={formData.servicoSelecionado}
          />
        );
      case "observacoes":
        return (
          <StepObservacoes
            value={formData.observacoes}
            onChange={(v) => updateField("observacoes", v)}
            datasRestricao={formData.datasRestricao}
            onChangeDatasRestricao={(dates) => updateField("datasRestricao", dates)}
          />
        );
      case "revisao": {
        const stepIndices = {
          tipo: 0,
          assessor: isAssessor ? 1 : undefined,
          titular: isAssessor ? 2 : 1,
          requerentes: isAssessor ? 3 : 2,
          observacoes: isAssessor ? 4 : 3,
        };
        return (
          <StepRevisaoConfirmacao
            formData={formData}
            onEditStep={handleEditStep}
            isSubmitting={isSubmitting}
            onConfirm={handleSubmit}
            updateField={updateField}
            stepIndices={stepIndices}
          />
        );
      }
      case "sucesso":
        return <StepSucesso onReset={resetForm} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="gradient-hero pb-12 md:pb-16">
        <div className="italian-stripe"></div>

        <div className="section-container relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground leading-tight mb-4 pt-8">
              Solicitação de <span className="italic">Agendamento</span>
            </h1>

            <p className="text-base md:text-lg text-primary-foreground/80 max-w-2xl mx-auto mb-4">
              Preencha as informações abaixo para solicitar seu agendamento no Prenotami
            </p>

            {isLocalEnvironment && !isSuccessStep && (
              <Button
                onClick={() => fillDemoData(false)}
                variant="secondary"
                className="gap-2 text-sm"
              >
                <Play className="h-4 w-4" />
                Modo Demo - Preencher Formulário
              </Button>
            )}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full"
            preserveAspectRatio="none"
          >
            <path
              d="M0 120L60 110C120 100 240 80 360 75C480 70 600 80 720 85C840 90 960 90 1080 85C1200 80 1320 70 1380 65L1440 60V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              fill="hsl(0, 0%, 98%)"
            />
          </svg>
        </div>
      </div>

      <div className="section-container relative z-10 -mt-8">
        <div className="max-w-3xl mx-auto">
          {!isSuccessStep && (
            <div className="mb-8 overflow-x-auto pb-4">
              <div className="flex items-start justify-between min-w-max md:min-w-0 gap-2">
                {steps.slice(0, -1).map((step, index) => (
                  <StepIndicator
                    key={step.key}
                    icon={step.icon}
                    label={step.label}
                    active={index === currentStep}
                    completed={index < currentStep}
                    isLast={index === steps.length - 2}
                  />
                ))}
              </div>
            </div>
          )}

          <Card className="card-elevated border-0 shadow-xl">
            <CardContent className="p-6 md:p-8 lg:p-10">
              <div className="animate-slide-in" key={currentStep}>
                {renderStep()}
              </div>
            </CardContent>
          </Card>

          {!isSuccessStep && (
            <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="gap-2 w-full sm:w-auto"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
              )}
              {currentKey !== "revisao" && (
                <Button
                  onClick={handleNext}
                  disabled={!canGoNext()}
                  className="gap-2 w-full sm:w-auto"
                  style={{ marginLeft: currentStep === 0 ? 'auto' : undefined }}
                >
                  Próximo
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="py-12 md:py-16"></div>
    </div>
  );
};

export default Agendamento;