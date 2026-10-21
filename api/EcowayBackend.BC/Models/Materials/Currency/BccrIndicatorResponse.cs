using System.Text.Json.Serialization;

namespace EcowayBackend.BC.Models.Materials.Currency
{
    // Forma real de la respuesta del API de indicadores economicos del
    // BCCR (apim.bccr.fi.cr), confirmada contra el endpoint en vivo
    public class BccrIndicatorResponse
    {
        [JsonPropertyName("estado")]
        public bool Estado { get; set; }

        [JsonPropertyName("mensaje")]
        public string? Mensaje { get; set; }

        [JsonPropertyName("datos")]
        public List<BccrIndicatorData> Datos { get; set; } = new();
    }

    public class BccrIndicatorData
    {
        [JsonPropertyName("codigoIndicador")]
        public string? CodigoIndicador { get; set; }

        [JsonPropertyName("nombreIndicador")]
        public string? NombreIndicador { get; set; }

        [JsonPropertyName("series")]
        public List<BccrSeriesPoint> Series { get; set; } = new();
    }

    public class BccrSeriesPoint
    {
        [JsonPropertyName("fecha")]
        public string? Fecha { get; set; }

        [JsonPropertyName("valorDatoPorPeriodo")]
        public decimal ValorDatoPorPeriodo { get; set; }
    }
}
