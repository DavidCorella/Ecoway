using EcowayBackend.DA.Entities.Materials.Classify;
using EcowayBackend.DA.Entities.Materials.Currency;
using EcowayBackend.DA.Entities.Materials.Unit;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcowayBackend.DA.Entities.Materials
{
    public class materialsEntityDA
    {
        [Key]
        public Guid id { get; set; } = Guid.CreateVersion7();
        [Required]
        public string Description_Material { get; set; }
        [Required]
        public Guid physical_state { get; set; }
        [ForeignKey("physical_state")]
        public physicalStateEntityDA PhysicalState { get; set; }
        [Required]
        public Guid currecncy { get; set; }
        [ForeignKey("currecncy")]
        public currencyEntityDA Currency { get; set; }
        [Required]
        public Guid classify { get; set; }
        [ForeignKey("classify")]
        public classifyEntityDA Classify { get; set; }
        [Required]
        public Guid unit { get; set; }
        [ForeignKey("unit")]
        public unitEntityDA Unit { get; set; }
        [Required]
        public decimal price { get; set; }

        // Cuantos dias se le da de plazo a este material para gestionarse
        // despues de recolectado, antes de considerarse atrasado
        public int? max_management_days { get; set; }

    }
}
