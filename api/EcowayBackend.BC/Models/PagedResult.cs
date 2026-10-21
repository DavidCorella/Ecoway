namespace EcowayBackend.BC.Models
{
    // Envoltorio comun para cualquier listado paginado del sistema. items
    // trae solo la pagina pedida, totalCount es el total de filas que
    // cumplen los filtros (sin paginar), para que el frontend pueda armar
    // el paginador
    public class PagedResult<T>
    {
        public List<T> items { get; set; } = new();
        public int totalCount { get; set; }
        public int page { get; set; }
        public int pageSize { get; set; }
    }

    // Filtros comunes a la mayoria de los listados: texto de busqueda,
    // estado (Active/Voided), rango de fechas, y la pagina pedida
    public class ListQuery
    {
        public string? search { get; set; }
        public string? status { get; set; }
        public DateTime? dateFrom { get; set; }
        public DateTime? dateTo { get; set; }
        public int page { get; set; } = 1;
        public int pageSize { get; set; } = 25;
    }
}
