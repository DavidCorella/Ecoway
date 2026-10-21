using EcowayBackend.BC.Models.Materials.Classify;
using EcowayBackend.BW.Interfaces.DA.Materials.Classify;
using EcowayBackend.DA.Config.Materials;
using EcowayBackend.DA.Entities.Materials.Classify;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcowayBackend.DA.Accions.Materials.Classify
{
    public class classifyClassDA: classifyInterfaceClassDA
    {

        private readonly MaterialsContext _context;
        public classifyClassDA(MaterialsContext context) {
            _context = context;
        }

        public async Task<List<classifyResponse>> getClassify()
        {
            return await _context.Classify.Select(
                    x => new classifyResponse
                    {
                        id = x.id,
                        name_classify = x.name_classify,
                        Description_classify = x.Description_classify
                    }).ToListAsync();
        }

        public async Task<bool> createClassify(classifyInput model) {
            var response = await _context.AddAsync(
                    new classifyEntityDA { 
                            name_classify = model.name_classify, 
                            Description_classify = model.Description_classify});
            if (response != null)
            {
                _context.SaveChanges();
                return true;
            }
            else {
                return false;
            }
        }

        public async Task<bool> editClassify(classifyInput model)
        {
            var classifyFound = await _context.Classify.FirstOrDefaultAsync(x => x.id == model.id);
            if (classifyFound == null)
                return false;

            classifyFound.name_classify = model.name_classify;
            classifyFound.Description_classify = model.Description_classify;

            // Si el usuario guarda sin cambiar nada, SaveChangesAsync no
            // tiene ninguna fila que tocar y devuelve 0 — eso no es un
            // error, la categoria ya quedo tal cual se pidio
            await _context.SaveChangesAsync();
            return true;
        }
        public async Task<bool> deleteClassify(Guid id)
        {
            var classifyFound = await _context.Classify.FirstOrDefaultAsync(x => x.id == id);
            var res = 0;
            if (classifyFound != null)
            {
                _context.Classify.Remove(classifyFound);
                res = await _context.SaveChangesAsync();
            }

            return res > 0;
        }
    }
}
