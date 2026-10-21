using System;

namespace EcowayBackend.BC.Models.Tickets
{
    public class VoidCertificateInput
    {
        public Guid id { get; set; }
        public string reason { get; set; }
    }
}
