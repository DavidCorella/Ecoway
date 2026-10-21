using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using EcowayBackend.BC.Models.Tickets;

namespace EcowayBackend.BC.BussinesRules.Tickets
{
    public static class CollectionSummaryRule
    {
        private static readonly decimal[] AllowedTaxRates = { 0m, 13m };

        // Monedas en las que se puede generar un resumen
        private static readonly string[] AllowedCurrencies = { "USD", "CRC" };

        // Mismo patron que usa userRules para validar correos
        private static readonly Regex EmailPattern = new(@"^[^@\s]+@[^@\s]+\.[^@\s]+$", RegexOptions.Compiled | RegexOptions.IgnoreCase);

        public static bool ValidateSummary(CollectionSummaryInput input, out string error)
        {
            error = "";

            if (input == null)
            {
                error = "Datos del resumen inválidos.";
                return false;
            }

            if (string.IsNullOrWhiteSpace(input.summary_number))
            {
                error = "El número interno del resumen es obligatorio.";
                return false;
            }

            if (input.summary_number.Length > 30)
            {
                error = "El número interno del resumen no puede superar los 30 caracteres.";
                return false;
            }

            if (input.company_id == Guid.Empty)
            {
                error = "Debe seleccionar una empresa.";
                return false;
            }

            if (input.date_from == default || input.date_to == default)
            {
                error = "El rango de fechas es obligatorio.";
                return false;
            }

            if (input.date_to < input.date_from)
            {
                error = "La fecha final no puede ser anterior a la inicial.";
                return false;
            }

            if (string.IsNullOrWhiteSpace(input.period_label))
            {
                error = "La etiqueta del período es obligatoria.";
                return false;
            }

            if (input.period_label.Length > 150)
            {
                error = "La etiqueta del período no puede superar los 150 caracteres.";
                return false;
            }

            if (string.IsNullOrWhiteSpace(input.contact_name))
            {
                error = "El nombre del contacto es obligatorio.";
                return false;
            }

            if (input.contact_name.Length > 150)
            {
                error = "El nombre del contacto no puede superar los 150 caracteres.";
                return false;
            }

            if (string.IsNullOrWhiteSpace(input.contact_position))
            {
                error = "El cargo del contacto es obligatorio.";
                return false;
            }

            if (input.contact_position.Length > 100)
            {
                error = "El cargo del contacto no puede superar los 100 caracteres.";
                return false;
            }

            if (string.IsNullOrWhiteSpace(input.contact_phone))
            {
                error = "El teléfono del contacto es obligatorio.";
                return false;
            }

            if (input.contact_phone.Length > 30)
            {
                error = "El teléfono del contacto no puede superar los 30 caracteres.";
                return false;
            }

            if (string.IsNullOrWhiteSpace(input.contact_cell))
            {
                error = "El celular del contacto es obligatorio.";
                return false;
            }

            if (input.contact_cell.Length > 30)
            {
                error = "El celular del contacto no puede superar los 30 caracteres.";
                return false;
            }

            if (string.IsNullOrWhiteSpace(input.contact_email))
            {
                error = "El correo electrónico del contacto es obligatorio.";
                return false;
            }

            if (input.contact_email.Length > 150)
            {
                error = "El correo electrónico del contacto no puede superar los 150 caracteres.";
                return false;
            }

            if (!EmailPattern.IsMatch(input.contact_email))
            {
                error = "El correo electrónico del contacto no tiene un formato válido.";
                return false;
            }

            if (!AllowedTaxRates.Contains(input.tax_rate))
            {
                error = "El impuesto debe ser 13% o 0%.";
                return false;
            }

            if (string.IsNullOrWhiteSpace(input.currency) || !AllowedCurrencies.Contains(input.currency.ToUpper()))
            {
                error = "La moneda debe ser colones (CRC) o dólares (USD).";
                return false;
            }

            if (input.exchange_rate <= 0)
            {
                error = "El tipo de cambio debe ser mayor a cero.";
                return false;
            }

            if (input.ticket_ids == null || input.ticket_ids.Count == 0)
            {
                error = "Debe seleccionar al menos un acta.";
                return false;
            }

            // El flete es opcional: puede no haber ninguno (igual que en
            // Actas y Cotizaciones). Si hay, cada uno debe corresponder a
            // una acta incluida en el resumen: la cantidad no la escribe
            // el usuario, sale del freight_count de esa acta
            foreach (var freight in input.freights ?? new List<CollectionSummaryFreightInput>())
            {
                if (freight.cost < 0)
                {
                    error = "El costo de cada flete no puede ser negativo.";
                    return false;
                }

                if (!input.ticket_ids.Contains(freight.ticket_id))
                {
                    error = "Cada flete debe corresponder a una acta incluida en el resumen.";
                    return false;
                }

                if (freight.description != null && freight.description.Length > 200)
                {
                    error = "La descripción de cada flete no puede superar los 200 caracteres.";
                    return false;
                }
            }

            if (input.material_prices == null || input.material_prices.Count == 0)
            {
                error = "Las actas elegidas no tienen materiales para incluir.";
                return false;
            }

            foreach (var item in input.material_prices)
            {
                if (string.IsNullOrWhiteSpace(item.material_description))
                {
                    error = "Cada línea debe indicar el material.";
                    return false;
                }

                if (item.material_description.Length > 200)
                {
                    error = "El nombre del material no puede superar los 200 caracteres.";
                    return false;
                }

                if (item.price_per_kg < 0)
                {
                    error = "El precio por kilo no puede ser negativo.";
                    return false;
                }

                if (item.comment != null && item.comment.Length > 300)
                {
                    error = "El comentario de cada material no puede superar los 300 caracteres.";
                    return false;
                }
            }

            return true;
        }
    }
}
