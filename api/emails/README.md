# 📧 Sistema de Email - Onesta

Este sistema envia emails de notificação quando usuários não-admin alteram o status de clientes.

## 🏗️ Arquitetura

O sistema usa **duas abordagens** diferentes para desenvolvimento e produção:

### Desenvolvimento (Local)
- **Servidor Express** (`server.js`)
- URL: `http://localhost:3001`
- Endpoint: `http://localhost:3001/api/emails/status-change`
- Usa rotas de: `lib/emails/routes/statusChangeRoutes.js`
- Usa template de: `lib/emails/templates/statusChangeTemplate.js`

### Produção (Vercel)
- **Serverless Function** (`api/emails/status-change.js`)
- URL: `https://seu-projeto.vercel.app/api/emails/status-change`
- Funciona automaticamente com o deploy do frontend
- Código inline (não importa módulos externos)

## 🔧 Configuração

### 1. Variáveis de Ambiente (.env.local)

```bash
# Configurações do Gmail SMTP
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu-email@gmail.com
EMAIL_PASSWORD=sua-app-password
EMAIL_DESTINO=destino@exemplo.com
```

> ℹ️ **Sobre o remetente (From):** Não é necessário configurar `EMAIL_FROM`.
> O sistema aplica automaticamente o nome de exibição **"Onesta"** ao email de
> `EMAIL_USER` (ex.: `Onesta <seu-email@gmail.com>`).

### 2. Obter App Password do Gmail

**IMPORTANTE:** NÃO use sua senha normal do Gmail!

#### Passo 1: Ativar 2-Factor Authentication (2FA)

1. Acesse: https://myaccount.google.com/security
2. Em "Sign in to Google", clique em **2-Step Verification**
3. Siga as instruções para ativar a autenticação em duas etapas
4. É obrigatório ter 2FA ativa para criar App Password

#### Passo 2: Gerar App Password

1. Acesse: https://myaccount.google.com/apppasswords
2. Faça login se necessário
3. Em "Select app", escolha: **Mail** ou "Outro (nome personalizado)"
4. Em "Select device", escolha: **Windows Computer** (ou outro)
5. Clique em **GENERATE**
6. Copie a senha de 16 caracteres (ex: `wqbb jiip mizx dffu`)
7. Cole no `.env.local`: `EMAIL_PASSWORD=wqbb_jiip_mizx_dffu`

⚠️ **A senha só aparece UMA vez!** Salve-a em local seguro.

#### Passo 3: Configurar

No arquivo `.env.local`:

```bash
EMAIL_PASSWORD=sua_senha_copiada_aqui
```

Espaços podem ser substituídos por `_` ou mantidos, o sistema funciona ambos os jeitos.

## 🚀 Como Funciona

### Detecção Automática de Ambiente

O frontend detecta automaticamente se está em produção ou desenvolvimento:

```typescript
// Em customer.service.ts
const apiBaseUrl = import.meta.env.MODE === 'production'
  ? '/api'                                    // Produção: path relativo
  : 'http://localhost:3001/api';               // Desenvolvimento: localhost
```

**Produção (Vercel):**
- Frontend: `https://seu-projeto.vercel.app`
- API Email: `https://seu-projeto.vercel.app/api/emails/status-change`
- Usa `/api` (path relativo, mesmo domínio)

**Desenvolvimento (Local):**
- Frontend: `http://localhost:5173` (Vite)
- API Email: `http://localhost:3001/api/emails/status-change`
- Usa URL completa do servidor local

### Quando é Enviado?

O email é enviado quando:
1. ✅ Um usuário NÃO-Admin altera o status de um cliente
2. ✅ O status anterior e o novo status são diferentes
3. ✅ As credenciais de email estão configuradas

O email NÃO é enviado quando:
1. ❌ Um usuário Admin altera o status
2. ❌ As credenciais de email não estão configuradas

## 📋 Payload da Requisição

```json
{
  "customerName": "João Silva",
  "customerCode": "CLI-001",
  "customerEmail": "joao.silva@exemplo.com",
  "previousStatus": "EM_ANALISE",
  "newStatus": "EM_ANDAMENTO",
  "userEmail": "partner@onestacidania.com.br",
  "userRole": "partner"
}
```

## 🎨 Template de Email

O email enviado inclui:
- **Header Onesta** com logo e faixa italiana
- **Dados do cliente** (nome, código, email)
- **Mudança de status** visual (layout horizontal com cores)
- **Responsável pela alteração** (tipo e email)
- **Data e hora** da alteração
- **Footer Onesta** com branding

### Cores dos Status

| Status | Background | Texto | Borda |
|--------|------------|-------|-------|
| EM_ANALISE | #FFF3CD | #856404 | #FFC107 |
| AGUARDANDO_CORRECAO | #F8D7DA | #721C24 | #DC3545 |
| EM_ANDAMENTO | #D1ECF1 | #0C5460 | #03084C |
| PAUSADO | #F8D7DA | #721C24 | #DC3545 |
| CANCELADO | #F8F9FA | #383D41 | #6C757D |
| AGENDADO | #D4EDDA | #155724 | #315E33 |

## 🚀 Deploy na Vercel

### 1. Deploy Automático

O sistema de email é deployado automaticamente com o frontend:

```bash
# Push para GitHub
git add .
git commit -m "feat: sistema de email de notificação"
git push origin main

# Deploy automático pela Vercel
vercel --prod
```

### 2. Configurar Variáveis de Ambiente na Vercel

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **Environment Variables**
4. Adicione as seguintes variáveis:

```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu-email@gmail.com
EMAIL_PASSWORD=sua-app-password
EMAIL_DESTINO=destino@exemplo.com
```

> ℹ️ Não configure `EMAIL_FROM`: o nome "Onesta" é aplicado automaticamente
> a partir de `EMAIL_USER`.

5. Clique em **Save**
6. Re-deploy o projeto: `vercel --prod`

### 3. Verificar Deploy

Após o deploy, acesse:
- Frontend: `https://seu-projeto.vercel.app`
- API Email: `https://seu-projeto.vercel.app/api/emails/status-change`

Teste com:
```bash
curl -X POST https://seu-projeto.vercel.app/api/emails/status-change \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Teste",
    "customerCode": "TEST-001",
    "customerEmail": "teste@exemplo.com",
    "previousStatus": "EM_ANALISE",
    "newStatus": "EM_ANDAMENTO",
    "userEmail": "partner@exemplo.com",
    "userRole": "partner"
  }'
```

## 🧪 Desenvolvimento Local

### 1. Iniciar o Servidor de Email

```bash
# Instalar dependências (se necessário)
npm install

# Iniciar o servidor
npm run server
```

O servidor rodará em: `http://localhost:3001`

### 2. Iniciar o Frontend

```bash
# Em outro terminal
npm run dev
```

O frontend rodará em: `http://localhost:5173`

### 3. Testar

1. Faça login como **Partner** (não Admin)
2. Acesse "Consulta de Clientes"
3. Altere o status de um cliente
4. Verifique o email recebido

## 📁 Estrutura de Arquivos

```
onest-landing-page/
├── api/
│   └── emails/
│       ├── status-change.js          # Serverless Function (Vercel) - ÚNICA function!
│       └── README.md                 # Este arquivo
├── lib/
│   └── emails/
│       ├── routes/
│       │   └── statusChangeRoutes.js # Rotas Express (desenvolvimento local)
│       └── templates/
│           └── statusChangeTemplate.js # Template HTML do email
├── server.js                         # Servidor Express (desenvolvimento local)
├── src/
│   └── services/
│       └── customer.service.ts       # Lógica de chamada da API
└── .env.local                        # Variáveis de ambiente
```

**Nota Importante:**
- ✅ Apenas `api/emails/status-change.js` é uma Serverless Function (Vercel)
- ✅ Arquivos em `lib/emails/` são módulos auxiliares (não são functions)
- ✅ Isso garante que apenas UMA function apareça no painel da Vercel

## 🔍 Troubleshooting

### Email não chega

1. **Verifique as credenciais:**
   ```bash
   # Certifique-se de que EMAIL_PASSWORD está correto
   EMAIL_PASSWORD=sua-app-password
   ```

2. **Verifique se é Admin:**
   - Emails NÃO são enviados quando Admin altera o status
   - Teste com um usuário Partner

3. **Verifique o console:**
   ```bash
   # No terminal do servidor
   📧 Enviando email de alteração de status: João Silva
   ✅ Email enviado com sucesso: <message-id>
   ```

### Erro: "Self-signed certificate"

No `.env.local`, adicione:
```bash
NODE_TLS_REJECT_UNAUTHORIZED=0
```

### Erro: "Invalid login"

- Verifique se o EMAIL_USER está correto
- Verifique se a App Password foi copiada corretamente
- Certifique-se de que o 2FA está ativado na conta Google

## 📞 Suporte

Para dúvidas ou problemas:
- Verifique o console do navegador e do servidor
- Consulte a documentação do Supabase: https://supabase.com/docs
- Consulte a documentação do Nodemailer: https://nodemailer.com/

## 📝 Notas

- ✅ O sistema funciona automaticamente em produção (Vercel)
- ✅ Em desenvolvimento, o servidor `server.js` deve estar rodando
- ✅ Erros no envio de email NÃO interrompem o fluxo principal
- ✅ O template é compatível com Gmail, Outlook, Apple Mail, etc.
- ✅ Usa tabelas HTML puras para máxima compatibilidade