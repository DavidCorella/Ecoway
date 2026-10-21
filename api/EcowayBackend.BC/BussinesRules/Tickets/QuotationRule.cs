using System;
using System.Linq;
using System.Text.RegularExpressions;
using EcowayBackend.BC.Models.Tickets;

namespace EcowayBackend.BC.BussinesRules.Tickets
{
    public static class QuotationRule
    {
        // Solo se permite 13% de impuesto o exento, no cualquier numero
        private static readonly decimal[] AllowedTaxRates = { 0m, 13m };

        // Monedas en las que se puede facturar una cotizacion
        private static readonly string[] AllowedCurrencies = { "USD", "CRC" };

        // Mismo patron que usa userRules para validar correos
        private static readonly Regex EmailPattern = new(@"^[^@\s]+@[^@\s]+\.[^@\s]+$", RegexOptions.Compiled | RegexOptions.IgnoreCase);

        // El numero sugerido es "correlativo-año" (ej "1-26"), solo digitos
        // y guiones, nada de letras
        private static readonly Regex QuotationNumberPattern = new(@"^[0-9-]+$", RegexOptions.Compiled);

        public static bool ValidateQuotation(QuotationInput input, out string error)
        {
            error = "";

            if (input == null)
            {
                error = "Datos de la cotización inválidos.";
                return false;
            }

            if (string.IsNullOrWhiteSpace(input.quotation_number))
            {
                error = "El número de cotización es obligatorio.";
                return false;
            }

            if (!QuotationNumberPattern.IsMatch(input.quotation_number))
            {
                error = "El número de cotización solo puede contener números y guiones.";
                return false;
            }

            if (input.quotation_number.Length > 30)
            {
                error = "El número de cotización no puede superar los 30 caracteres.";
                return false;
            }

            if (input.company_id == Guid.Empty)
            {
                error = "Debe seleccionar una empresa.";
                return false;
            }

            if (input.quotation_date == default)
            {
                error = "La fecha de la cotización es obligatoria.";
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

            // service_description no se valida, es el unico campo que
            // puede quedar vacio
            if (string.IsNullOrWhiteSpace(input.delivery_condition))
            {
                error = "La condición de entrega es obligatoria.";
                return false;
            }

            if (string.IsNullOrWhiteSpace(input.payment_terms))
            {
                error = "Los términos de pago son obligatorios.";
                return false;
            }

            if (string.IsNullOrWhiteSpace(input.ownership_conditions))
            {
                error = "Las condiciones de propiedad del residuo son obligatorias.";
                return false;
            }

            if (string.IsNullOrWhiteSpace(input.incident_responsibility))
            {
                error = "La responsabilidad por incidentes es obligatoria.";
                return false;
            }

            if (string.IsNullOrWhiteSpace(input.force_majeure_conditions))
            {
                error = "Las condiciones de fuerza mayor son obligatorias.";
                return false;
            }

            if (string.IsNullOrWhiteSpace(input.other_conditions))
            {
                error = "Las otras condiciones son obligatorias.";
                return false;
            }

            if (string.IsNullOrWhiteSpace(input.signer_name))
            {
                error = "El nombre de quien firma es obligatorio.";
                return false;
            }

            if (input.signer_name.Length > 150)
            {
                error = "El nombre de quien firma no puede superar los 150 caracteres.";
                return false;
            }

            if (string.IsNullOrWhiteSpace(input.signer_position))
            {
                error = "El puesto de quien firma es obligatorio.";
                return false;
            }

            if (input.signer_position.Length > 150)
            {
                error = "El puesto de quien firma no puede superar los 150 caracteres.";
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

            // El flete es opcional (puede no haber ninguno), pero si hay
            // lineas ninguna puede quedar en negativo, y la cantidad de
            // fletes de cada linea debe ser al menos 1
            if (input.freights != null)
            {
                foreach (var freight in input.freights)
                {
                    if (freight.cost < 0)
                    {
                        error = "El costo de cada flete no puede ser negativo.";
                        return false;
                    }

                    if (freight.quantity <= 0)
                    {
                        error = "La cantidad de cada flete debe ser mayor que cero.";
                        return false;
                    }

                    if (freight.description != null && freight.description.Length > 200)
                    {
                        error = "La descripción de cada flete no puede superar los 200 caracteres.";
                        return false;
                    }
                }
            }

            if (input.validity_days <= 0)
            {
                error = "La validez de la oferta debe ser mayor a cero días.";
                return false;
            }

            if (input.items == null || input.items.Count == 0)
            {
                error = "Debe registrar al menos un material cotizado.";
                return false;
            }

            foreach (var item in input.items)
            {
                if (string.IsNullOrWhiteSpace(item.material_description))
                {
                    error = "Cada línea debe indicar el material cotizado.";
                    return false;
                }

                if (item.material_description.Length > 200)
                {
                    error = "El nombre del material cotizado no puede superar los 200 caracteres.";
                    return false;
                }

                if (item.quantity_kg <= 0)
                {
                    error = "La cantidad cotizada en kilos debe ser mayor que cero.";
                    return false;
                }

                if (item.cost < 0)
                {
                    error = "El costo de cada línea no puede ser negativo.";
                    return false;
                }

                if (item.comment != null && item.comment.Length > 300)
                {
                    error = "El comentario de cada línea no puede superar los 300 caracteres.";
                    return false;
                }
            }

            return true;
        }
    }
}
