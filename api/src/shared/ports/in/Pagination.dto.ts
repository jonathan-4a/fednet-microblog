// src/shared/ports/in/Pagination.dto.ts

export interface PaginationDto {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PaginatedResponseDto<T> {
  items: T[];
  pagination: PaginationDto;
}

