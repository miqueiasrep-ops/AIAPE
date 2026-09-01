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
      const imagePart = {
        inlineData: {
          data: fileData,
          mimeType: mimeType,
        },
      };
      const textPart = {
        text: `Você é um assistente contábil especializado em ler comprovantes bancários brasileiros (PIX, TED, DOC, boleto bancário, recibo de transferência ou depósito).
Analise este comprovante com atenção e extraia as informações de forma estruturada. Retorne os dados estritamente conforme o esquema JSON solicitado.
Se algum campo não puder ser identificado com certeza, forneça um valor padrão adequado ("" ou 0).

Orientações para os campos:
- pagador: Nome completo do remetente, pagador, titular da conta ou cliente que fez a transferência/pagamento.
- banco: Nome da instituição financeira emissora (ex: Nubank, Itaú, Bradesco, Banco do Brasil, Caixa Econômica, Santander, Inter, C6 Bank, PagBank, Mercado Pago, Sicredi, Sicoob, etc.).
- valor: Valor numérico em Reais (ex: 35.00, 50.00, 70.00). Não incluir o símbolo R$.
- data: Data em que o pagamento foi realizado no formato YYYY-MM-DD.
- mes: Mês de competência ou do pagamento por extenso em português (ex: Janeiro, Fevereiro, Março, Abril, Maio, Junho, Julho, Agosto, Setembro, Outubro, Novembro, Dezembro).
- tipo: Classificação do fluxo. Para mensalidades recebidas ou PIX de associados, use "receita". Para saídas, use "despesa".
- categoria: Use "Mensalidades de Associados" para pagamentos de membros da associação, ou outra categoria adequada.
- descricao: Breve descrição informativa (ex: "Comprovante PIX Mensalidade").`,
      };

      return await ai.models.generateContent({
        model: modelName,
        contents: { parts: [imagePart, textPart] },
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
                description: 'Classificação do fluxo: "despesa" ou "receita".',
              },
              categoria: {
                type: Type.STRING,
                description: 'Sugestão de categoria para a transação (ex: Mensalidades de Associados, Impostos / Taxas, Outros).',
              },
              descricao: {
                type: Type.STRING,
                description: 'Resumo breve do comprovante (ex: Transferência Pix, Pagamento de Mensalidade, etc.).',
              },
            },
            required: ['pagador', 'banco', 'valor', 'data', 'mes', 'tipo', 'categoria', 'descricao'],
          },
        },
      });
    };

    // Models to try in sequence with automatic failover and resilience against 503 (high demand) / 429
    const modelsToTry = [
      'gemini-3.6-flash',
      'gemini-3.1-flash-lite',
      'gemini-3.7-flash',
      'gemini-flash-latest',
      'gemini-3.1-pro-preview'
    ];
    
    let response;
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      // Try each model with up to 2 attempts if 503 or transient failure occurs
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          response = await runModel(modelName);
          console.log(`Extração bem-sucedida usando o modelo: ${modelName} (tentativa ${attempt})`);
          break;
        } catch (err: any) {
          lastError = err;
          const isUnavailable = err.status === 503 ||
            err.code === 503 ||
            err.message?.includes('503') ||
            err.message?.includes('high demand') ||
            err.message?.includes('UNAVAILABLE') ||
            err.message?.includes('RESOURCE_EXHAUSTED');

          console.warn(`Tentativa ${attempt} com o modelo ${modelName} falhou:`, err.message || err);

          if (isUnavailable && attempt < 2) {
            // Short backoff before retrying this model
            await new Promise((resolve) => setTimeout(resolve, 600));
            continue;
          }
          // If still failing, move immediately to the next model in the cascade
          break;
        }
      }

      if (response) {
        break;
      }
    }

    if (!response) {
      throw lastError || new Error('Todos os modelos de IA falharam ou estão temporariamente indisponíveis.');
    }

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error('Nenhuma resposta de texto retornada pelo Gemini.');
    }

    let cleanJson = textOutput.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const data = JSON.parse(cleanJson);
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
