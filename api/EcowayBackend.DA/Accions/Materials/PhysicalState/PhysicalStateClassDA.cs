using EcowayBackend.BC.Models.Materials;
using EcowayBackend.BC.Models.Materials.PhysicalState;
using EcowayBackend.BW.Interfaces.DA.Materials.PhysicalState;
using EcowayBackend.DA.Config.Materials;
using EcowayBackend.DA.Entities.Materials.Classify;
using Microsoft.EntityFrameworkCore;

namespace EcowayBackend.DA.Accions.Materials.Classify
{
    public class PhysicalStateClassDA:physicalStateInterfaceClassDA
    {

        private readonly MaterialsContext _context;
        public PhysicalStateClassDA(MaterialsContext context) {
            _context = context;
        }

        public async Task<List<physical_stateResponse>> getPhysicalState()
        {
            return await _context.PhysicalState.Select(
                    x => new physical_stateResponse
                    {
                        id = x.id,
                        name_physicalState = x.name_physicalState,
                        Description_physicalState = x.Description_physicalState
                    }).ToListAsync();
        }

        public async Task<bool> createPhysicalState(physical_stateInput model) {
            var response = await _context.AddAsync(
                    new physicalStateEntityDA {
                        name_physicalState = model.name_physicalState,
                        Description_physicalState = model.Description_physicalState
                    });
            if (response != null)
            {
                _context.SaveChanges();
                return true;
            }
            else {
                return false;
            }
        }

        public async Task<bool> editPhysicalState(physical_stateInput model)
        {
            var physicalStateFound = await _context.PhysicalState.FirstOrDefaultAsync(x => x.id == model.id);
            if (physicalStateFound == null)
                return false;

            physicalStateFound.name_physicalState = model.name_physicalState;
            physicalStateFound.Description_physicalState = model.Description_physicalState;

            // Si el usuario guarda sin cambiar nada, SaveChangesAsync no
            // tiene ninguna fila que tocar y devuelve 0 — eso no es un
            // error, el estado fisico ya quedo tal cual se pidio
            await _context.SaveChangesAsync();
            return true;
        }
        public async Task<bool> deletePhysicalState(Guid id)
        {
            var physicalStateFound = await _context.PhysicalState.FirstOrDefaultAsync(x => x.id == id);
            var res = 0;
            if (physicalStateFound != null)
            {
                _context.PhysicalState.Remove(physicalStateFound);
                res = await _context.SaveChangesAsync();
            }

            return res > 0;
        }
    }
}
