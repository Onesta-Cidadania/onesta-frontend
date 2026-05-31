import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const targetId = href.replace("#", "");
    const targetElement = document.getElementById(targetId);

    if (targetElement) {
      const headerOffset = 80; // Altura do header fixo
      const elementPosition = targetElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });

      // Atualizar URL sem causar scroll
      window.history.pushState(null, "", href);
    }

    // Fechar menu mobile se estiver aberto
    setIsMenuOpen(false);
  };

  const navLinks = [
    { href: "#sobre", label: "Sobre" },
    { href: "#servicos", label: "Serviços" },
    { href: "#parcerias", label: "Parcerias" },
    { href: "#numeros", label: "Nossos Números" },
    { href: "#clientes", label: "Clientes" },
    { href: "#contato", label: "Contato" },
    { href: "#faq", label: "FAQ" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="italian-stripe" />
      <div className="section-container">
        <div className="flex items-center justify-between h-14 md:h-16">
          {/* Logo */}
          <a 
            href="#" 
            className="flex items-center gap-3"
            aria-label="Onestà Cidadania Italiana - Página Inicial"
          >
            <span className="font-serif text-xl md:text-2xl font-semibold text-foreground">
              Onestà
            </span>
            <span className="hidden lg:inline text-muted-foreground text-sm font-sans">
              Cidadania Italiana
            </span>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-8" aria-label="Navegação principal">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleScroll(e, link.href)}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
                aria-label={`Ir para seção ${link.label}`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* CTA Button */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="cta" size="default" asChild>
              <a 
                href="#contato" 
                onClick={(e) => handleScroll(e, "#contato")}
                aria-label="Entrar em contato conosco"
              >
                Fale Conosco
              </a>
            </Button>
            <Button variant="default" size="default" asChild>
              <a href="/login" aria-label="Acessar login">
                Login
              </a>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Fechar menu de navegação" : "Abrir menu de navegação"}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-foreground" />
            ) : (
              <Menu className="w-6 h-6 text-foreground" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border animate-fade-in" aria-label="Menu de navegação mobile">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 py-2"
                  onClick={(e) => handleScroll(e, link.href)}
                  aria-label={`Ir para seção ${link.label}`}
                >
                  {link.label}
                </a>
              ))}
              <Button variant="cta" size="lg" className="mt-2" asChild>
                <a 
                  href="#contato" 
                  onClick={(e) => handleScroll(e, "#contato")}
                  aria-label="Entrar em contato conosco"
                >
                  Fale Conosco
                </a>
              </Button>
              <Button variant="default" size="lg" asChild>
                <a href="/login" aria-label="Acessar login">
                  Login
                </a>
              </Button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
