using System;

namespace EcowayBackend.BC.Models.Tickets
{
    // Una fila por material dentro de un acta de salida activa, para la
    // pantalla de Estado de actas de salida (gestion por material). Las
    // actas anuladas no aparecen aca
    public class ExitTicketItemManagementResponse
    {
        public Guid id { get; set; }
        public Guid exit_ticket_id { get; set; }
        public string exit_ticket_number { get; set; }
        public string destination_company_name { get; set; }
        public DateTime exit_date { get; set; }

        public string receiver_responsible_name { get; set; }
        public string receiver_responsible_id { get; set; }
        public string ecoway_responsible_name { get; set; }
        public string ecoway_responsible_id { get; set; }
        public string? image_path { get; set; }

        public string material_description { get; set; }
        public decimal quantity_kg { get; set; }
        public string? physical_state { get; set; }

        // Se llena una sola vez al marcar el material como gestionado
        public DateTime? management_date { get; set; }

        // Plazo del material en el catalogo (Materials.max_management_days),
        // contado desde exit_date. Null si el material no esta en el
        // catalogo con esa descripcion exacta, o si no tiene plazo definido
        public int? max_management_days { get; set; }
    }
}
