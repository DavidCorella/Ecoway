
using EcowayBackend.BC.Models.Materials.Materials;
using EcowayBackend.BW.Interfaces.DA.Materials.Materials;
using EcowayBackend.DA.Config.Materials;
using EcowayBackend.DA.Entities.Materials;
using Microsoft.EntityFrameworkCore;
namespace EcowayBackend.DA.Accions.Materials
{
    public class materialsClassDA : MaterialsInterfaceClassDA
    {
        private readonly MaterialsContext _context;
        public materialsClassDA(MaterialsContext context)
        {
            _context = context;
        }

        public async Task<List<MaterialResponse>> getMaterials()
        {
            return await _context.Materials.Select(
                    x => new MaterialResponse
                    {
                        id = x.id,
                        unit = x.Unit.name_unit,
                        classify = x.Classify.name_classify,
                        physical_state = x.PhysicalState.name_physicalState,
                        Description_material = x.Description_Material,
                        currency = x.Currency.name_currency,
                        price = x.price,
                        max_management_days = x.max_management_days

                    }).ToListAsync();
        }

        public async Task<bool> createMaterials(MaterialInput model)
        {
            var response = await _context.AddAsync(
                    new materialsEntityDA
                    {
                        unit = model.unit,
                        currecncy = model.currency,
                        classify = model.classify,
                        physical_state = model.physical_state,
                        Description_Material = model.Description_material,
                        price = model.price,
                        max_management_days = model.max_management_days
                    });
            if (response != null)
            {
                _context.SaveChanges();
                return true;
            }
            else
            {
                return false;
            }
        }

        public async Task<bool> editMaterials(MaterialInput model)
        {
            var materialFound = await _context.Materials.FirstOrDefaultAsync(x => x.id == model.id);
            if (materialFound == null)
                return false;

            materialFound.unit = model.unit;
            materialFound.Description_Material = model.Description_material;
            materialFound.classify = model.classify;
            materialFound.physical_state = model.physical_state;
            materialFound.currecncy = model.currency;
            materialFound.price = model.price;
            materialFound.max_management_days = model.max_management_days;

            // Si el usuario guarda sin cambiar nada, SaveChangesAsync no
            // tiene ninguna fila que tocar y devuelve 0 — eso no es un
            // error, el material ya quedo tal cual se pidio
            await _context.SaveChangesAsync();
            return true;
        }
        public async Task<bool> deleteMaterials(Guid id)
        {
            var materialFound = await _context.Materials.FirstOrDefaultAsync(x => x.id == id);
            var res = 0;
            if (materialFound != null)
            {
                _context.Materials.Remove(materialFound);
                res = await _context.SaveChangesAsync();
            }

            return res > 0;
        }
    }
}
