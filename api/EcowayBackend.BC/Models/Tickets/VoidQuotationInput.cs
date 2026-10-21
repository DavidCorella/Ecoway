using System;

namespace EcowayBackend.BC.Models.Tickets
{
    public class VoidQuotationInput
    {
        public Guid id { get; set; }
        public string reason { get; set; }
    }
}
