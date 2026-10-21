using EcowayBackend.BC.Models.Materials.Currency;
using EcowayBackend.BW.Interfaces.DA.Materials.Currency;
using EcowayBackend.DA.Config.Materials;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcowayBackend.DA.Accions.Materials.Currency
{
    public class CurrencyClassDA :CurrencyInterfaceClassDA
    {
        private readonly MaterialsContext _currencyContext;
        public CurrencyClassDA(MaterialsContext _context) {
            _currencyContext = _context;
        }

        public async Task<List<currencyResponse>> GetCurrencies()
        {
            var currencies = await _currencyContext.Currency.Select(x => new currencyResponse {
                                                                                id = x.id,
                                                                                name_currency = x.name_currency,
                                                                                price = x.price,
                                                                                dateUpdate = x.dateUpdate
                                                                                }).ToListAsync();
            return currencies;
        }

        public async Task<bool> UpdateCurrency(Guid id, decimal price)
        {
            var currency = await _currencyContext.Currency.FirstOrDefaultAsync(x => x.id == id);

            if (currency == null)
                return false;

            currency.price = price;
            currency.dateUpdate = DateTime.UtcNow;

            return await _currencyContext.SaveChangesAsync() > 0;
        }
    }
}
