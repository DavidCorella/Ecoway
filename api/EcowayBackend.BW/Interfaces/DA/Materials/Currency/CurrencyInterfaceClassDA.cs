using EcowayBackend.BC.Models.Materials.Currency;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcowayBackend.BW.Interfaces.DA.Materials.Currency
{
    public interface CurrencyInterfaceClassDA
    {
        Task<List<currencyResponse>> GetCurrencies();
        Task<bool> UpdateCurrency(Guid id, decimal price);
    }
}
