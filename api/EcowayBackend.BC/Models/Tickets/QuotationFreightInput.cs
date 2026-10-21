namespace EcowayBackend.BC.Models.Tickets
{
    public class QuotationFreightInput
    {
        // Cuantos fletes de este tipo (ej. 3 viajes en camion)
        public int quantity { get; set; } = 1;
        // Costo de CADA flete, no el total de la linea
        public decimal cost { get; set; }
        public string? description { get; set; }
    }
}
