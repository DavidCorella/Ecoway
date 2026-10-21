using EcowayBackend.API.Security;
using EcowayBackend.BC.Models.Materials.Classify;
using EcowayBackend.BC.Models.Materials.Currency;
using EcowayBackend.BC.Models.Materials.Unit;
using EcowayBackend.BC.Realtime;
using EcowayBackend.BW.Interfaces.BW.Logs;
using EcowayBackend.BW.Interfaces.BW.Materials.Classify;
using EcowayBackend.BW.Interfaces.BW.Materials.Currency;
using EcowayBackend.BW.Interfaces.BW.Materials.Unit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;


namespace EcowayBackend.API.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class CurrencyDataController : ControllerBase
    {
        // Id de la pantalla Materiales, se usa para revisar permisos
        private const string MaterialsScreenId = "578701F6-8D78-46C6-8660-A2CF474DBE19";

        private readonly CurrencyInterfaceClassBW _currencyBW;
        private readonly LogsInterfaceClassBW _logsService;
        private readonly IDataChangeNotifier _notifier;

        public CurrencyDataController(CurrencyInterfaceClassBW currency, LogsInterfaceClassBW logsService, IDataChangeNotifier notifier)
        {
            _currencyBW = currency;
            _logsService = logsService;
            _notifier = notifier;
        }

        // Sin ScreenPermission: Cotizaciones tambien necesita
        // el tipo de cambio para convertir colones/dolares, aunque el rol
        // no tenga acceso a la pantalla de Materiales
        [HttpGet("getCurrency")]
        [Authorize]
        public async Task<IActionResult> getCurrency() {
            try
            {
                var result = await _currencyBW.GetCurrecies();

                if (result == null)
                    return BadRequest(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }

        // Un cambio manual dura hasta la proxima actualizacion automatica
        // del job de Hangfire (todos los dias a las 2am), que vuelve a
        // traer el tipo de cambio real desde la API externa
        [HttpPut("UpdateCurrency")]
        [Authorize]
        [ScreenPermission(MaterialsScreenId)]
        public async Task<IActionResult> UpdateCurrency([FromBody] CurrencyInput input)
        {
            try
            {
                var (ok, error) = await _currencyBW.UpdateCurrency(input);

                if (!ok)
                    return BadRequest(new { message = error ?? "No fue posible actualizar el tipo de cambio." });

                await _logsService.LogAudit(User.ActorId(), User.ActorDisplay(), "CURRENCY_UPDATED", $"Moneda {input.id} -> {input.price}");
                await _notifier.NotifyAsync(DataEntities.Currency);

                return Ok(ok);
            }
            catch (Exception ex)
            {
                await _logsService.LogError(ex.Message, "CurrencyData/UpdateCurrency", ex.ToString(), 500);
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }

    }
}
