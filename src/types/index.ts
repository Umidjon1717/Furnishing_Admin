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
}

export interface Order {
  id: number
  customerId: number
  totalPrice: number
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED'
  order_date: string
  deliveryAddress?: string
  items?: OrderItem[]
}

export interface OrderItem {
  id: number
  productId: number
  product?: Product
  quantity: number
  price: number
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
