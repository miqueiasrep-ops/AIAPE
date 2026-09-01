/**
 * Gerador Oficial de BR Code PIX (EMV QRCPS) conforme especificações do Banco Central do Brasil (BCB).
 */

export function sanitizeText(str: string, maxLength: number): string {
  if (!str) return '';
  // Remove acentos e caracteres especiais
  const ascii = str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .toUpperCase()
    .trim();
  return ascii.slice(0, maxLength);
}

export function sanitizePixKey(key: string): string {
  if (!key) return '8a0fa350-4511-4eab-a06f-6cc3bf44475c';
  const clean = key.trim();
  
  // Se for email
  if (clean.includes('@')) {
    return clean.toLowerCase();
  }
  
  // Se for telefone
  if (clean.startsWith('+') || clean.replace(/\D/g, '').length === 11 || clean.replace(/\D/g, '').length === 10) {
    const digits = clean.replace(/\D/g, '');
    if (digits.length === 11 || digits.length === 10) {
      return `+55${digits}`;
    }
    return clean;
  }

  // Se for CPF (11 dígitos) ou CNPJ (14 dígitos)
  const onlyDigits = clean.replace(/\D/g, '');
  if (onlyDigits.length === 11 || onlyDigits.length === 14) {
    return onlyDigits;
  }

  // Chave aleatória (UUID) ou padrão
  return clean;
}

export function formatTLV(tag: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${tag}${len}${value}`;
}

export function calculateCRC16(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, '0');
}

export interface GeneratePixOptions {
  pixKey: string;
  merchantName: string;
  merchantCity: string;
  amount?: number;
  description?: string;
  txid?: string;
}

export function generatePixPayload(options: GeneratePixOptions): string {
  const {
    pixKey,
    merchantName,
    merchantCity,
    amount,
    description,
    txid = '***'
  } = options;

  // Se o valor fornecido em pixKey já for um código Pix Copia e Cola (inicia com 000201)
  if (pixKey && pixKey.trim().startsWith('000201')) {
    return pixKey.trim();
  }

  const key = sanitizePixKey(pixKey);
  const name = sanitizeText(merchantName || 'AIAPE PERNAMBUCO', 25) || 'AIAPE PERNAMBUCO';
  const city = sanitizeText(merchantCity || 'RECIFE', 15) || 'RECIFE';
  
  // No padrão Bacen, se txid não for especificado ou for inválido, usa-se '***' ou 'AIAPE'
  let sanitizedTxid = '***';
  if (txid && txid !== '***') {
    const cleanTx = sanitizeText(txid, 25);
    if (cleanTx) sanitizedTxid = cleanTx;
  }

  // Tag 00: Payload Format Indicator
  let payload = formatTLV('00', '01');

  // Tag 01: Point of Initiation Method (11 = estático)
  payload += formatTLV('01', '11');

  // Tag 26: Merchant Account Information
  let merchantAccount = formatTLV('00', 'br.gov.bcb.pix');
  merchantAccount += formatTLV('01', key);
  if (description) {
    const cleanDesc = sanitizeText(description, 40);
    if (cleanDesc) {
      merchantAccount += formatTLV('02', cleanDesc);
    }
  }
  payload += formatTLV('26', merchantAccount);

  // Tag 52: Merchant Category Code
  payload += formatTLV('52', '0000');

  // Tag 53: Transaction Currency (986 = Real BRL)
  payload += formatTLV('53', '986');

  // Tag 54: Transaction Amount
  if (amount && amount > 0) {
    payload += formatTLV('54', amount.toFixed(2));
  }

  // Tag 58: Country Code
  payload += formatTLV('58', 'BR');

  // Tag 59: Merchant Name
  payload += formatTLV('59', name);

  // Tag 60: Merchant City
  payload += formatTLV('60', city);

  // Tag 62: Additional Data Field Template
  const additionalData = formatTLV('05', sanitizedTxid);
  payload += formatTLV('62', additionalData);

  // Tag 63: CRC16 Header
  payload += '6304';

  // Calcular CRC16 e anexar
  const crc = calculateCRC16(payload);
  return `${payload}${crc}`;
}
