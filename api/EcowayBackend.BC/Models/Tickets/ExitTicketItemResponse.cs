using System;
using System.Collections.Generic;

namespace EcowayBackend.BC.Models.Tickets
{
    public class ExitTicketItemResponse
    {
        public Guid id { get; set; }
        public string material_description { get; set; }
        public decimal quantity_kg { get; set; }
        public string? physical_state { get; set; }

        // Se llena una sola vez al marcar el material como gestionado
        public DateTime? management_date { get; set; }

        // De cuales actas de entrada salio el material de esta linea (y
        // cuanto de cada una). Vacio si el acta es muy vieja y no quedaron
        // registros de reserva, o si la lista no se pidio con ese detalle
        public List<MaterialAllocationSourceResponse> sources { get; set; } = new();
    }
}
