import express from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

// Load env variables
dotenv.config();

const app = express();
const PORT = 3000;

// Set up larger limit for base64 file uploads
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

// Lazy initializer for GoogleGenAI
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('WARNING: GEMINI_API_KEY is not defined in the environment. AI extraction will fail.');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Extract receipt data API endpoint
app.post('/api/extract', async (req, res) => {
  try {
    const { fileData, mimeType } = req.body;

    if (!fileData || !mimeType) {
      return res.status(400).json({ error: 'fileData e mimeType são obrigatórios.' });
    }

    const ai = getAiClient();
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'Chave API do Gemini não configurada. Por favor, adicione GEMINI_API_KEY nos segredos do AI Studio.',
      });
    }

    console.log(`Iniciando extração com o Gemini. MimeType: ${mimeType}`);

    // Helper function to call a specific model
    const runModel = async (modelName: string) => {
      console.log(`Chamando modelo Gemini: ${modelName}`);
      return await ai.models.generateContent({
        model: modelName,
        contents: [
          {
            inlineData: {
              data: fileData,
              mimeType: mimeType,
            },
          },
          'Analise este comprovante bancário de transação/pagamento/recebimento e extraia as informações de forma estruturada. Retorne os dados estritamente conforme o esquema JSON solicitado. Se algum dado não puder ser extraído de forma alguma, forneça um valor padrão vazio ("") ou zero (0).',
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              pagador: {
                type: Type.STRING,
                description: 'Nome do pagador, remetente, emitente ou contraparte (quem enviou ou realizou o pagamento).',
              },
              banco: {
                type: Type.STRING,
                description: 'Nome do banco emissor ou envolvido (ex: Nubank, Itaú, Bradesco, Banco do Brasil, Caixa Econômica, Santander, Inter, C6 Bank, etc.).',
              },
              valor: {
                type: Type.NUMBER,
                description: 'Valor monetário da transação em formato numérico decimal.',
              },
              data: {
                type: Type.STRING,
                description: 'Data da transação no formato YYYY-MM-DD.',
              },
              mes: {
                type: Type.STRING,
                description: 'Mês correspondente por extenso, iniciando em maiúscula, em português (ex: Janeiro, Fevereiro, Março, Abril, Maio, Junho, Julho, Agosto, Setembro, Outubro, Novembro, Dezembro).',
              },
              tipo: {
                type: Type.STRING,
                description: 'Classificação do fluxo: "despesa" (para pagamentos de boletos, pix enviado, transferências enviadas) ou "receita" (para pix recebido, transferências recebidas, salários).',
              },
              categoria: {
                type: Type.STRING,
                description: 'Sugestão de categoria para a transação baseada no comprovante (ex: Alimentação, Aluguel / Habitação, Serviços / Utilities, Salário / Receitas, Impostos / Taxas, Transferência, Assinaturas, Lazer / Viagem, Suprimentos, Outros).',
              },
              descricao: {
                type: Type.STRING,
                description: 'Resumo breve do comprovante (ex: Transferência Pix, Pagamento de Boleto, Tarifa Bancária, etc.).',
              },
            },
            required: ['pagador', 'banco', 'valor', 'data', 'mes', 'tipo', 'categoria', 'descricao'],
          },
        },
      });
    };

    // Models to try in sequence for maximum reliability and speed
    // 1. gemini-3.6-flash: default model, powerful and modern.
    // 2. gemini-3.1-flash-lite: optimized light model with high availability.
    // 3. gemini-flash-latest: stable flash alias as a highly available fallback.
    const modelsToTry = ['gemini-3.6-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
    let response;
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        response = await runModel(modelName);
        console.log(`Extração bem-sucedida usando o modelo: ${modelName}`);
        break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Tentativa com o modelo ${modelName} falhou:`, err.message || err);
        // Fall back to the next model immediately without delays to ensure minimum latency
      }
    }

    if (!response) {
      throw lastError || new Error('Todos os modelos de IA falharam ou estão temporariamente indisponíveis.');
    }

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error('Nenhuma resposta de texto retornada pelo Gemini.');
    }

    const data = JSON.parse(textOutput.trim());
    return res.json(data);
  } catch (error: any) {
    console.error('Erro na extração do comprovante:', error);
    
    const isHighDemand = error.status === 'UNAVAILABLE' || 
                         error.status === 503 ||
                         error.message?.includes('503') || 
                         error.message?.includes('high demand') ||
                         error.message?.includes('temporary');
                         
    const friendlyError = isHighDemand
      ? 'O serviço de Inteligência Artificial está sob alta demanda temporária. Por favor, tente enviar o comprovante novamente em alguns segundos ou adicione o lançamento manualmente.'
      : 'Erro ao processar comprovante bancário. Certifique-se de que o arquivo seja uma imagem ou PDF nítido.';

    return res.status(500).json({
      error: friendlyError,
      details: error.message || error,
    });
  }
});

// Simple API health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Mount Vite middleware in development or serve built files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite middleware mounted in development mode.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // SPA fallback
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Serving production static files from dist.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
