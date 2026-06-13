export interface Product {
  id: number
  name: string
  description: string
  price: number
  stock: number
  sku: string
  colors: string[]
  tags: string[]
  images: string[]
  width?: number
  length?: number
  height?: number
  categoryId: number
  category?: Category
}

export interface Category {
  id: number
  name: string
  description?: string
}

// Normalised order — works regardless of camelCase vs snake_case from backend
export interface Order {
  id: number
  customerId: number
  customer_id?: number
  totalPrice: number
  total_price?: number
  status: string
  order_date?: string
  createdAt?: string
  created_at?: string
  deliveryAddress?: string
  delivery_address?: string
  items?: OrderItem[]
}

// Helper — pick whichever field the backend actually returns
export function normalizeOrder(raw: Record<string, unknown>): Order {
  return {
    id: (raw.id as number),
    customerId: (raw.customerId ?? raw.customer_id) as number,
    customer_id: raw.customer_id as number | undefined,
    totalPrice: (raw.totalPrice ?? raw.total_price) as number,
    total_price: raw.total_price as number | undefined,
    status: (raw.status as string) ?? 'NEW',
    order_date: (raw.order_date ?? raw.createdAt ?? raw.created_at) as string | undefined,
    deliveryAddress: (raw.deliveryAddress ?? raw.delivery_address) as string | undefined,
    items: raw.items as OrderItem[] | undefined,
  }
}

export interface OrderItem {
  id: number
  productId?: number
  product_id?: number
  product?: Product
  quantity: number
  price: number
  unit_price?: number
}

export interface Customer {
  id: number
  full_name: string
  email: string
  phone_number: string
  is_active: boolean
}

export interface Payment {
  id: number
  orderId: number
  amount: number
  method: 'CARD' | 'CASH'
  status: 'PENDING' | 'COMPLETED' | 'FAILED'
  createdAt: string
}

export interface Discount {
  id: number
  productId: number
  discount_percent: number
  start_date: string
  end_date: string
}

export interface PaginatedResponse<T> {
  data: T
  total: number
  page: number
  limit: number
}
