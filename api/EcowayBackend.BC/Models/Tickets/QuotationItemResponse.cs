using System;

namespace EcowayBackend.BC.Models.Tickets
{
    public class QuotationItemResponse
    {
        public Guid id { get; set; }
        public string material_description { get; set; }
        public decimal quantity_kg { get; set; }
        public decimal cost { get; set; }
        // Solo para calcular el costo en el formulario, no sale impresa en
        // la cotizacion final (el PDF solo muestra el costo de la linea)
        public decimal? price_per_kg { get; set; }
        public string? comment { get; set; }
    }
}
