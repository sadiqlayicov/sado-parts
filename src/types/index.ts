/**
 * Core application types
 */

// User types
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  phone?: string;
  inn?: string;
  address?: string;
  country?: string;
  city?: string;
  role: 'ADMIN' | 'CUSTOMER';
  isApproved: boolean;
  isActive: boolean;
  discountPercentage?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser extends Omit<User, 'password'> {
  isAdmin: boolean;
}

// Product types
export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  salePrice?: number | null;
  sku?: string;
  stock: number;
  images: string[];
  isActive: boolean;
  isFeatured: boolean;
  artikul?: string;
  catalogNumber?: string;
  categoryId?: string;
  category?: Category;
  createdAt: string;
  updatedAt: string;
}

export interface ProductWithSales extends Product {
  salesCount: number;
}

// Category types
export interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Cart types
export interface CartItem {
  id: string;
  productId: string;
  userId: string;
  quantity: number;
  price: number;
  salePrice?: number | null;
  totalPrice: number;
  totalSalePrice?: number | null;
  product: Product;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  totalSalePrice?: number | null;
}

// Order types
export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  salePrice?: number | null;
  totalPrice: number;
  totalSalePrice?: number | null;
  product: Product;
}

export interface Order {
  id: string;
  userId: string;
  status: 'pending' | 'approved' | 'completed' | 'rejected' | 'cancelled';
  totalAmount: number;
  totalSaleAmount?: number | null;
  items: OrderItem[];
  user?: User;
  createdAt: string;
  updatedAt: string;
}

export interface OrderWithDetails extends Order {
  user: User;
  items: OrderItem[];
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  inn?: string;
  address?: string;
  country?: string;
  city?: string;
}

export interface ProductForm {
  name: string;
  description?: string;
  price: number;
  salePrice?: number;
  sku?: string;
  stock: number;
  images?: string[];
  categoryId?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  artikul?: string;
  catalogNumber?: string;
}

export interface CategoryForm {
  name: string;
  description?: string;
  image?: string;
  isActive?: boolean;
}

// Filter types
export interface ProductFilters {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  isFeatured?: boolean;
  sortBy?: 'name' | 'price' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface UserFilters {
  search?: string;
  role?: 'ADMIN' | 'CUSTOMER';
  isApproved?: boolean;
  country?: string;
  city?: string;
}

export interface OrderFilters {
  status?: Order['status'];
  userId?: string;
  startDate?: string;
  endDate?: string;
}

// Settings types
export interface AppSettings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  socialMedia: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
  paymentSettings: {
    tbankEnabled: boolean;
    tbankMerchantId?: string;
    tbankSecretKey?: string;
  };
  emailSettings: {
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPassword?: string;
  };
  themeSettings: {
    primaryColor: string;
    secondaryColor: string;
    logoUrl?: string;
    faviconUrl?: string;
  };
}

// Utility types
export type Status = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: Status;
  title: string;
  message: string;
  duration?: number;
}

// Component prop types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface LoadingProps extends BaseComponentProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// Database types
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
}

// Environment types
export interface Environment {
  NODE_ENV: 'development' | 'production' | 'test';
  DATABASE_URL: string;
  JWT_SECRET: string;
  NEXTAUTH_SECRET: string;
  NEXTAUTH_URL: string;
}

// Validation types
export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// File upload types
export interface FileUpload {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: string;
}

// Analytics types
export interface AnalyticsData {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  recentOrders: Order[];
  topProducts: ProductWithSales[];
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
  }>;
}

// All types are already exported with their interface declarations above
