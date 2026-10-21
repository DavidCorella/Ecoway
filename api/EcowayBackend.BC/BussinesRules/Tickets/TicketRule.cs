using EcowayBackend.BC.Models.Tickets;

namespace EcowayBackend.BC.BussinesRules.Tickets
{
    public static class TicketRule
    {
        public static bool ValidateTicket(TicketInput input, out string error)
        {
            error = "";

            if (input == null)
            {
                error = "Datos del acta inválidos.";
                return false;
            }

            if (string.IsNullOrWhiteSpace(input.ticket_number))
            {
                error = "El número de acta es obligatorio.";
                return false;
            }

            if (input.company_id == Guid.Empty)
            {
                error = "Debe seleccionar una empresa generadora.";
                return false;
            }

            if (input.ticket_date == default)
            {
                error = "La fecha del acta es obligatoria.";
                return false;
            }

            if (string.IsNullOrWhiteSpace(input.client_responsible_name))
            {
                error = "El nombre del responsable por el cliente es obligatorio.";
                return false;
            }

            if (string.IsNullOrWhiteSpace(input.client_responsible_id))
            {
                error = "La cédula del responsable por el cliente es obligatoria.";
                return false;
            }

            if (string.IsNullOrWhiteSpace(input.ecoway_responsible_name) ||
                string.IsNullOrWhiteSpace(input.ecoway_responsible_id))
            {
                error = "Debe indicar el responsable por EcoWay.";
                return false;
            }

            // La foto del acta es opcional

            if (input.freight_count < 0)
            {
                error = "La cantidad de fletes no puede ser negativa.";
                return false;
            }

            if (input.items == null || input.items.Count == 0)
            {
                error = "Debe registrar al menos un material recolectado.";
                return false;
            }

            foreach (var item in input.items)
            {
                if (string.IsNullOrWhiteSpace(item.material_description))
                {
                    error = "Cada línea debe indicar el material recolectado.";
                    return false;
                }

                if (item.quantity_kg <= 0)
                {
                    error = "La cantidad recolectada en kilos debe ser mayor que cero.";
                    return false;
                }
            }

            return true;
        }
    }
}
