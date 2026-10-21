using System;
using System.Collections.Generic;

namespace EcowayBackend.BC.Models.Tickets
{
    // Una fila por material dentro de un acta activa, para la pantalla de
    // Estado de actas de entrada (gestion por material). Las actas
    // anuladas no aparecen aca
    public class TicketItemManagementResponse
    {
        public Guid id { get; set; }
        public Guid ticket_id { get; set; }
        public string ticket_number { get; set; }
        public string company_name { get; set; }
        public DateTime ticket_date { get; set; }

        public string client_responsible_name { get; set; }
        public string client_responsible_id { get; set; }
        public string ecoway_responsible_name { get; set; }
        public string ecoway_responsible_id { get; set; }
        public string? image_path { get; set; }

        public string material_description { get; set; }
        public decimal quantity_kg { get; set; }
        public string? physical_state { get; set; }

        // Cuanto de este material ya se saco en actas de salida (se
        // reserva de las actas de entrada mas viejas primero). Es
        // informativo nada mas: un material se puede procesar sin pasar
        // por una boleta de salida formal, por eso no define el estado
        public decimal consumed_kg { get; set; }

        // "Pendiente" o "Procesada". Procesada cuando processed_kg +
        // consumed_kg llega a quantity_kg (se puede completar procesando
        // a mano, sacando todo en actas de salida, o una combinacion)
        public string status { get; set; }

        // Fecha en que se completo el procesamiento (quedo en processed_kg
        // == quantity_kg). Null mientras este Pendiente
        public DateTime? processed_at { get; set; }

        // Cuanto de este material ya se proceso a mano, sumando todos los
        // cortes. El detalle de cada corte va en processings
        public decimal processed_kg { get; set; }

        // Historial completo: una fila por cada vez que se proceso una
        // cantidad de esta linea, mas vieja primero
        public List<TicketItemProcessingResponse> processings { get; set; } = new();

        // Plazo del material en el catalogo (Materials.max_management_days).
        // Null si el material no esta en el catalogo con ese descripcion
        // exacta, o si al material del catalogo no se le definio un plazo
        // (materiales creados antes de este campo)
        public int? max_management_days { get; set; }
    }
}
