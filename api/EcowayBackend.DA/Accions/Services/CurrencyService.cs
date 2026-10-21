using EcowayBackend.BC.Models.Materials.Currency;
using EcowayBackend.BW.Interfaces.BW.Logs;
using EcowayBackend.BW.Interfaces.Services;
using EcowayBackend.DA.Config.Materials;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System.Net.Http.Headers;
using System.Text.Json;

namespace EcowayBackend.BW.Services
{
    public class CurrencyService : ICurrencyService
    {
        // Codigo del indicador "Tipo de cambio de venta" del BCCR. La
        // otra moneda que maneja el sistema es USD, que siempre vale 1
        private const string BccrIndicatorCode = "318";

        private readonly MaterialsContext _context;

        private readonly HttpClient _httpClient;
        private readonly LogsInterfaceClassBW _logsService;
        private readonly IConfiguration _configuration;

        public CurrencyService(
            MaterialsContext context,
            HttpClient httpClient,
            LogsInterfaceClassBW logsService,
            IConfiguration configuration)
        {
            _context = context;
            _httpClient = httpClient;
            _logsService = logsService;
            _configuration = configuration;
        }

        public async Task UpdateCurrencies()
        {
            try
            {
                var token = _configuration["Bccr:Token"];

                if (string.IsNullOrWhiteSpace(token))
                {
                    await _logsService.LogError("Falta configurar Bccr:Token", "HangfireJobs/UpdatePrice", null, null);
                    return;
                }

                // Se pide una ventana de varios dias, no solo hoy: si el
                // BCCR todavia no publico el dato de hoy (corre a las 2am)
                // o cae fin de semana/feriado, igual se agarra el ultimo
                // valor disponible en vez de fallar
                var hoy = DateTime.UtcNow;
                var desde = hoy.AddDays(-7);

                var url = "https://apim.bccr.fi.cr/SDDE/api/Bccr.GE.SDDE.Publico.Indicadores.API" +
                          $"/indicadoresEconomicos/{BccrIndicatorCode}/series" +
                          $"?fechaInicio={desde:yyyy/MM/dd}&fechaFin={hoy:yyyy/MM/dd}&idioma=ES";

                using var request = new HttpRequestMessage(HttpMethod.Get, url);
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

                var response = await _httpClient.SendAsync(request);
                response.EnsureSuccessStatusCode();

                var json = await response.Content.ReadAsStringAsync();

                var data = JsonSerializer.Deserialize<BccrIndicatorResponse>(
                    json,
                    new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                // El ultimo elemento de la serie es el dato mas reciente
                // disponible dentro de la ventana pedida
                var lastPoint = data?.Datos?.FirstOrDefault()?.Series?.LastOrDefault();

                if (data?.Estado != true || lastPoint == null)
                {
                    await _logsService.LogError(
                        $"Respuesta del BCCR sin datos utilizables: {data?.Mensaje}",
                        "HangfireJobs/UpdatePrice", json, null);
                    return;
                }

                // El tipo de cambio solo maneja 2 decimales
                var crcRate = Math.Round(lastPoint.ValorDatoPorPeriodo, 2, MidpointRounding.AwayFromZero);

                var currencies = await _context.Currency.ToListAsync();

                foreach (var currency in currencies)
                {
                    var code = currency.name_currency.Trim().ToUpper();

                    if (code == "USD")
                        currency.price = 1;
                    else if (code == "CRC")
                        currency.price = crcRate;
                    else
                        continue;

                    currency.dateUpdate = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();

                // El actor va en null porque esto lo ejecuta el job de
                // Hangfire, no una persona
                await _logsService.LogAudit(null, "SYSTEM", "CURRENCY_RATES_UPDATED", $"{currencies.Count} monedas actualizadas (BCCR {lastPoint.Fecha}: {crcRate})");
            }
            catch (Exception ex)
            {
                await _logsService.LogError(ex.Message, "HangfireJobs/UpdatePrice", ex.ToString(), null);
                throw;
            }
        }
    }
}

