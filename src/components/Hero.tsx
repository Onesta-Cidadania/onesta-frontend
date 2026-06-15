import { ArrowRight, Shield, Award, Users } from "lucide-react";

import { useTotalAccumulated } from "@/hooks/use-supabase";

import { Button } from "./ui/button";

const Hero = () => {
  // Função auxiliar para arredondar para baixo até a próxima centena
  const roundDownToHundred = (num: number): number => {
    return Math.floor(num / 100) * 100;
  };

  // Buscar dados do Supabase
  const { data: totalClientes, error } = useTotalAccumulated();

  // Lógica de display com fallback de 600
  const clientesDisplay = (() => {
    if (error || !totalClientes) return 1000; // Fallback em caso de erro
    return roundDownToHundred(totalClientes); // Arredonda para baixo (ex: 680 -> 600)
  })();

  return (
    <section className="relative gradient-hero overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_80%,_hsl(0_0%_98%_/_0.1)_0%,_transparent_50%)]" />
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_20%,_hsl(0_0%_98%_/_0.1)_0%,_transparent_50%)]" />
      </div>

      <div className="section-container relative z-10 pt-32 pb-20 md:pt-30 md:pb-32">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}

          {/* Headline */}
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-primary-foreground leading-tight mb-6 animate-fade-up opacity-0 delay-100">
            Realize o Sonho da{" "}
            <span className="italic">Cidadania Italiana</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-up opacity-0 delay-200">
            Assessoria completa e personalizada para sua cidadania italiana, com
            segurança, transparência e acompanhamento em todas as etapas.
            Atuamos nos processos via Consulado ou Judicial, além de serviços
            essenciais como agendamento no Prenotami, traduções e AIRE.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-up opacity-0 delay-300">
            <Button variant="hero" size="xl" asChild>
              <a href="#contato">
                Entrar em Contato
                <ArrowRight className="w-5 h-5" />
              </a>
            </Button>
            <Button variant="heroOutline" size="xl" asChild>
              <a href="#servicos">Conhecer Serviços</a>
            </Button>
            <Button variant="heroOutline" size="xl" asChild>
              <a href="#parcerias">
                Sou Assessor
              </a>
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8 animate-fade-up opacity-0 delay-400">
            <div className="flex items-center justify-center gap-3 text-primary-foreground/90">
              <Award className="w-5 h-5" />
              <span className="text-sm font-medium">Desde 2024</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-primary-foreground/90">
              <Users className="w-5 h-5" />
              <span className="text-sm font-medium">
                +{clientesDisplay} Clientes Atendidos
              </span>
            </div>
            <div className="flex items-center justify-center gap-3 text-primary-foreground/90">
              <Shield className="w-5 h-5" />
              <span className="text-sm font-medium">Processo Seguro</span>
            </div>
          </div>
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
    </section>
  );
};

export default Hero;
