// EDC Driver - Electronic Data Capture Terminal Communication
// Supports common EDC protocols via TCP

import { DEFAULT_EDC_IP, DEFAULT_EDC_PORT, DEFAULT_EDC_TIMEOUT_MS } from '../../../shared/constants/index.js';

export interface EDCConfig {
  ip?: string;
  port?: number;
  merchantId?: string;
  terminalId?: string;
  timeout?: number;
}

export interface PaymentRequest {
  amount: number;
  transactionId: string;
  currency?: string;
  referenceNumber?: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionId: string;
  referenceNumber?: string;
  cardNumber?: string; // Masked
  cardType?: string;
  authCode?: string;
  message: string;
  timestamp: Date;
}

export interface SettlementRequest {
  batchNumber: string;
}

export interface SettlementResponse {
  success: boolean;
  batchNumber: string;
  totalTransactions: number;
  totalAmount: number;
  message: string;
  timestamp: Date;
}

export class EDCDriver {
  private config: Required<EDCConfig>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private socket: any = null;
  private connected: boolean = false;

  constructor(config: EDCConfig) {
    this.config = {
      ip: config.ip ?? DEFAULT_EDC_IP,
      port: config.port ?? DEFAULT_EDC_PORT,
      merchantId: config.merchantId ?? 'MERCHANT001',
      terminalId: config.terminalId ?? 'TERM001',
      timeout: config.timeout ?? DEFAULT_EDC_TIMEOUT_MS,
    };
  }

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
        this.connected = true;
        resolve();
      });

      socket.on('error', (err: Error) => {
        this.connected = false;
        reject(new Error(`Connection failed: ${err.message}`));
      });

      socket.on('timeout', () => {
        this.connected = false;
        reject(new Error('Connection timeout'));
      });

      socket.on('close', () => {
        this.connected = false;
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
          this.connected = false;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  private sendCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.connected) {
        reject(new Error('Not connected to EDC terminal'));
        return;
      }

      const socket = this.socket;
      let response = '';

      socket.once('data', (data: Buffer) => {
        response += data.toString();
      });

      socket.write(command + '\n', (err: Error | null | undefined) => {
        if (err) reject(err);
      });

      // Timeout for response
      setTimeout(() => {
        if (response) {
          resolve(response);
        } else {
          reject(new Error('EDC timeout - no response received'));
        }
      }, this.config.timeout);
    });
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    if (!this.connected) {
      throw new Error('EDC terminal not connected');
    }

    // Build payment command (ISO 8583-like format for demo)
    // In production, this would be actual ISO 8583 or proprietary protocol
    const command = this.buildPaymentCommand(request);

    try {
      const response = await this.sendCommand(command);
      return this.parsePaymentResponse(response, request.transactionId);
    } catch (error) {
      return {
        success: false,
        transactionId: request.transactionId,
        message: error instanceof Error ? error.message : 'Payment failed',
        timestamp: new Date(),
      };
    }
  }

  async cancelTransaction(transactionId: string): Promise<{ success: boolean; message: string }> {
    if (!this.connected) {
      throw new Error('EDC terminal not connected');
    }

    const command = `VOID|${transactionId}|${this.config.terminalId}`;

    try {
      const response = await this.sendCommand(command);
      const parsed = this.parseSimpleResponse(response);
      return {
        success: parsed.success,
        message: parsed.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Void failed',
      };
    }
  }

  async settleBatch(request: SettlementRequest): Promise<SettlementResponse> {
    if (!this.connected) {
      throw new Error('EDC terminal not connected');
    }

    const command = `SETTLE|${request.batchNumber}|${this.config.terminalId}`;

    try {
      const response = await this.sendCommand(command);
      return this.parseSettlementResponse(response, request.batchNumber);
    } catch (error) {
      return {
        success: false,
        batchNumber: request.batchNumber,
        totalTransactions: 0,
        totalAmount: 0,
        message: error instanceof Error ? error.message : 'Settlement failed',
        timestamp: new Date(),
      };
    }
  }

  async getStatus(): Promise<{ connected: boolean; terminalId: string; merchantId: string }> {
    return {
      connected: this.connected,
      terminalId: this.config.terminalId,
      merchantId: this.config.merchantId,
    };
  }

  // Command builders
  private buildPaymentCommand(request: PaymentRequest): string {
    const timestamp = new Date().toISOString();
    return [
      'SALE',
      request.transactionId,
      this.config.terminalId,
      request.amount.toFixed(2),
      request.currency ?? 'IDR',
      timestamp,
      request.referenceNumber ?? '',
    ].join('|');
  }

  // Response parsers
  private parsePaymentResponse(response: string, transactionId: string): PaymentResponse {
    // Parse simple pipe-delimited response
    // Format: STATUS|TRANSACTION_ID|AUTH_CODE|CARD_TYPE|MASKED_CARD|MESSAGE
    const parts = response.trim().split('|');

    if (parts.length < 2) {
      return {
        success: false,
        transactionId,
        message: 'Invalid EDC response',
        timestamp: new Date(),
      };
    }

    const status = parts[0];
    const success = status === 'APPROVED' || status === '00';

    return {
      success,
      transactionId: parts[1] || transactionId,
      authCode: success ? parts[2] : undefined,
      cardType: success ? parts[3] : undefined,
      cardNumber: success ? parts[4] : undefined,
      message: parts[parts.length - 1] || (success ? 'Payment approved' : 'Payment declined'),
      timestamp: new Date(),
    };
  }

  private parseSimpleResponse(response: string): { success: boolean; message: string } {
    const parts = response.trim().split('|');
    const status = parts[0];
    const success = status === 'APPROVED' || status === '00' || status === 'SUCCESS';

    return {
      success,
      message: parts[parts.length - 1] || (success ? 'Success' : 'Failed'),
    };
  }

  private parseSettlementResponse(response: string, batchNumber: string): SettlementResponse {
    // Format: STATUS|BATCH|TOTAL_COUNT|TOTAL_AMOUNT|MESSAGE
    const parts = response.trim().split('|');
    const status = parts[0];
    const success = status === 'APPROVED' || status === '00';

    return {
      success,
      batchNumber: parts[1] || batchNumber,
      totalTransactions: success && parts[2] ? parseInt(parts[2], 10) : 0,
      totalAmount: success && parts[3] ? parseFloat(parts[3]) : 0,
      message: parts[parts.length - 1] || (success ? 'Settlement complete' : 'Settlement failed'),
      timestamp: new Date(),
    };
  }
}
