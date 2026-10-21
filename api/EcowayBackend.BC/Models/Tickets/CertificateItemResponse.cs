using System;

namespace EcowayBackend.BC.Models.Tickets
{
    public class CertificateItemResponse
    {
        public Guid id { get; set; }
        public string material_description { get; set; }
        public decimal quantity_kg { get; set; }
    }
}
