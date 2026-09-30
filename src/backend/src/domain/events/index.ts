// Domain Events - Event-Driven Architecture
// Events are immutable facts that happened in the domain

export interface DomainEvent {
  eventType: string;
  occurredAt: Date;
  tenantId: string;
}

export interface OrderCreatedEvent extends DomainEvent {
  eventType: 'OrderCreated';
  data: {
    orderId: string;
    orderNumber: string;
    userId: string;
    tableId?: string;
    totalAmount: number;
    itemCount: number;
  };
}

export interface OrderStatusChangedEvent extends DomainEvent {
  eventType: 'OrderStatusChanged';
  data: {
    orderId: string;
    previousStatus: string;
    newStatus: string;
    userId: string;
  };
}

export interface PaymentReceivedEvent extends DomainEvent {
  eventType: 'PaymentReceived';
  data: {
    transactionId: string;
    orderId: string;
    amount: number;
    paymentMethod: string;
    userId: string;
  };
}

export interface OrderVoidedEvent extends DomainEvent {
  eventType: 'OrderVoided';
  data: {
    orderId: string;
    userId: string;
    reason?: string;
    totalAmount: number;
  };
}

export interface StockUpdatedEvent extends DomainEvent {
  eventType: 'StockUpdated';
  data: {
    productId: string;
    operation: 'sale' | 'restock' | 'adjustment' | 'void';
    quantityChange: number;
    balanceAfter: number;
  };
}

export interface LowStockAlertEvent extends DomainEvent {
  eventType: 'LowStockAlert';
  data: {
    productId: string;
    productName: string;
    currentStock: number;
    threshold: number;
  };
}

export interface UserCreatedEvent extends DomainEvent {
  eventType: 'UserCreated';
  data: {
    userId: string;
    email: string;
    role: string;
    createdBy: string;
  };
}

export interface TenantCreatedEvent extends DomainEvent {
  eventType: 'TenantCreated';
  data: {
    tenantId: string;
    name: string;
    plan: string;
  };
}

export type VentroPosEvent =
  | OrderCreatedEvent
  | OrderStatusChangedEvent
  | PaymentReceivedEvent
  | OrderVoidedEvent
  | StockUpdatedEvent
  | LowStockAlertEvent
  | UserCreatedEvent
  | TenantCreatedEvent;

// Event Handler Type
export type EventHandler<T extends DomainEvent = DomainEvent> = (event: T) => Promise<void>;

// Event Bus Interface
export interface IEventBus {
  publish<T extends VentroPosEvent>(event: T): Promise<void>;
  subscribe<T extends VentroPosEvent['eventType']>(
    eventType: T,
    handler: EventHandler<Extract<VentroPosEvent, { eventType: T }>>
  ): void;
}
