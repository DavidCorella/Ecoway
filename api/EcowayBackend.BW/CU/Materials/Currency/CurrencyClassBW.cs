using EcowayBackend.BC.Models.Materials.Currency;
using EcowayBackend.BW.Interfaces.BW.Materials.Currency;
using EcowayBackend.BW.Interfaces.DA.Materials.Currency;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcowayBackend.BW.CU.Materials.Currency
{
    public class CurrencyClassBW:CurrencyInterfaceClassBW
    {
        private readonly CurrencyInterfaceClassDA _currency;

        public CurrencyClassBW(CurrencyInterfaceClassDA currency) {
            _currency = currency;
        }

        public async Task<List<currencyResponse>> GetCurrecies(){
            return await _currency.GetCurrencies();
        }

        public async Task<(bool ok, string? error)> UpdateCurrency(CurrencyInput input)
        {
            if (input.price <= 0)
                return (false, "El tipo de cambio debe ser mayor a cero.");

            // El tipo de cambio solo maneja 2 decimales
            var price = Math.Round(input.price, 2, MidpointRounding.AwayFromZero);

            var ok = await _currency.UpdateCurrency(input.id, price);
            return (ok, ok ? null : "La moneda no existe.");
        }
    }
}
