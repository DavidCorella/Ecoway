namespace EcowayBackend.BC.Models.Tickets
{
    public class CollectionSummaryMaterialPriceResponse
    {
        public string material_description { get; set; }
        public decimal price_per_kg { get; set; }
        public string? comment { get; set; }

        // Suma de los kilos de este material entre todas las actas del resumen
        public decimal total_kg { get; set; }

        // Kilos de este material por cada acta, en el mismo orden que la
        // lista de actas del resumen (arma la tabla material x boleta)
        public List<decimal> kg_by_ticket { get; set; } = new();
    }
}
