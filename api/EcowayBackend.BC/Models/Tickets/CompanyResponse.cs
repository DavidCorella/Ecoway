using System;

namespace EcowayBackend.BC.Models.Tickets
{
    public class CompanyResponse
    {
        public Guid id { get; set; }
        public string nombre_comercial { get; set; }
        public string razon_social { get; set; }
        public string cedula_juridica { get; set; }
        public string address { get; set; }
        public string contact_name { get; set; }
        public string contact_id { get; set; }
        public string contact_position { get; set; }
        public string contact_phone { get; set; }
        public string contact_cell { get; set; }
        public string email { get; set; }
        public string? project { get; set; }
        public bool is_active { get; set; }
    }
}
