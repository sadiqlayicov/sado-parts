import { NextResponse } from 'next/server';

/**
 * Standardized API response types
 */
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

/**
 * Standardized success response
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString()
    },
    { status }
  );
}

/**
 * Standardized error response
 */
export function errorResponse(
  error: string,
  status: number = 500,
  details?: any
): NextResponse<ApiResponse> {
  const response: ApiResponse = {
    success: false,
    error,
    timestamp: new Date().toISOString()
  };

  // Add details in development only
  if (process.env.NODE_ENV === 'development' && details) {
    response.data = details;
  }

  return NextResponse.json(response, { status });
}

/**
 * Standardized paginated response
 */
export function paginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
  message?: string
): NextResponse<PaginatedResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      timestamp: new Date().toISOString()
    },
    { status: 200 }
  );
}

/**
 * Common error messages
 */
export const ErrorMessages = {
  // Authentication
  UNAUTHORIZED: 'İstifadəçi təsdiqlənməyib',
  INVALID_CREDENTIALS: 'Yanlış email və ya şifrə',
  ACCOUNT_NOT_APPROVED: 'Hesabınız hələ təsdiqlənməyib',
  ACCOUNT_BLOCKED: 'Hesabınız bloklanıb',
  
  // Validation
  REQUIRED_FIELD: (field: string) => `${field} tələb olunur`,
  INVALID_EMAIL: 'Düzgün email ünvanı daxil edin',
  INVALID_PHONE: 'Düzgün telefon nömrəsi daxil edin',
  INVALID_PRICE: 'Düzgün qiymət daxil edin',
  INVALID_QUANTITY: 'Düzgün miqdar daxil edin',
  
  // Database
  NOT_FOUND: (resource: string) => `${resource} tapılmadı`,
  ALREADY_EXISTS: (resource: string) => `${resource} artıq mövcuddur`,
  CREATION_FAILED: (resource: string) => `${resource} yaradılması uğursuz oldu`,
  UPDATE_FAILED: (resource: string) => `${resource} yenilənməsi uğursuz oldu`,
  DELETION_FAILED: (resource: string) => `${resource} silinməsi uğursuz oldu`,
  
  // General
  INTERNAL_ERROR: 'Daxili server xətası',
  NETWORK_ERROR: 'Şəbəkə xətası',
  TIMEOUT_ERROR: 'Zaman aşımı xətası',
  PERMISSION_DENIED: 'İcazə yoxdur',
  
  // Cart & Orders
  CART_EMPTY: 'Səbət boşdur',
  INSUFFICIENT_STOCK: 'Kifayət qədər məhsul yoxdur',
  ORDER_NOT_FOUND: 'Sifariş tapılmadı',
  ORDER_ALREADY_COMPLETED: 'Sifariş artıq tamamlanıb',
  
  // File Upload
  FILE_TOO_LARGE: 'Fayl həcmi çox böyükdür',
  INVALID_FILE_TYPE: 'Dəstəklənməyən fayl növü',
  UPLOAD_FAILED: 'Fayl yüklənməsi uğursuz oldu'
} as const;

/**
 * Safe error message extraction
 */
export function getErrorMessage(error: any): string {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  
  return ErrorMessages.INTERNAL_ERROR;
}

/**
 * Log error with context
 */
export function logError(context: string, error: any, additionalData?: any) {
  const errorMessage = getErrorMessage(error);
  
  console.error(`[${context}] Error:`, {
    message: errorMessage,
    stack: error instanceof Error ? error.stack : undefined,
    additionalData,
    timestamp: new Date().toISOString()
  });
}
