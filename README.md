# Onest Landing Page

Uma landing page moderna e responsiva desenvolvida para apresentar os serviços e produtos da Onest.

## Sobre o Projeto

Este projeto é uma landing page completa construída com tecnologias modernas de front-end, oferecendo uma experiência de usuário otimizada e uma interface elegante.

## Tecnologias Utilizadas

### Frontend Core
- **React 18.3** - Biblioteca JavaScript para construção de interfaces de usuário
- **TypeScript 5.8** - Superset tipado do JavaScript para maior segurança no código
- **Vite 5.4** - Build tool moderno e rápido para desenvolvimento
- **React Router DOM 6.30** - Roteamento para aplicações React

### Estilização e UI
- **Tailwind CSS 3.4** - Framework CSS utilitário para estilização rápida
- **shadcn/ui** - Biblioteca de componentes reutilizáveis baseada em Radix UI
- **Radix UI** - Componentes primitivos acessíveis e não estilizados
  - Accordion, Alert Dialog, Avatar, Checkbox, Collapsible, Dialog
  - Dropdown Menu, Hover Card, Label, Menubar, Navigation Menu
  - Popover, Progress, Radio Group, Scroll Area, Select, Separator
  - Slider, Switch, Tabs, Toast, Toggle, Toggle Group, Tooltip
- **Lucide React** - Biblioteca de ícones
- **next-themes** - Gerenciamento de temas (dark/light mode)
- **tailwindcss-animate** - Animações para Tailwind CSS

### Gerenciamento de Estado e Dados
- **TanStack React Query 5.83** - Gerenciamento de estado assíncrono e cache de dados
- **Supabase JS 2.97** - Cliente para integração com Supabase (backend-as-a-service)

### Formulários e Validação
- **React Hook Form 7.61** - Gerenciamento de formulários com performance otimizada
- **Zod 3.25** - Validação de schemas TypeScript-first
- **@hookform/resolvers** - Integração entre React Hook Form e Zod

### Utilitários e Componentes Adicionais
- **class-variance-authority** - Gerenciamento de variantes de classes CSS
- **clsx** - Utilitário para construção condicional de classNames
- **tailwind-merge** - Merge inteligente de classes Tailwind
- **date-fns** - Biblioteca moderna para manipulação de datas
- **cmdk** - Componente de menu de comandos (Command Menu)
- **embla-carousel-react** - Carrossel de imagens otimizado
- **input-otp** - Componente de input OTP (One-Time Password)
- **react-resizable-panels** - Painéis redimensionáveis
- **recharts** - Biblioteca para gráficos e visualizações
- **sonner** - Componente de toast notifications
- **vaul** - Componente de drawer

### Desenvolvimento
- **ESLint 9.32** - Linting de código JavaScript/TypeScript
- **PostCSS 8.5** - Processador de CSS
- **Autoprefixer 10.4** - Adiciona vendor prefixes automaticamente

## Estrutura do Projeto

```
src/
├── components/
│   ├── ui/              # Componentes shadcn/ui reutilizáveis
│   ├── About.tsx        # Seção Sobre
│   ├── Contact.tsx      # Seção de Contato
│   ├── Consultancy.tsx  # Seção de Consultoria
│   ├── FAQ.tsx          # Perguntas Frequentes
│   ├── Footer.tsx       # Rodapé
│   ├── Header.tsx       # Cabeçalho/Navegação
│   ├── Hero.tsx         # Seção Hero principal
│   ├── Locations.tsx    # Seção de Localizações
│   ├── Partners.tsx     # Seção de Parceiros
│   ├── Services.tsx     # Seção de Serviços
│   ├── Stats.tsx        # Estatísticas da empresa
│   └── Testimonials.tsx # Depoimentos de clientes
├── hooks/
│   ├── use-mobile.tsx   # Hook para detectar dispositivos móveis
│   ├── use-supabase.ts  # Hook para integração Supabase
│   └── use-toast.ts     # Hook para notificações toast
├── lib/
│   ├── supabase/        # Configuração e tipos do Supabase
│   └── utils.ts         # Funções utilitárias
├── pages/
│   ├── Index.tsx        # Página principal
│   └── NotFound.tsx     # Página 404
├── services/
│   └── base.service.ts  # Serviço base para API
└── main.tsx             # Entry point da aplicação
```

## Scripts Disponíveis

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build

# Build para desenvolvimento
npm run build:dev

# Lint do código
npm run lint

# Preview do build de produção
npm run preview
```

## Configuração do Supabase

Este projeto utiliza Supabase para backend. Configure as variáveis de ambiente:

```env
VITE_SUPABASE_URL=sua-url-do-supabase
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
```

## Como Editar

### Via Lovable

Acesse o [Lovable Project](https://lovable.dev/projects/66711af2-55e4-4d51-8943-0beddcf71bf0) e faça alterações através de prompts em linguagem natural.

### Via IDE Local

1. Clone o repositório
2. Instale as dependências: `npm install`
3. Inicie o desenvolvimento: `npm run dev`

## Deploy

### Via Lovable

Abra o projeto no [Lovable](https://lovable.dev/projects/66711af2-55e4-4d51-8943-0beddcf71bf0) e clique em Share → Publish.

### Domínio Personalizado

Sim, é possível conectar um domínio personalizado:

1. Navegue para Project → Settings → Domains
2. Clique em Connect Domain
3. Siga as instruções

Mais informações em: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Requisitos

- Node.js (recomendado usar [nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- npm (vem com Node.js)

## Licença

Este projeto foi gerado com [Lovable](https://lovable.dev).
