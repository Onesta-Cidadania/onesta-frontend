import { ArrowRight, FileText, LogOut, MapPin, RefreshCw } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuthenticatedActivity } from "@/hooks/use-authenticated-activity";
import { useAuth } from "@/hooks/use-auth";

const Agendamentos = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  useAuthenticatedActivity();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const options = [
    {
      id: 1,
      title: "São Paulo - Primeiro Passaporte",
      description: "Para quem está solicitando o primeiro passaporte",
      icon: FileText,
      url: "https://forms.gle/qzmEkL5VYaDG1EpJ9",
      color: "from-blue-900 to-blue-800"
    },
    {
      id: 2,
      title: "São Paulo - Renovação de Passaporte",
      description: "Para quem já possui o passaporte vencido/a vencer",
      icon: RefreshCw,
      url: "https://forms.gle/PEqtN7nv4DbNNmcN6",
      color: "from-green-600 to-green-700"
    },
    {
      id: 3,
      title: "Curitiba e Florianópolis - Passaporte",
      description: "Atendimento para o Paraná e Santa Catarina",
      icon: MapPin,
      url: "https://forms.gle/uNoBF2uksbcAxt5w9",
      color: "from-red-700 to-red-800"
    },
    {
      id: 4,
      title: "Passaporte Ribeirão Preto - Cuiabá - Porto Velho",
      description: "Atendimento para Ribeirão Preto, Cuiabá e Porto Velho",
      icon: MapPin,
      url: "https://forms.gle/S32mkimbuXZ71acz7",
      color: "from-purple-700 to-purple-800"
    },
    {
      id: 5,
      title: "Agendamento de Filhos Menores - Benefício de Lei - SP",
      description: "Para filhos menores de idade - Benefício de Lei em São Paulo",
      icon: FileText,
      url: "https://forms.gle/JzMgHRcyBpcgy3zL9",
      color: "from-orange-600 to-orange-700"
    },
    {
      id: 6,
      title: "Agendamento de Filhos Menores - Benefício de Lei - Curitiba",
      description: "Para filhos menores de idade - Benefício de Lei em Curitiba",
      icon: FileText,
      url: "https://forms.gle/WXYHHc8udJnT77nn7",
      color: "from-teal-600 to-teal-700"
    }
  ];

  const handleCardClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-section">
      {/* Italian Stripe */}
      <div className="italian-stripe w-full" />

      <header className="border-b border-border bg-background/95 backdrop-blur-md">
        <div className="section-container flex h-16 items-center justify-between">
          <a href="/" className="flex items-center gap-3" aria-label="Onestà Cidadania Italiana - Página Inicial">
            <span className="font-serif text-xl md:text-2xl font-semibold text-foreground">
              Onestà
            </span>
            <span className="hidden sm:inline text-muted-foreground text-sm">
              Cidadania Italiana
            </span>
          </a>

          <Button type="button" variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </header>
      
      <div className="section-container py-16 md:py-24">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-up">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="text-gradient">Agendamentos</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Selecione a opção que melhor se adequa à sua necessidade para preencher o formulário de agendamento
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {options.map((option, index) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                onClick={() => handleCardClick(option.url)}
                className="group relative bg-white rounded-2xl p-8 text-left card-elevated animate-fade-up hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Icon Container */}
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${option.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>

                {/* Content */}
                <h2 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors duration-300">
                  {option.title}
                </h2>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {option.description}
                </p>

                {/* CTA */}
                <button className="w-full mt-4 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-all duration-300 flex items-center justify-center gap-2 group-hover:shadow-lg">
                  <span>Acessar formulário</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </button>

                {/* Hover border effect */}
                <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-primary/20 transition-colors duration-300 pointer-events-none" />
              </button>
            );
          })}
        </div>

        {/* Info Box */}
        <div className="mt-16 p-6 bg-white rounded-xl card-elevated max-w-3xl mx-auto animate-fade-up" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Informações importantes</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                Ao clicar em uma das opções acima, você será redirecionado para o Google Forms oficial.
                Certifique-se de ter todos os documentos necessários em mãos antes de preencher o formulário.
                Os formulários são seguros e gerenciados pelo Google.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Agendamentos;
