using System;
using System.Text.RegularExpressions;
using EcowayBackend.BC.Models.Tickets;

namespace EcowayBackend.BC.BussinesRules.Tickets
{
    public static class CertificateRule
    {
        // Quien firma los certificados es siempre la misma persona, no lo
        // elige quien crea el certificado
        public const string FixedSignerName = "Ing. Carlos Andrés Rincón Apráez";
        public const string FixedSignerPosition = "Gerente general";

        // Mismo patron que usa userRules para validar correos
        private static readonly Regex EmailPattern = new(@"^[^@\s]+@[^@\s]+\.[^@\s]+$", RegexOptions.Compiled | RegexOptions.IgnoreCase);

        public static bool ValidateCertificate(CertificateInput input, out string error)
        {
            error = "";

            if (input == null)
            {
                error = "Datos del certificado inválidos.";
                return false;
            }

            if (string.IsNullOrWhiteSpace(input.certificate_number))
            {
                error = "El número de certificado es obligatorio.";
                return false;
            }

            if (input.certificate_number.Length > 30)
            {
                error = "El número de certificado no puede superar los 30 caracteres.";
                return false;
            }

            if (input.company_id == Guid.Empty)
            {
                error = "Debe seleccionar una empresa.";
                return false;
            }

            if (input.certificate_date_from == default || input.certificate_date_to == default)
            {
                error = "El período del certificado (desde / hasta) es obligatorio.";
                return false;
            }

            if (input.certificate_date_to < input.certificate_date_from)
            {
                error = "La fecha \"hasta\" del certificado no puede ser anterior a la fecha \"desde\".";
                return false;
            }

            if (input.issued_date == default)
            {
                error = "La fecha de emisión es obligatoria.";
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

            if (input.ticket_ids == null || input.ticket_ids.Count == 0)
            {
                error = "Debe seleccionar al menos un acta.";
                return false;
            }

            if (input.items == null || input.items.Count == 0)
            {
                error = "El certificado no tiene materiales para incluir.";
                return false;
            }

            foreach (var item in input.items)
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

                if (item.quantity_kg <= 0)
                {
                    error = "La cantidad en kilos debe ser mayor que cero.";
                    return false;
                }
            }

            return true;
        }
    }
}
