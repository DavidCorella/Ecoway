namespace EcowayBackend.BC.Models.Tickets
{
    public class CollectionSummaryMaterialPriceInput
    {
        public string material_description { get; set; }
        public decimal price_per_kg { get; set; }
        public string? comment { get; set; }
    }
}
