import QRCode from 'qrcode';

export interface QrCodeOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

/**
 * Generates an SVG string representation of the QR code.
 */
export async function generateQrSvg(url: string, options: QrCodeOptions = {}): Promise<string> {
  const { width = 512, margin = 2, color = { dark: '#0B1220', light: '#FFFFFF' } } = options;
  return QRCode.toString(url, {
    type: 'svg',
    width,
    margin,
    color,
    errorCorrectionLevel: 'H',
  });
}

/**
 * Generates a high-resolution Data URL (300+ DPI equivalent for 4x4" print = 1200px - 2400px).
 */
export async function generateHighDpiQrPng(url: string, size = 1800): Promise<string> {
  return QRCode.toDataURL(url, {
    width: size,
    margin: 3,
    color: {
      dark: '#0B1220',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'H',
  });
}

/**
 * Generates a PNG Buffer (server-side).
 */
export async function generateQrBuffer(url: string, size = 1800): Promise<Buffer> {
  return QRCode.toBuffer(url, {
    width: size,
    margin: 3,
    color: {
      dark: '#0B1220',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'H',
  });
}
