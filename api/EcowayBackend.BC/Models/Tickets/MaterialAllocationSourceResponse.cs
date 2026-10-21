using System;

namespace EcowayBackend.BC.Models.Tickets
{
    // De cual acta de entrada (y cuanto de esa acta puntual) salio el
    // material reservado para una linea de acta de salida. Una sola linea
    // de salida puede juntar material de varias actas de entrada distintas
    // (se reserva de las mas viejas primero)
    public class MaterialAllocationSourceResponse
    {
        public Guid ticket_id { get; set; }
        public string ticket_number { get; set; }
        public DateTime ticket_date { get; set; }
        public string company_name { get; set; }
        public decimal quantity_kg { get; set; }
    }
}
