import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

@Injectable()
export class TransformResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // Check if data already has success property (already transformed)
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // Check if data includes pagination metadata
        if (data && typeof data === 'object' && 'items' in data && 'meta' in data) {
          return {
            success: true as const,
            data: data.items,
            meta: data.meta,
          };
        }

        return {
          success: true as const,
          data,
        };
      }),
    );
  }
}
