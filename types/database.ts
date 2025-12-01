export interface Product {
  id: string
  name: string
  description: string
  price: number
  stock: number
  category_id: string
  images: string[]
  created_at: string
  updated_at: string
  category?: Category
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  created_at: string
  updated_at: string
}

export interface Banner {
  id: string
  title: string
  subtitle?: string
  image_url: string
  button_text?: string
  button_link?: string
  start_date?: string
  end_date?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  user_id?: string
  email: string
  total: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  shipping_address: {
    name: string
    address: string
    city: string
    state: string
    zip: string
    country: string
  }
  items: OrderItem[]
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  price: number
  product?: Product
}

export interface CartItem {
  product: Product
  quantity: number
}

