using System.Text.RegularExpressions;
using EcowayBackend.BC.Models;
using EcowayBackend.BC.Models.Tickets;
using EcowayBackend.BW.Interfaces.BW.Tickets;
using EcowayBackend.BW.Interfaces.DA.Tickets;

namespace EcowayBackend.BW.CU.Tickets
{
    public class CompanyClassBW : CompanyInterfaceClassBW
    {
        private readonly CompanyInterfaceClassDA _companyDA;

        // Cedula juridica: 1 digito, guion, 3 digitos, guion, 6 digitos
        // (ej: 3-101-494504). Los guiones son obligatorios
        private static readonly Regex CedulaJuridicaPattern = new(@"^\d-\d{3}-\d{6}$", RegexOptions.Compiled);
        // Telefono/celular: solo digitos, sin guiones ni espacios
        private static readonly Regex PhonePattern = new(@"^[0-9]+$", RegexOptions.Compiled);
        // Mismo patron que usa userRules para validar el correo de los usuarios
        private static readonly Regex EmailPattern = new(@"^[^@\s]+@[^@\s]+\.[^@\s]+$", RegexOptions.Compiled | RegexOptions.IgnoreCase);

        public CompanyClassBW(CompanyInterfaceClassDA companyDA)
        {
            _companyDA = companyDA;
        }

        public Task<List<CompanyResponse>> getCompanies() => _companyDA.getCompanies();

        public Task<PagedResult<CompanyResponse>> getCompaniesPaged(string? search, string? status, int page, int pageSize) =>
            _companyDA.getCompaniesPaged(search, status, page, pageSize);

        private static bool Validate(CompanyInput input, out string? error)
        {
            error = null;

            if (string.IsNullOrWhiteSpace(input.nombre_comercial))
                error = "El nombre comercial es obligatorio.";
            else if (string.IsNullOrWhiteSpace(input.razon_social))
                error = "La razón social es obligatoria.";
            else if (string.IsNullOrWhiteSpace(input.cedula_juridica))
                error = "La cédula jurídica es obligatoria.";
            else if (!CedulaJuridicaPattern.IsMatch(input.cedula_juridica))
                error = "La cédula jurídica debe tener el formato X-XXX-XXXXXX (ej: 3-101-123456).";
            else if (string.IsNullOrWhiteSpace(input.address))
                error = "La dirección de la empresa es obligatoria.";
            else if (string.IsNullOrWhiteSpace(input.contact_name))
                error = "El nombre de contacto es obligatorio.";
            else if (string.IsNullOrWhiteSpace(input.contact_id))
                error = "La cédula de contacto es obligatoria.";
            else if (string.IsNullOrWhiteSpace(input.contact_position))
                error = "El cargo de contacto es obligatorio.";
            else if (string.IsNullOrWhiteSpace(input.contact_phone))
                error = "El teléfono de contacto es obligatorio.";
            else if (!PhonePattern.IsMatch(input.contact_phone))
                error = "El teléfono de contacto solo puede contener números.";
            else if (string.IsNullOrWhiteSpace(input.contact_cell))
                error = "El celular de contacto es obligatorio.";
            else if (!PhonePattern.IsMatch(input.contact_cell))
                error = "El celular de contacto solo puede contener números.";
            else if (string.IsNullOrWhiteSpace(input.email))
                error = "El correo de la empresa es obligatorio.";
            else if (!EmailPattern.IsMatch(input.email))
                error = "El correo de la empresa no tiene un formato válido.";

            return error == null;
        }

        public async Task<(bool ok, string? error)> createCompany(CompanyInput input)
        {
            if (!Validate(input, out var error))
                return (false, error);

            var ok = await _companyDA.createCompany(input);
            return (ok, ok ? null : "No fue posible crear la empresa.");
        }

        public async Task<(bool ok, string? error)> editCompany(CompanyInput input)
        {
            if (input.id == null)
                return (false, "Falta el identificador de la empresa.");

            if (!Validate(input, out var error))
                return (false, error);

            var ok = await _companyDA.editCompany(input);
            return (ok, ok ? null : "La empresa no existe.");
        }

        public Task<bool> updateCompanyStatus(Guid id, bool status) => _companyDA.updateCompanyStatus(id, status);
    }
}
