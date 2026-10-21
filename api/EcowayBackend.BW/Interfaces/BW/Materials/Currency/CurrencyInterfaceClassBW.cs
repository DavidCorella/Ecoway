using EcowayBackend.BC.Models.Materials.Currency;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcowayBackend.BW.Interfaces.BW.Materials.Currency
{
    public interface CurrencyInterfaceClassBW
    {
        Task<List<currencyResponse>> GetCurrecies();

        // Un cambio manual dura hasta la proxima actualizacion automatica
        // del job de Hangfire (todos los dias a las 2am)
        Task<(bool ok, string? error)> UpdateCurrency(CurrencyInput input);
    }
}
