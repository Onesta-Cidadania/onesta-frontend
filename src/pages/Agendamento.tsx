import { useMemo, useState, useCallback } from "react";
import { useLocalStorageForm } from "@/hooks/useLocalStorageForm";
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
} from "lucide-react";

import StepTipoUsuario from "@/components/agendamento/StepTipoUsuario";
import StepDadosAssessor from "@/components/agendamento/StepDadosAssessor";
import StepDadosTitular from "@/components/agendamento/StepDadosTitular";
import StepRequerentesAdicionais from "@/components/agendamento/StepRequerentesAdicionais";
import StepObservacoes from "@/components/agendamento/StepObservacoes";
import StepRevisaoConfirmacao from "@/components/agendamento/StepRevisaoConfirmacao";
import StepSucesso from "@/components/agendamento/StepSucesso";
import StepIndicator from "@/components/agendamento/StepIndicator";

const Agendamento = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    formData,
    currentStep,
    setCurrentStep,
    updateField,
    updateRequerente,
    addRequerente,
    removeRequerente,
    resetForm,
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
    // TODO: Temporarily disabled for testing
    return true;

    // switch (currentKey) {
    //   case "tipo":
    //     return formData.tipoUsuario !== "";
    //   case "assessor":
    //   case "assessor":
    //     return !!(
    //       formData.assessorEmail &&
    //       formData.assessorNome &&
    //       formData.assessorTelefone
    //     );
    //   case "titular":
    //     return !!(
    //       formData.clienteNome &&
    //       formData.clientePdfFile &&
    //       formData.prenotamiEmail &&
    //       formData.prenotamiSenha &&
    //       formData.titularCep &&
    //       formData.titularEstadoCivil &&
    //       formData.titularDocumentoIdentidade &&
    //       formData.prenotamiAltura &&
    //       formData.prenotamiCorOlhos
    //     );
    //   case "requerentes": {
    //     // All added requerentes must have complete fields
    //     for (let i = 0; i < formData.requerentes.length; i++) {
    //       const r = formData.requerentes[i];
    //       if (
    //         !r?.nomeCompleto ||
    //         !r?.dataNascimento ||
    //         !r?.altura ||
    //         !r?.corOlhos ||
    //         !r?.documentoIdentidade
    //       ) {
    //         return false;
    //       }
    //     }
    //     return true;
    //   }
    //   case "datas":
    //     return true; // Optional - always allow next
    //   case "observacoes":
    //     return true; // Optional - always allow next
    //   case "revisao":
    //     return formData.revisaoConfirmado === true;
    //   default:
    //     return true;
    // }
  };

  const handleEditStep = useCallback((step: number) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      // TODO: Implement actual submission logic
      // await submitForm(formData);

      // For now, just move to success step
      setTimeout(() => {
        setCurrentStep(totalSteps - 1);
        setIsSubmitting(false);
      }, 1000);
    } catch (error) {
      console.error('Submit error:', error);
      setIsSubmitting(false);
    }
  }, [formData, totalSteps]);

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
          />
        );
      case "assessor":
        return <StepDadosAssessor formData={formData} updateField={updateField} />;
      case "titular":
        return (
          <StepDadosTitular
            nome={formData.clienteNome}
            pdfFile={formData.clientePdfFile}
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
            altura={formData.prenotamiAltura}
            corOlhos={formData.prenotamiCorOlhos}
            updateField={updateField}
          />
        );
      case "requerentes":
        return (
          <StepRequerentesAdicionais
            requerentes={formData.requerentes}
            updateRequerente={updateRequerente}
            addRequerente={addRequerente}
            removeRequerente={removeRequerente}
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
      case "revisao":
        // Calculate step indices for edit buttons
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
      case "sucesso":
        return <StepSucesso onReset={resetForm} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <div className="gradient-hero pb-12 md:pb-16">
        {/* Italian Stripe */}
        <div className="italian-stripe"></div>

        <div className="section-container relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Title */}
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground leading-tight mb-4 pt-8">
              Solicitação de <span className="italic">Agendamento</span>
            </h1>

            {/* Description */}
            <p className="text-base md:text-lg text-primary-foreground/80 max-w-2xl mx-auto">
              Preencha as informações abaixo para solicitar seu agendamento no Prenotami
            </p>
          </div>
        </div>

        {/* Bottom Wave */}
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

      {/* Main Content */}
      <div className="section-container relative z-10 -mt-8">
        <div className="max-w-3xl mx-auto">
          {/* Stepper - Only show if not success step */}
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

          {/* Card */}
          <Card className="card-elevated border-0 shadow-xl">
            <CardContent className="p-6 md:p-8 lg:p-10">
              <div className="animate-slide-in" key={currentStep}>
                {renderStep()}
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          {!isSuccessStep && (
            <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8">
              {/* Hide back button on first step */}
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
              {/* Hide next button on revisao step */}
              {currentKey !== "revisao" && (
                <Button
                  onClick={handleNext}
                  disabled={!canGoNext()}
                  className="gap-2 w-full sm:w-auto"
                  {...(currentStep === 0 ? {} : {})}
                  style={{ marginLeft: currentStep === 0 ? 'auto' : undefined }}
                >
                  <>
                    Próximo
                    <ArrowRight className="h-4 w-4" />
                  </>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Spacer for bottom */}
      <div className="py-12 md:py-16"></div>
    </div>
  );
};

export default Agendamento;
