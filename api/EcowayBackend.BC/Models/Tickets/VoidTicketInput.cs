using System;

namespace EcowayBackend.BC.Models.Tickets
{
    public class VoidTicketInput
    {
        public Guid id { get; set; }
        public string reason { get; set; }
    }
}
