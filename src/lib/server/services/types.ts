export interface IService<TInput, TOutput> {
  execute(input: TInput): Promise<TOutput>;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface CreateEventInput {
  title: string;
  description?: string;
  starts_at: string;
  ends_at?: string;
  unit_id?: string;
  department_id?: string;
}

export interface EventFilters {
  status?: string;
  unit_id?: string;
  from_date?: string;
  to_date?: string;
  page?: number;
  limit?: number;
}