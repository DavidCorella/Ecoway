namespace EcowayBackend.BC.Models.Tickets
{
    // Ultimo precio por kilo que se le cobro a una empresa por un material
    // especifico, revisando tanto cotizaciones como resumenes de
    // recoleccion (lo que se haya usado mas reciente entre los dos, no
    // necesariamente el documento mas reciente en general)
    public class MaterialPriceHistoryResponse
    {
        public string material_description { get; set; }
        public decimal price_per_kg { get; set; }
        public string currency { get; set; }
    }
}
