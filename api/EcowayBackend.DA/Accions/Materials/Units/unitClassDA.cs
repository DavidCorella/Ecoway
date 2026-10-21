using EcowayBackend.BC.Models.Materials.Unit;
using EcowayBackend.BW.Interfaces.DA.Materials.Units;
using EcowayBackend.DA.Config.Materials;
using EcowayBackend.DA.Entities.Materials.Unit;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcowayBackend.DA.Accions.Materials.Units
{
    public class unitClassDA : UnitInterfaceClassDA
    {
        private readonly MaterialsContext context;

        public unitClassDA(MaterialsContext context) {
            this.context = context;
        }
        public async Task<bool> createUnit(unitInput unit) {
            await context.Unit.AddAsync(new unitEntityDA {
                                              name_unit = unit.name_unit,
                                              description_unit = unit.description_unit,
                                            });
            int result = await context.SaveChangesAsync();
            return result > 0;
        }

        public async Task<List<unitResponse>> getUnits() {
            return await context.Unit.Select(x => new unitResponse {
                                                    id = x.id,
                                                    name_unit = x.name_unit,
                                                    description_unit = x.description_unit
                                                  }).ToListAsync();

        }

        public async Task<bool> editUnits(unitInput unit) {
            var unitFound = await context.Unit.FirstOrDefaultAsync(x => x.id == unit.id);
            if (unitFound == null)
                return false;

            unitFound.description_unit = unit.description_unit;
            unitFound.name_unit = unit.name_unit;

            // Si el usuario guarda sin cambiar nada, SaveChangesAsync no
            // tiene ninguna fila que tocar y devuelve 0 — eso no es un
            // error, la unidad ya quedo tal cual se pidio
            await context.SaveChangesAsync();
            return true;
        }
        public async Task<bool> deleteUnit(Guid id) {
            var unit = await context.Unit.FirstOrDefaultAsync(x => x.id == id);
            var res = 0;
            if (unit != null) {
                context.Unit.Remove(unit);
                res = await context.SaveChangesAsync();
            }

            return res > 0;
        }
    }

    }

