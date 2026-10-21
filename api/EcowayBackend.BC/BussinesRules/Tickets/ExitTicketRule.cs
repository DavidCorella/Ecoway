using EcowayBackend.BC.Models.Tickets;

namespace EcowayBackend.BC.BussinesRules.Tickets
{
    public static class ExitTicketRule
    {
        public static bool ValidateExitTicket(ExitTicketInput input, out string error)
        {
            error = "";

            if (input == null)
            {
                error = "Datos del acta de salida inválidos.";
                return false;
            }

            if (string.IsNullOrWhiteSpace(input.exit_ticket_number))
            {
                error = "El número de acta es obligatorio.";
                return false;
            }

            if (input.destination_company_id == Guid.Empty)
            {
                error = "Debe seleccionar una empresa de destino.";
                return false;
            }

            if (input.exit_date == default)
            {
                error = "La fecha del acta es obligatoria.";
                return false;
            }

            if (string.IsNullOrWhiteSpace(input.receiver_responsible_name))
            {
                error = "El nombre del responsable por el receptor es obligatorio.";
                return false;
            }

            if (string.IsNullOrWhiteSpace(input.receiver_responsible_id))
            {
                error = "La cédula del responsable por el receptor es obligatoria.";
                return false;
            }

            if (string.IsNullOrWhiteSpace(input.ecoway_responsible_name) ||
                string.IsNullOrWhiteSpace(input.ecoway_responsible_id))
            {
                error = "Debe indicar el responsable por EcoWay.";
                return false;
            }

            // La foto del acta es opcional

            if (input.items == null || input.items.Count == 0)
            {
                error = "Debe registrar al menos un material entregado.";
                return false;
            }

            foreach (var item in input.items)
            {
                if (string.IsNullOrWhiteSpace(item.material_description))
                {
                    error = "Cada línea debe indicar el material entregado.";
                    return false;
                }

                if (item.quantity_kg <= 0)
                {
                    error = "La cantidad entregada en kilos debe ser mayor que cero.";
                    return false;
                }
            }

            return true;
        }
    }
}
