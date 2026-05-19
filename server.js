import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// ======================================================
// 1. MIDDLEWARES (A ORDEM IMPORTA!)
// ======================================================

// Segurança
app.use(helmet());
app.use(cors());

// Parser de JSON - DEVE VIR ANTES DAS ROTAS
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Log de debug (opcional, ajuda a ver o que chega)
app.use((req, res, next) => {
  console.log(`➔ Requisição recebida: ${req.method} ${req.url}`);
  // Uncomment abaixo para ver o body no console se precisar depurar
  // console.log('Body:', req.body); 
  next();
});

// ======================================================
// 2. CONFIGURAÇÃO DO EMAIL
// ======================================================

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  console.warn('⚠️  ALERTA: Credenciais de email não configuradas no .env');
}

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// ======================================================
// 3. FUNÇÕES AUXILIARES
// ======================================================

function gerarTxt(agendamento) {
  let txt = `AGENDAMENTO #${agendamento.codigo_agendamento}\n`;
  txt += `${'='.repeat(30)}\n\n`;
  
  // DADOS DO ASSESSOR (primeiro, se houver)
  if (agendamento.assessor_nome_completo && agendamento.assessor_nome_completo.trim() !== '') {
    txt += `DADOS DO ASSESSOR\n`;
    txt += `${'-'.repeat(20)}\n`;
    txt += `Nome: ${agendamento.assessor_nome_completo}\n`;
    txt += `Email: ${agendamento.assessor_email || 'Não informado'}\n`;
    txt += `Telefone: ${agendamento.assessor_telefone || 'Não informado'}\n\n`;
  }
  
  // DADOS DO CLIENTE
  txt += `DADOS DO CLIENTE\n`;
  txt += `${'-'.repeat(20)}\n`;
  txt += `Nome Completo: ${agendamento.titular_nome_completo}\n`;
  txt += `Email: ${agendamento.titular_email}\n`;
  txt += `Cor dos Olhos: ${agendamento.titular_cor_olhos}\n`;
  txt += `Altura: ${agendamento.titular_altura_cm} cm\n`;
  txt += `Endereço: ${agendamento.titular_endereco}\n`;
  txt += `Estado Civil: ${agendamento.titular_estado_civil}\n`;
  txt += `Qtd. Requerentes Adicionais: ${agendamento.requerentes_adicionais ? agendamento.requerentes_adicionais.length : 0}\n\n`;
  
  // DADOS DOS REQUERENTES ADICIONAIS (se houver)
  if (agendamento.requerentes_adicionais && agendamento.requerentes_adicionais.length > 0) {
    txt += `DADOS DOS REQUERENTES ADICIONAIS\n`;
    txt += `${'-'.repeat(30)}\n`;
    
    agendamento.requerentes_adicionais.forEach((requerente, index) => {
      txt += `\nRequerente #${index + 1}\n`;
      txt += `Nome Completo: ${requerente.nome_completo || 'Não informado'}\n`;
      txt += `Data de Nascimento: ${requerente.nascimento || 'Não informada'}\n`;
      txt += `Altura: ${requerente.altura_cm ? requerente.altura_cm + ' cm' : 'Não informada'}\n`;
      txt += `Cor dos Olhos: ${requerente.cor_olhos || 'Não informada'}\n`;
    });
    
    txt += `\n`;
  }
  
  // INFORMAÇÕES ADICIONAIS
  txt += `INFORMAÇÕES ADICIONAIS\n`;
  txt += `${'-'.repeat(30)}\n`;
  txt += `Observações: ${agendamento.anotacoes || 'Nenhuma'}\n`;
  txt += `Email OTP: ${agendamento.email_otp || 'Não informado'}\n`;
  txt += `Senha Email OTP: ${agendamento.senha_email_otp || 'Não informado'}\n`;
  txt += `Data Alvo: ${agendamento.data_alvo || 'Não informada'}\n`;
  
  // Períodos de Restrição (lista completa)
  if (agendamento.periodos_restricao_email && agendamento.periodos_restricao_email.length > 0) {
    txt += `PERÍODOS DE RESTRIÇÃO\n`;
    txt += `${'-'.repeat(25)}\n`;
    agendamento.periodos_restricao_email.forEach((periodo, index) => {
      txt += `${index + 1}. ${periodo.inicio} a ${periodo.fim}\n`;
    });
    txt += `\n`;
  } else {
    txt += `Período de Restrição: ${agendamento.data_inicio_restricao || 'N/A'} a ${agendamento.data_fim_restricao || 'N/A'}\n\n`;
  }
  
  // DATA DE CRIAÇÃO
  txt += `DATA DE CRIAÇÃO\n`;
  txt += `${'-'.repeat(20)}\n`;
  txt += `${agendamento.criado_em}\n\n`;
  
  txt += `Gerado automaticamente pelo sistema Onesta`;

  return txt;
}

async function baixarArquivo(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Falha ao baixar arquivo: ${response.statusText}`);
  return response.text();
}

function gerarCorpoEmail(agendamento) {
  return `Olá!

Um novo agendamento foi criado no sistema.

Código do Agendamento: ${agendamento.codigo_agendamento}
Nome do Cliente: ${agendamento.titular_nome_completo}
Data do Agendamento: ${new Date(agendamento.criado_em).toLocaleString('pt-BR')}

Em anexo seguem:
- Arquivo TXT com informações detalhadas do cliente e assessor
- Arquivo JSONC com todos os dados do formulário
- Arquivos PDF do formulário (identidade, comprovante de residência, etc.)

Atenciosamente,
Equipe Onesta`;
}

function gerarHTMLConfirmacaoCliente(agendamento) {
  const dataFormatada = new Date(agendamento.criado_em).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const nomePrimeiro = agendamento.titular_nome_completo.split(' ')[0];

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@400;500;600&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', Arial, sans-serif;
      background-color: #f5f5f5;
      color: #1F1F1E;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }
    
    .email-container {
      max-width: 650px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
    }
    
    /* Header com gradiente verde */
    .header {
      background: linear-gradient(135deg, #315E33 0%, #2a522b 100%);
      padding: 40px 30px;
      text-align: center;
      position: relative;
    }
    
    .header-logo {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 36px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: 2px;
      margin-bottom: 10px;
    }
    
    .header-subtitle {
      color: #ffffff;
      font-size: 14px;
      opacity: 0.9;
      letter-spacing: 1px;
    }
    
    /* Faixa italiana */
    .italian-stripe {
      height: 4px;
      background: linear-gradient(90deg, 
        #315E33 0%, 
        #315E33 33.33%, 
        #ffffff 33.33%, 
        #ffffff 66.66%, 
        #903339 66.66%, 
        #903339 100%
      );
    }
    
    /* Content */
    .content {
      padding: 40px 30px;
      background-color: #ffffff;
      text-align: center;
    }
    
    .success-icon {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #315E33 0%, #2a522b 100%);
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 25px;
      font-size: 40px;
      color: white;
    }
    
    .greeting {
      font-size: 24px;
      color: #1F1F1E;
      margin-bottom: 10px;
      font-weight: 600;
    }
    
    .message {
      font-size: 16px;
      color: #666666;
      margin-bottom: 30px;
      line-height: 1.8;
    }
    
    .code-badge {
      display: inline-block;
      background-color: #03084C;
      color: #ffffff;
      padding: 12px 30px;
      border-radius: 8px;
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 30px;
      letter-spacing: 1px;
    }
    
    .info-box {
      background-color: #FAFAF8;
      border-radius: 8px;
      padding: 25px;
      margin: 30px 0;
      border-left: 4px solid #315E33;
      text-align: left;
    }
    
    .info-box-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 16px;
      font-weight: 600;
      color: #315E33;
      margin-bottom: 15px;
    }
    
    .info-box p {
      font-size: 14px;
      color: #666666;
      line-height: 1.8;
      margin-bottom: 10px;
    }
    
    .info-box p:last-child {
      margin-bottom: 0;
    }
    
    /* Footer */
    .footer {
      background-color: #FAFAF8;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e5e5e5;
    }
    
    .footer-text {
      font-size: 13px;
      color: #666666;
      line-height: 1.8;
    }
    
    .footer-brand {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 18px;
      color: #315E33;
      margin-bottom: 10px;
    }
    
    .footer-divider {
      width: 50px;
      height: 2px;
      background: linear-gradient(90deg, #315E33 0%, #D4A574 100%);
      margin: 15px auto;
    }
    
    /* Responsive */
    @media only screen and (max-width: 600px) {
      .email-container {
        max-width: 100% !important;
        border-radius: 0 !important;
      }
      
      .header {
        padding: 30px 20px;
      }
      
      .content {
        padding: 30px 20px;
      }
      
      .greeting {
        font-size: 20px;
      }
      
      .code-badge {
        font-size: 16px;
        padding: 10px 20px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header -->
    <div class="header">
      <div class="header-logo">ONESTA</div>
      <div class="header-subtitle">SISTEMA DE AGENDAMENTO</div>
    </div>
    
    <!-- Faixa Italiana -->
    <div class="italian-stripe"></div>
    
    <!-- Content -->
    <div class="content">
      <div class="success-icon">✓</div>
      
      <p class="greeting">Olá, ${nomePrimeiro}!</p>
      
      <p class="message">
        Temos ótimas notícias! Seu agendamento para o passaporte italiano foi realizado <strong>com sucesso</strong>. 🎉
      </p>
      
      <div class="code-badge">
        Agendamento #${agendamento.codigo_agendamento}
      </div>
      
      <p class="message">
        Sua solicitação foi registrada em nosso sistema e nossa equipe já está trabalhando para processar seu agendamento.
      </p>
      
      <div class="info-box">
        <div class="info-box-title">📋 O que acontece agora?</div>
        <p>• Sua solicitação está sendo analisada por nossa equipe especializada</p>
        <p>• Você receberá atualizações sobre o andamento do seu processo</p>
        <p>• Se necessário, entraremos em contato por email ou telefone</p>
      </div>
      
      <p class="message" style="margin-top: 30px;">
        Agradecemos pela confiança em escolher a Onesta para esta jornada tão importante em busca da sua cidadania italiana. 🇮🇹
      </p>
    </div>
    
    <!-- Faixa Italiana -->
    <div class="italian-stripe"></div>
    
    <!-- Footer -->
    <div class="footer">
      <div class="footer-brand">ONESTA</div>
      <div class="footer-divider"></div>
      <p class="footer-text">
        Este email confirma o recebimento do seu agendamento.<br>
        Data de confirmação: ${dataFormatada}<br><br>
        Por favor, não responda a este email.
      </p>
    </div>
  </div>
</body>
</html>
`;
}

function gerarHTMLAgendamento(agendamento) {
  const dataFormatada = new Date(agendamento.criado_em).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const temAssessor = agendamento.assessor_nome_completo && agendamento.assessor_nome_completo.trim() !== '';

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Novo Agendamento - ${agendamento.titular_nome_completo}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@400;500;600&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', Arial, sans-serif;
      background-color: #f5f5f5;
      color: #1F1F1E;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }
    
    .email-container {
      max-width: 650px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
    }
    
    /* Header com gradiente verde */
    .header {
      background: linear-gradient(135deg, #315E33 0%, #2a522b 100%);
      padding: 40px 30px;
      text-align: center;
      position: relative;
    }
    
    .header-logo {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 36px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: 2px;
      margin-bottom: 10px;
    }
    
    .header-subtitle {
      color: #ffffff;
      font-size: 14px;
      opacity: 0.9;
      letter-spacing: 1px;
    }
    
    /* Faixa italiana */
    .italian-stripe {
      height: 4px;
      background: linear-gradient(90deg, 
        #315E33 0%, 
        #315E33 33.33%, 
        #ffffff 33.33%, 
        #ffffff 66.66%, 
        #903339 66.66%, 
        #903339 100%
      );
    }
    
    /* Content */
    .content {
      padding: 40px 30px;
      background-color: #ffffff;
    }
    
    .greeting {
      font-size: 18px;
      color: #1F1F1E;
      margin-bottom: 20px;
    }
    
    .greeting strong {
      font-weight: 600;
    }
    
    /* Agendamento Code Badge */
    .code-badge {
      display: inline-block;
      background-color: #03084C;
      color: #ffffff;
      padding: 8px 20px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 30px;
    }
    
    /* Section Card */
    .section-card {
      background-color: #FAFAF8;
      border-radius: 8px;
      padding: 25px;
      margin-bottom: 20px;
      border-left: 4px solid #315E33;
    }
    
    .section-card-assessor {
      border-left-color: #03084C;
    }
    
    .section-card-info {
      border-left-color: #D4A574;
    }
    
    .section-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 18px;
      font-weight: 600;
      color: #315E33;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .section-card-assessor .section-title {
      color: #03084C;
    }
    
    .section-card-info .section-title {
      color: #903339;
    }
    
    /* Info Rows */
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e5e5e5;
      font-size: 14px;
    }
    
    .info-row:last-child {
      border-bottom: none;
    }
    
    .info-label {
      color: #666666;
      font-weight: 500;
      flex: 1;
    }
    
    .info-value {
      color: #1F1F1E;
      font-weight: 600;
      flex: 2;
      text-align: right;
    }
    
    /* Attachments Section */
    .attachments {
      background-color: #f0f7f1;
      border: 2px dashed #315E33;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      margin: 30px 0;
    }
    
    .attachments-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 16px;
      color: #315E33;
      margin-bottom: 10px;
    }
    
    .attachments-list {
      font-size: 14px;
      color: #666666;
      text-align: left;
      padding-left: 20px;
    }
    
    .attachments-list li {
      margin-bottom: 8px;
    }
    
    .attachments-list strong {
      color: #315E33;
    }
    
    /* Footer */
    .footer {
      background-color: #FAFAF8;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e5e5e5;
    }
    
    .footer-text {
      font-size: 13px;
      color: #666666;
      line-height: 1.8;
    }
    
    .footer-brand {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 18px;
      color: #315E33;
      margin-bottom: 10px;
    }
    
    .footer-divider {
      width: 50px;
      height: 2px;
      background: linear-gradient(90deg, #315E33 0%, #D4A574 100%);
      margin: 15px auto;
    }
    
    /* Responsive */
    @media only screen and (max-width: 600px) {
      .email-container {
        max-width: 100% !important;
        border-radius: 0 !important;
      }
      
      .header {
        padding: 30px 20px;
      }
      
      .content {
        padding: 30px 20px;
      }
      
      .section-card {
        padding: 20px;
      }
      
      .info-row {
        flex-direction: column;
        gap: 5px;
      }
      
      .info-value {
        text-align: left;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header -->
    <div class="header">
      <div class="header-logo">ONESTA</div>
      <div class="header-subtitle">SISTEMA DE AGENDAMENTO</div>
    </div>
    
    <!-- Faixa Italiana -->
    <div class="italian-stripe"></div>
    
    <!-- Content -->
    <div class="content">
      <p class="greeting">
        <strong>Olá!</strong> Um novo agendamento foi criado no sistema.
      </p>
      
      <div class="code-badge">
        Agendamento #${agendamento.codigo_agendamento}
      </div>

      ${temAssessor ? `
      <!-- Dados do Assessor -->
      <div class="section-card section-card-assessor">
        <div class="section-title">
          🤝 DADOS DO ASSESSOR
        </div>
        
        <div class="info-row">
          <span class="info-label">Nome: </span>
          <span class="info-value">${agendamento.assessor_nome_completo}</span>
        </div>
        
        <div class="info-row">
          <span class="info-label">Email: </span>
          <span class="info-value">${agendamento.assessor_email}</span>
        </div>
        
        <div class="info-row">
          <span class="info-label">Telefone: </span>
          <span class="info-value">${agendamento.assessor_telefone}</span>
        </div>
      </div>
      ` : ''}
      
      <!-- Dados do Cliente -->
      <div class="section-card">
        <div class="section-title">
          👤 DADOS DO CLIENTE
        </div>
        
        <div class="info-row">
          <span class="info-label">Nome Completo: </span>
          <span class="info-value">${agendamento.titular_nome_completo}</span>
        </div>
        
        <div class="info-row">
          <span class="info-label">Email: </span>
          <span class="info-value">${agendamento.titular_email}</span>
        </div>
    
        <div class="info-row">
          <span class="info-label">Endereço: </span>
          <span class="info-value">${agendamento.titular_endereco}</span>
        </div>
        
        <div class="info-row">
          <span class="info-label">Quantidade de Filhos: </span>
          <span class="info-value">${agendamento.titular_qtde_filhos}</span>
        </div>
      </div>
      
      <!-- Informações Adicionais -->
      <div class="section-card section-card-info">
        <div class="section-title">
          📋 INFORMAÇÕES ADICIONAIS
        </div>
        
        <div class="info-row">
          <span class="info-label">Observações: </span>
          <span class="info-value">${agendamento.anotacoes || 'Nenhuma'}</span>
        </div>
        
        ${agendamento.periodos_restricao_email && agendamento.periodos_restricao_email.length > 0 ? `
        <div style="margin-top: 15px;">
          <div style="font-size: 14px; color: #666666; font-weight: 500; margin-bottom: 10px;">Períodos de Restrição:</div>
          ${agendamento.periodos_restricao_email.map(periodo => `
            <div style="font-size: 14px; color: #1F1F1E; font-weight: 600; margin-bottom: 8px;">
              • ${periodo.inicio} a ${periodo.fim}
            </div>
          `).join('')}
        </div>
        ` : `
        <div class="info-row">
          <span class="info-label">Período de Restrição: </span>
          <span class="info-value">${agendamento.data_inicio_restricao || 'N/A'} a ${agendamento.data_fim_restricao || 'N/A'}</span>
        </div>
        `}
      </div>
      
      <!-- Data de Criação -->
      <div style="text-align: center; margin: 30px 0 20px 0;">
        <p style="font-size: 14px; color: #666666;">
          📅 <strong>Data de Criação:</strong> ${dataFormatada}
        </p>
      </div>
      
      <!-- Anexos -->
      <div class="attachments">
        <div class="attachments-title">📎 ARQUIVOS EM ANEXO</div>
        <ul class="attachments-list">
          <li><strong>1. Arquivo TXT</strong> - Informações detalhadas do cliente e assessor</li>
          <li><strong>2. Arquivo JSONC</strong> - Todos os dados do formulário</li>
          <li><strong>3. Arquivos PDF</strong> - Documentos do formulário (identidade, comprovante de residência, etc.)</li>
        </ul>
      </div>
    </div>
    
    <!-- Faixa Italiana -->
    <div class="italian-stripe"></div>
    
    <!-- Footer -->
    <div class="footer">
      <div class="footer-brand">ONESTA</div>
      <div class="footer-divider"></div>
      <p class="footer-text">
        Este email foi gerado automaticamente pelo sistema Onesta.<br>
        Por favor, não responda a este email.
      </p>
    </div>
  </div>
</body>
</html>
`;
}

// ======================================================
// 4. ROTAS
// ======================================================

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rota: Email Simples
app.post('/api/send-simple-email', async (req, res, next) => {
  try {
    // CORREÇÃO AQUI: Verificação segura
    const { message } = req.body || {};

    if (!message) {
      console.log('Erro: Body vazio ou propriedade message ausente.', req.body);
      return res.status(400).json({ success: false, error: 'O campo "message" é obrigatório.' });
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_DESTINO,
      subject: `📧 Teste de Email - ${new Date().toLocaleString('pt-BR')}`,
      text: message,
    };

    const info = await transporter.sendMail(mailOptions);
    
    return res.status(200).json({ success: true, messageId: info.messageId });

  } catch (error) {
    next(error);
  }
});

// Rota: Email Completo (Administrativo)
app.post('/api/send-email', async (req, res, next) => {
  try {
    // CORREÇÃO AQUI: Verificação segura
    const { agendamento, jsoncUrl, arquivos = [] } = req.body || {};

    if (!agendamento?.codigo_agendamento || !jsoncUrl) {
      return res.status(400).json({ 
        success: false, 
        error: 'Dados de agendamento e URL do JSONC são obrigatórios.' 
      });
    }

    const [txtContent, jsoncContent] = await Promise.all([
      Promise.resolve(gerarTxt(agendamento)),
      baixarArquivo(jsoncUrl)
    ]);

    const nomeTitularFormatado = agendamento.titular_nome_completo
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_]/g, '');

    // Preparar anexos base (TXT e JSONC)
    const attachments = [
      { filename: `(${agendamento.codigo_agendamento}) ${agendamento.titular_nome_completo}.txt`, content: txtContent },
      { filename: `(${agendamento.codigo_agendamento}) ${agendamento.titular_nome_completo}.jsonc`, content: jsoncContent }
    ];

    // Adicionar arquivos do formulário (PDFs em base64)
    if (arquivos && Array.isArray(arquivos)) {
      arquivos.forEach((arquivo) => {
        if (arquivo.nome && arquivo.conteudoBase64) {
          try {
            attachments.push({
              filename: arquivo.nome,
              content: Buffer.from(arquivo.conteudoBase64, 'base64'),
              encoding: 'base64'
            });
          } catch (error) {
            console.error('Erro ao processar arquivo:', arquivo.nome, error);
          }
        }
      });
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_DESTINO,
      subject: `🎯 Novo Agendamento - ${agendamento.titular_nome_completo} - ${agendamento.codigo_agendamento}`,
      text: gerarCorpoEmail(agendamento),
      html: gerarHTMLAgendamento(agendamento),
      attachments
    };

    const info = await transporter.sendMail(mailOptions);
    return res.status(200).json({ success: true, messageId: info.messageId });

  } catch (error) {
    next(error);
  }
});

// Rota: Email de Confirmação para o Cliente
app.post('/api/send-client-email', async (req, res, next) => {
  try {
    const { agendamento } = req.body || {};

    if (!agendamento?.codigo_agendamento || !agendamento?.titular_email || !agendamento?.titular_nome_completo) {
      return res.status(400).json({ 
        success: false, 
        error: 'Dados do agendamento (código, email e nome) são obrigatórios.' 
      });
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: agendamento.titular_email,
      subject: `✅ Agendamento Confirmado - Seu Passaporte Italiano`,
      text: `Olá, ${agendamento.titular_nome_completo}!

Temos ótimas notícias! Seu agendamento para o passaporte italiano foi realizado com sucesso.

Código do Agendamento: ${agendamento.codigo_agendamento}

Sua solicitação foi registrada em nosso sistema e nossa equipe já está trabalhando para processar seu agendamento.

O que acontece agora?
• Sua solicitação está sendo analisada por nossa equipe especializada
• Você receberá atualizações sobre o andamento do seu processo
• Se necessário, entraremos em contato por email ou telefone
• Mantenha seus dados atualizados para facilitar a comunicação

Agradecemos pela confiança em escolher a Onesta para esta jornada tão importante em busca da sua cidadania italiana.

Data de confirmação: ${new Date(agendamento.criado_em).toLocaleString('pt-BR')}

Por favor, não responda a este email.`,
      html: gerarHTMLConfirmacaoCliente(agendamento)
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email de confirmação enviado para cliente: ${agendamento.titular_email} - ${info.messageId}`);
    
    return res.status(200).json({ success: true, messageId: info.messageId });

  } catch (error) {
    console.error('Erro ao enviar email para cliente:', error);
    next(error);
  }
});

// ======================================================
// 5. MIDDLEWARE DE ERRO (DEVE SER O ÚLTIMO)
// ======================================================
app.use((err, req, res, next) => {
  console.error('❌ Erro capturado:', err);
  res.status(500).json({ 
    success: false, 
    error: process.env.NODE_ENV === 'production' ? 'Erro interno.' : err.message 
  });
});

// ======================================================
// 6. INICIALIZAÇÃO
// ======================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});