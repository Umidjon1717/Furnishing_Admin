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

export interface OrderAddress {
  id?: number
  region?: string
  district?: string
  street?: string
  zip_code?: string
  additional_info?: string
}

export interface OrderDetail {
  id: number
  quantity: number
  product?: {
    id: number
    name: string
    description?: string
    price: number
    images?: string[]
    stock?: number
    average_rating?: number
  }
}

// Normalised shape used throughout the frontend
export interface Order {
  id: number
  customerId: number
  total_price: number
  status: string
  order_date?: string
  order_address?: OrderAddress
  order_details?: OrderDetail[]
}

// Accepts the raw backend object (any field naming) and returns a clean Order
export function normalizeOrder(raw: Record<string, unknown>): Order {
  return {
    id: raw.id as number,
    customerId: (raw.customerId ?? raw.customer_id) as number,
    total_price: (raw.total_price ?? raw.totalPrice) as number,
    status: (raw.status as string) ?? 'NEW',
    order_date: (raw.order_date ?? raw.createdAt ?? raw.created_at) as string | undefined,
    order_address: raw.order_address as OrderAddress | undefined,
    order_details: raw.order_details as OrderDetail[] | undefined,
  }
}

// Legacy alias kept so OrderItem references elsewhere don't break
export type OrderItem = OrderDetail

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
