using System;

namespace EcowayBackend.BC.Models.Tickets
{
    public class QuotationFreightResponse
    {
        public Guid id { get; set; }
        public int quantity { get; set; }
        public decimal cost { get; set; }
        public string? description { get; set; }
        // quantity * cost, calculado
        public decimal total { get; set; }
    }
}
