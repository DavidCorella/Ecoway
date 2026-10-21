using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcowayBackend.DA.Entities.Materials.Currency
{
    [Table("currecy")]
    public class currencyEntityDA
    {
        [Required]
        [Key]
        public Guid id { get; set; } = Guid.CreateVersion7();
        [Required]
        [StringLength(20)]
        public string name_currency { get; set; }
        [Required]
        public decimal price { get; set; }
        [Required]
        public DateTime dateUpdate { get; set; } = DateTime.UtcNow;
    }
}
