namespace EcowayBackend.BC.Models.Tickets
{
    public class TicketItemInput
    {
        public string material_description { get; set; }
        public decimal quantity_kg { get; set; }
        public string? physical_state { get; set; }
    }
}
