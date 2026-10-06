// ESC/POS Driver - Receipt Printer Communication Protocol
// Supports thermal receipt printers via TCP or USB

import { DEFAULT_PRINTER_IP, DEFAULT_PRINTER_PORT, DEFAULT_HARDWARE_TIMEOUT_MS } from '../../../shared/constants/index.js';

export interface ESCPOSConfig {
  ip?: string;
  port?: number;
  timeout?: number;
  encoding?: string;
}

export interface PrintOptions {
  width?: number; // Characters per line (default: 48)
  bold?: boolean;
  underline?: boolean;
  align?: 'left' | 'center' | 'right';
  fontSize?: 'normal' | 'double' | 'quadruple';
}

export class ESCPOSDriver {
  private config: Required<ESCPOSConfig>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private socket: any = null;

  constructor(config: ESCPOSConfig) {
    this.config = {
      ip: config.ip ?? DEFAULT_PRINTER_IP,
      port: config.port ?? DEFAULT_PRINTER_PORT,
      timeout: config.timeout ?? DEFAULT_HARDWARE_TIMEOUT_MS,
      encoding: config.encoding ?? 'utf8',
    };
  }

  // ESC/POS Commands
  private static readonly COMMANDS = {
    INIT: Buffer.from([0x1B, 0x40]), // Initialize printer
    BOLD_ON: Buffer.from([0x1B, 0x45, 0x01]),
    BOLD_OFF: Buffer.from([0x1B, 0x45, 0x00]),
    UNDERLINE_ON: Buffer.from([0x1B, 0x2D, 0x01]),
    UNDERLINE_OFF: Buffer.from([0x1B, 0x2D, 0x00]),
    ALIGN_LEFT: Buffer.from([0x1B, 0x61, 0x00]),
    ALIGN_CENTER: Buffer.from([0x1B, 0x61, 0x01]),
    ALIGN_RIGHT: Buffer.from([0x1B, 0x61, 0x02]),
    FONT_NORMAL: Buffer.from([0x1B, 0x21, 0x00]),
    FONT_DOUBLE: Buffer.from([0x1B, 0x21, 0x11]),
    FONT_QUADRUPLE: Buffer.from([0x1B, 0x21, 0x30]),
    LINE_FEED: Buffer.from([0x0A]),
    CUT_PAPER: Buffer.from([0x1D, 0x56, 0x00]), // Full cut
    CUT_PAPER_PARTIAL: Buffer.from([0x1D, 0x56, 0x01]), // Partial cut
    OPEN_CASH_DRAWER: Buffer.from([0x1B, 0x70, 0x00, 0x19, 0xFA]), // Kick drawer 1
    BEEP: Buffer.from([0x1B, 0x42, 0x05, 0x09]), // Beep
  };

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const net = require('net');

      this.socket = new net.Socket();

      if (!this.socket) {
        reject(new Error('Failed to create socket'));
        return;
      }

      const socket = this.socket;

      socket.setTimeout(this.config.timeout);

      socket.connect(this.config.port, this.config.ip, () => {
        resolve();
      });

      socket.on('error', (err: Error) => {
        reject(new Error(`Connection failed: ${err.message}`));
      });

      socket.on('timeout', () => {
        reject(new Error('Connection timeout'));
      });
    });
  }

  async disconnect(): Promise<void> {
    return new Promise((resolve) => {
      if (this.socket) {
        // Remove all event listeners to prevent memory leaks
        this.socket.removeAllListeners();
        this.socket.end(() => {
          this.socket = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  async sendData(buffer: Buffer): Promise<void> {
    if (!this.socket) {
      throw new Error('Not connected');
    }

    return new Promise((resolve, reject) => {
      this.socket!.write(buffer, (err: Error | null | undefined) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async initialize(): Promise<void> {
    await this.sendData(ESCPOSDriver.COMMANDS.INIT);
  }

  async printText(text: string, options: PrintOptions = {}): Promise<void> {
    const width = options.width ?? 48;

    // Set alignment
    if (options.align === 'center') {
      await this.sendData(ESCPOSDriver.COMMANDS.ALIGN_CENTER);
    } else if (options.align === 'right') {
      await this.sendData(ESCPOSDriver.COMMANDS.ALIGN_RIGHT);
    } else {
      await this.sendData(ESCPOSDriver.COMMANDS.ALIGN_LEFT);
    }

    // Set font size
    if (options.fontSize === 'double') {
      await this.sendData(ESCPOSDriver.COMMANDS.FONT_DOUBLE);
    } else if (options.fontSize === 'quadruple') {
      await this.sendData(ESCPOSDriver.COMMANDS.FONT_QUADRUPLE);
    } else {
      await this.sendData(ESCPOSDriver.COMMANDS.FONT_NORMAL);
    }

    // Set bold
    if (options.bold) {
      await this.sendData(ESCPOSDriver.COMMANDS.BOLD_ON);
    }

    // Set underline
    if (options.underline) {
      await this.sendData(ESCPOSDriver.COMMANDS.UNDERLINE_ON);
    }

    // Format and send text
    const lines = this.wrapText(text, width);
    for (const line of lines) {
      const lineBuffer = Buffer.from(line + '\n', this.config.encoding as BufferEncoding);
      await this.sendData(lineBuffer);
    }

    // Reset formatting
    await this.sendData(ESCPOSDriver.COMMANDS.BOLD_OFF);
    await this.sendData(ESCPOSDriver.COMMANDS.UNDERLINE_OFF);
    await this.sendData(ESCPOSDriver.COMMANDS.ALIGN_LEFT);
  }

  async printLine(char = '-', width = 48): Promise<void> {
    const lineBuffer = Buffer.from(char.repeat(width) + '\n', this.config.encoding as BufferEncoding);
    await this.sendData(lineBuffer);
  }

  async printDivider(): Promise<void> {
    await this.printLine('=', 48);
  }

  async feedLines(count: number = 3): Promise<void> {
    for (let i = 0; i < count; i++) {
      await this.sendData(ESCPOSDriver.COMMANDS.LINE_FEED);
    }
  }

  async cutPaper(partial = false): Promise<void> {
    await this.feedLines(3);
    await this.sendData(partial ? ESCPOSDriver.COMMANDS.CUT_PAPER_PARTIAL : ESCPOSDriver.COMMANDS.CUT_PAPER);
  }

  async openCashDrawer(): Promise<void> {
    await this.sendData(ESCPOSDriver.COMMANDS.OPEN_CASH_DRAWER);
  }

  async beep(): Promise<void> {
    await this.sendData(ESCPOSDriver.COMMANDS.BEEP);
  }

  // Public method to send raw buffer (for QR codes, etc.)
  async send(buffer: Buffer): Promise<void> {
    await this.sendData(buffer);
  }

  // Utility: Wrap text to fit width
  private wrapText(text: string, width: number): string[] {
    const lines: string[] = [];
    const paragraphs = text.split('\n');

    for (const paragraph of paragraphs) {
      const words = paragraph.split(' ');
      let currentLine = '';

      for (const originalWord of words) {
        let wordRemainder = originalWord;

        while (wordRemainder.length > 0) {
          if (currentLine.length === 0) {
            // First word on line
            if (wordRemainder.length <= width) {
              currentLine = wordRemainder;
              wordRemainder = '';
            } else {
              // Word longer than width - split it
              currentLine = wordRemainder.substring(0, width);
              wordRemainder = wordRemainder.substring(width);
              lines.push(currentLine);
              currentLine = '';
            }
          } else {
            const spaceLeft = width - currentLine.length - 1;
            if (wordRemainder.length <= spaceLeft) {
              // Word fits
              currentLine += ' ' + wordRemainder;
              wordRemainder = '';
            } else {
              // Word doesn't fit - start new line
              if (currentLine) lines.push(currentLine);
              currentLine = '';
            }
          }
        }

        // After processing word, check if line is getting full
        if (currentLine.length >= width) {
          lines.push(currentLine);
          currentLine = '';
        }
      }

      if (currentLine) lines.push(currentLine);
    }

    return lines;
  }

  // Test printer connection
  async test(): Promise<{ success: boolean; message: string }> {
    try {
      await this.connect();
      await this.initialize();
      await this.printText('PRINTER TEST', { align: 'center', bold: true, fontSize: 'double' });
      await this.printText(new Date().toLocaleString('id-ID'));
      await this.feedLines(3);
      await this.cutPaper();
      await this.disconnect();
      return { success: true, message: 'Printer test successful' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// QR Code support (optional, for QRIS payments)
export interface QRCodeOptions {
  size?: number; // 1-10
  errorCorrection?: 'L' | 'M' | 'Q' | 'H';
}

export class QRCodeGenerator {
  static generate(data: string, options: QRCodeOptions = {}): Buffer {
    const size = options.size ?? 6;
    const ecLevel = options.errorCorrection ?? 'M';

    // QR Code commands for ESC/POS printers
    const cmd: number[] = [
      0x1D, 0x28, 0x6B, // QR Code: Store data
      0x04, 0x00, // pL pH (data length)
      0x31, 0x50, 0x30, // Function: Store QR data
      ...Array.from(Buffer.from(data)),
      0x1D, 0x28, 0x6B, // QR Code: Print
      0x03, 0x00, // pL pH
      0x31, 0x51, 0x30, // Function: Print QR
      0x1D, 0x28, 0x6B, // QR Code: Size
      0x03, 0x00,
      0x31, 0x43, size, // n
      0x1D, 0x28, 0x6B, // QR Code: Error correction
      0x03, 0x00,
      0x31, 0x45, ecLevel.charCodeAt(0), // n: L, M, Q, H
    ];

    return Buffer.from(cmd);
  }
}
