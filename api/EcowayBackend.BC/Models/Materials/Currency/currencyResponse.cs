using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcowayBackend.BC.Models.Materials.Currency
{
    public class currencyResponse
    {
        public Guid id { get; set; }
        public string name_currency { get; set; }
        public decimal price { get; set; }
        public DateTime dateUpdate { get; set; } = DateTime.UtcNow;
    }
}
