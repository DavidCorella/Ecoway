// Forma comun de la respuesta paginada que devuelve el backend (ver
// PagedResult<T> en EcowayBackend.BC), la usa cada servicio que tenga
// una lista paginada
export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}
