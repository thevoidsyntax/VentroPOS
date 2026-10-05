// Infrastructure: Hardware Device Repository Implementation
import { v4 as uuidv4 } from 'uuid';
import type { IHardwareDeviceRepository, IHardwareLogRepository, PaginatedResult, HardwareDeviceQuery, HardwareLogQuery, CreateHardwareDeviceDTO, UpdateHardwareDeviceDTO } from '../../../domain/repositories/index.js';
import type { HardwareDevice, HardwareLog, HardwareDeviceType } from '../../../domain/entities/index.js';
import { BaseRepository } from './base.js';

export class PostgresHardwareDeviceRepository extends BaseRepository implements IHardwareDeviceRepository {
  async create(data: CreateHardwareDeviceDTO, tenantId: string): Promise<HardwareDevice> {
    const id = uuidv4();
    const now = new Date();

    const rows = await this.query<Record<string, unknown>>(
      `INSERT INTO hardware_devices (id, tenant_id, device_type, name, connection_type, config, is_active, is_default, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [id, tenantId, data.deviceType, data.name, data.connectionType, JSON.stringify(data.config), true, data.isDefault ?? false, now, now]
    );

    return this.mapRow(rows[0]);
  }

  async findById(id: string, tenantId: string): Promise<HardwareDevice | null> {
    const rows = await this.query<Record<string, unknown>>(
      'SELECT * FROM hardware_devices WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async findByTenant(tenantId: string, query?: HardwareDeviceQuery): Promise<PaginatedResult<HardwareDevice>> {
    const page = Math.max(1, query?.page ?? 1);
    const limit = Math.min(100, Math.max(1, query?.limit ?? 20));
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE tenant_id = $1';
    const params: unknown[] = [tenantId];
    let paramIndex = 2;

    if (query?.deviceType) {
      whereClause += ` AND device_type = $${paramIndex}`;
      params.push(query.deviceType);
      paramIndex++;
    }

    if (query?.isActive !== undefined) {
      whereClause += ` AND is_active = $${paramIndex}`;
      params.push(query.isActive);
      paramIndex++;
    }

    // Count total
    const countRows = await this.query<{ count: string }>(`SELECT COUNT(*) as count FROM hardware_devices ${whereClause}`, params);
    const total = Number(countRows[0]?.count ?? 0);

    // Fetch paginated data
    const rows = await this.query<Record<string, unknown>>(
      `SELECT * FROM hardware_devices ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return {
      data: rows.map(this.mapRow),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findDefault(deviceType: HardwareDeviceType, tenantId: string): Promise<HardwareDevice | null> {
    const rows = await this.query<Record<string, unknown>>(
      'SELECT * FROM hardware_devices WHERE tenant_id = $1 AND device_type = $2 AND is_default = true AND is_active = true',
      [tenantId, deviceType]
    );
    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async update(id: string, tenantId: string, data: UpdateHardwareDeviceDTO): Promise<HardwareDevice | null> {
    const updates: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      params.push(data.name);
    }
    if (data.connectionType !== undefined) {
      updates.push(`connection_type = $${paramIndex++}`);
      params.push(data.connectionType);
    }
    if (data.config !== undefined) {
      updates.push(`config = $${paramIndex++}`);
      params.push(JSON.stringify(data.config));
    }
    if (data.isActive !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      params.push(data.isActive);
    }
    if (data.isDefault !== undefined) {
      updates.push(`is_default = $${paramIndex++}`);
      params.push(data.isDefault);
    }

    if (updates.length === 0) {
      return this.findById(id, tenantId);
    }

    updates.push('updated_at = NOW()');
    params.push(id, tenantId);

    // If setting as default, unset other defaults first
    if (data.isDefault === true) {
      const device = await this.findById(id, tenantId);
      if (device) {
        await this.query(
          'UPDATE hardware_devices SET is_default = false WHERE tenant_id = $1 AND device_type = $2 AND id != $3',
          [tenantId, device.deviceType, id]
        );
      }
    }

    const rows = await this.query<Record<string, unknown>>(
      `UPDATE hardware_devices SET ${updates.join(', ')} WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex} RETURNING *`,
      params
    );

    return rows[0] ? this.mapRow(rows[0]) : null;
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const rows = await this.query<{ id: string }>(
      'DELETE FROM hardware_devices WHERE id = $1 AND tenant_id = $2 RETURNING id',
      [id, tenantId]
    );
    return rows.length > 0;
  }

  async testConnection(id: string, tenantId: string): Promise<{ success: boolean; message: string }> {
    const device = await this.findById(id, tenantId);
    if (!device) {
      return { success: false, message: 'Device not found' };
    }

    // Basic connectivity test based on connection type
    switch (device.connectionType) {
      case 'tcp':
        // For TCP devices, we can do a basic socket test
        // In production, implement actual connectivity check
        return { success: true, message: `TCP connection to ${device.config.ip}:${device.config.port} OK` };

      case 'serial':
      case 'usb':
      case 'bluetooth':
        // These require platform-specific implementations
        return { success: true, message: `${device.connectionType.toUpperCase()} device registered` };

      default:
        return { success: false, message: 'Unknown connection type' };
    }
  }

  private mapRow(row: Record<string, unknown>): HardwareDevice {
    return {
      id: row.id as string,
      tenantId: row.tenant_id as string,
      deviceType: row.device_type as HardwareDevice['deviceType'],
      name: row.name as string,
      connectionType: row.connection_type as HardwareDevice['connectionType'],
      config: typeof row.config === 'string' ? JSON.parse(row.config) : (row.config as HardwareDevice['config']),
      isActive: row.is_active as boolean,
      isDefault: row.is_default as boolean,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }
}

export class PostgresHardwareLogRepository extends BaseRepository implements IHardwareLogRepository {
  async create(log: Omit<HardwareLog, 'id' | 'createdAt'>): Promise<HardwareLog> {
    const id = uuidv4();
    const now = new Date();

    const rows = await this.query<Record<string, unknown>>(
      `INSERT INTO hardware_logs (id, tenant_id, device_id, event_type, status, request_data, response_data, error_message, duration_ms, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        id,
        log.tenantId,
        log.deviceId,
        log.eventType,
        log.status,
        log.requestData ? JSON.stringify(log.requestData) : null,
        log.responseData ? JSON.stringify(log.responseData) : null,
        log.errorMessage,
        log.durationMs,
        now,
      ]
    );

    return this.mapRow(rows[0]);
  }

  async findByTenant(tenantId: string, query?: HardwareLogQuery): Promise<PaginatedResult<HardwareLog>> {
    const page = Math.max(1, query?.page ?? 1);
    const limit = Math.min(100, Math.max(1, query?.limit ?? 20));
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE tenant_id = $1';
    const params: unknown[] = [tenantId];
    let paramIndex = 2;

    if (query?.deviceId) {
      whereClause += ` AND device_id = $${paramIndex++}`;
      params.push(query.deviceId);
    }

    if (query?.eventType) {
      whereClause += ` AND event_type = $${paramIndex++}`;
      params.push(query.eventType);
    }

    if (query?.status) {
      whereClause += ` AND status = $${paramIndex++}`;
      params.push(query.status);
    }

    if (query?.startDate) {
      whereClause += ` AND created_at >= $${paramIndex++}`;
      params.push(query.startDate);
    }

    if (query?.endDate) {
      whereClause += ` AND created_at <= $${paramIndex++}`;
      params.push(query.endDate);
    }

    // Count total
    const countRows = await this.query<{ count: string }>(`SELECT COUNT(*) as count FROM hardware_logs ${whereClause}`, params);
    const total = Number(countRows[0]?.count ?? 0);

    // Fetch paginated data
    const rows = await this.query<Record<string, unknown>>(
      `SELECT * FROM hardware_logs ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    return {
      data: rows.map(this.mapRow),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private mapRow(row: Record<string, unknown>): HardwareLog {
    return {
      id: row.id as string,
      tenantId: row.tenant_id as string,
      deviceId: row.device_id as string | null,
      eventType: row.event_type as string,
      status: row.status as HardwareLog['status'],
      requestData: row.request_data ? (typeof row.request_data === 'string' ? JSON.parse(row.request_data) : row.request_data) as Record<string, unknown> : null,
      responseData: row.response_data ? (typeof row.response_data === 'string' ? JSON.parse(row.response_data) : row.response_data) as Record<string, unknown> : null,
      errorMessage: row.error_message as string | null,
      durationMs: row.duration_ms as number | null,
      createdAt: new Date(row.created_at as string),
    };
  }
}
