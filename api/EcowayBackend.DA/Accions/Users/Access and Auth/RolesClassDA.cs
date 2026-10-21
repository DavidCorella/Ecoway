using EcowayBackend.BC.Models.Users;
using EcowayBackend.BC.Models.Users.PermissionsAndAuth;
using EcowayBackend.BW.Interfaces.DA.Users.PermisionsAndAuth;
using EcowayBackend.DA.Config.Users;
using EcowayBackend.DA.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcowayBackend.DA.Accions.Users
{
    public class RolesClassDA : RolesInterfaceClassDA
    {
        private readonly UsersContext context;
        public RolesClassDA(UsersContext context)
        {
            this.context = context;
        }

        // Sin try/catch: el controller ya atrapa la excepcion,
        // registra el error y detecta el caso de nombre duplicado
        public async Task<roleResponse?> createRoles(roleInput role)
        {
            var entity = new RolesEntityDA { name = role.name };
            await context.Roles.AddAsync(entity);
            int result = await context.SaveChangesAsync();

            if (result <= 0)
                return null;

            return new roleResponse { id = entity.id, name = entity.name };
        }
        // Sin try/catch, igual que createRoles: si el rol
        // todavia esta asignado a algun usuario, borrar la fila de Roles
        // choca con la FK y tiene que reventar para que el controller
        // detecte el error 547 y avise "el rol esta siendo usado" en vez
        // de que esto se trague la excepcion y reporte un false que el
        // controller (y el modal) toman como si nada hubiera pasado
        public async Task<bool> deleteRole(Guid id)
        {
            var role = await context.Roles.FirstOrDefaultAsync(x => x.id == id);

            if (role == null)
                return false;

            var accesses = await context.Access
                .Where(x => x.Role_id == role.id)
                .ToListAsync();

            context.Access.RemoveRange(accesses);
            context.Roles.Remove(role);

            int result = await context.SaveChangesAsync();

            return result > 0;
        }

        public Task<List<roleResponse>> getRoles()
        {
            return context.Roles.Select( x =>
                                            new roleResponse {
                                                id = x.id,
                                                name = x.name
                                            }
                                        ).ToListAsync();
        }

        public Task<List<Screen>> getScreens()
        {
            return context.Screens.Select( x =>
                                                        new Screen {
                                                            name = x.name,
                                                            id = x.id,
                                                        }
                                                    ).ToListAsync();
        }

        // Devuelve bool (no bool?): un ActionResult<bool?> en
        // null hace que ASP.NET Core responda 204 sin cuerpo en vez de
        // "false", y el frontend terminaba mandando un string vacio al
        // guardar los permisos en vez de un booleano real
        public async Task<bool> GetAccess(Guid roleId, Guid screenId)
        {
            return await context.Access
                .Where(a => a.Role_id == roleId &&
                            a.Screen_id == screenId)
                .Select(a => a.Active)
                .FirstOrDefaultAsync();
        }


    // Sin try/catch: si falla, que se vea en ErrorLogs a traves
    // del controller en vez de tragarse la excepcion en silencio sin dejar
    // rastro de por que fallo
    public async Task<bool> SaveAccess(List<accessInput> permissions)
    {
        foreach (var permission in permissions){
            var access = await context.Access
            .FirstOrDefaultAsync(a =>
                a.Role_id == permission.Role_id &&
                a.Screen_id == permission.Screen_id);
            if (access == null){
                access = new AccessEntityDA{
                    Role_id = permission.Role_id,
                    Screen_id = permission.Screen_id,
                    Active = permission.Active ?? false
                };
                context.Access.Add(access);
            }else{
                access.Active = permission.Active ?? false;
            }
        }
        await context.SaveChangesAsync();
        return true;
    }


        public async Task<List<string>> GetScreensByRole(Guid roleGuid)
        {
            return await (
                from a in context.Access
                join s in context.Screens
                    on a.Screen_id equals s.id
                where a.Role_id == roleGuid && a.Active
                select s.name
            ).ToListAsync();
        }

        public async Task<List<Guid?>> GetScreensByRoleIds(Guid roleGuid)
        {

            return await (context.Access
                .Where(a => a.Role_id == roleGuid && a.Active)
                .Select(a => a.Screen_id)
            ).ToListAsync();
        }
    }
}
