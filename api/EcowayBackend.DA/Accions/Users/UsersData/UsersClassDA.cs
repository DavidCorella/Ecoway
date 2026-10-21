using EcowayBackend.BC.Models;
using EcowayBackend.BC.Models.Users.UsersData;
using EcowayBackend.BW.Interfaces.DA.Users.UsersData;
using EcowayBackend.DA.Config.Users;
using EcowayBackend.DA.Entities.Users.PersonalData;
using EcowayBackend.DA.Entities.Users.UsersData;
using Microsoft.EntityFrameworkCore;


namespace EcowayBackend.DA.Accions.Users.UsersData
{
    public class UsersClassDA : UsersInterfaceClassDA
    {
        private readonly UsersContext context;
        public UsersClassDA(UsersContext _context)
        {
            context = _context;
        }

        private IQueryable<userResponse> Projected()
        {
            return
                from u in context.Users
                join p in context.PersonalData
                    on u.id equals p.ID into pd
                    from p in pd.DefaultIfEmpty()
                join o in context.PersonalForeign
                    on u.id equals o.user_id into pf
                    from o in pf.DefaultIfEmpty()
                join n in context.Nationality
                    on u.nationality_id equals n.optionsNationality
                join q in context.Roles
                on u.role equals q.id
                select new userResponse
                {
                    id = u.id,
                    publicId = u.PublicId,
                    email = u.email,
                    role = q.name,
                    is_active = u.is_active,
                    position = u.position,

                    name = u.nationality_id == 1?
                        (p.name ?? "").Trim() + " " +
                        (p.lastname ?? "").Trim() + " " +
                        (p.second_Lastname ?? "").Trim():
                        o.name,

                    Nacionality = n.name
                };
        }

        public async Task<PagedResult<userResponse>> getUsers(
            string? search, string? role, string? status, int page, int pageSize)
        {
            var query = Projected();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim();
                query = query.Where(u => u.name.Contains(term) || u.id.Contains(term));
            }

            if (!string.IsNullOrWhiteSpace(role))
                query = query.Where(u => u.role == role);

            if (status == "Activo")
                query = query.Where(u => u.is_active);
            else if (status == "Inactivo")
                query = query.Where(u => !u.is_active);

            var totalCount = await query.CountAsync();

            var items = await query
                .OrderBy(u => u.name)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new PagedResult<userResponse>
            {
                items = items,
                totalCount = totalCount,
                page = page,
                pageSize = pageSize
            };
        }

        // Solo id y nombre de usuarios activos, sin email ni rol, para
        // que otras pantallas puedan elegir un responsable sin necesitar
        // el permiso completo de Usuarios
        public async Task<List<userLookupResponse>> getActiveResponsibles()
        {
            var users = await (
                from u in context.Users
                where u.is_active
                join p in context.PersonalData
                    on u.id equals p.ID into pd
                    from p in pd.DefaultIfEmpty()
                join o in context.PersonalForeign
                    on u.id equals o.user_id into pf
                    from o in pf.DefaultIfEmpty()
                select new userLookupResponse
                {
                    id = u.id,
                    name = u.nationality_id == 1 ?
                        (p.name ?? "").Trim() + " " +
                        (p.lastname ?? "").Trim() + " " +
                        (p.second_Lastname ?? "").Trim() :
                        o.name
                }
            ).ToListAsync();

            return users;
        }

        // Sin try/catch: el controller ya atrapa la excepcion,
        // detecta el caso de cedula duplicada y registra el error real en
        // vez de tragarselo en silencio
        public async Task<bool> createUser(UserInput user, string name)
        {
            // La validacion ya se hizo antes en userRules.ValidateUser
            user.password = BCrypt.Net.BCrypt.HashPassword(user.password);

            await context.Users.AddAsync(new  UserEntityDA {
                                                 id = user.id,
                                                 nationality_id = user.nationality_id,
                                                 email = user.email,
                                                 role = Guid.Parse(user.role),
                                                 created_at = user.created_at,
                                                 password = user.password,
                                                 position = user.position,
                                               });

            var existingPerson = await context.PersonalForeign
                .FirstOrDefaultAsync(x => x.user_id == user.id);

            if (existingPerson == null && user.nationality_id == 2)
            {
                var personal = new ForeignEntityDA
                {
                    user_id = user.id,
                    name = name
                };

                await context.PersonalForeign.AddAsync(personal);
            }

            int result = await context.SaveChangesAsync();

            return result > 0;
        }

        // No existe metodo para eliminar un usuario, solo se puede activar
        // o inactivar para no perder el historial de auditoria

        public async Task<bool> UpdateUser(userInputEdit user, string? name)
        {
            try
            {
                var existingUser = await context.Users.FirstOrDefaultAsync(x => x.PublicId == user.id );

                if (!string.IsNullOrWhiteSpace(name))
                {
                    var nameexist = await context.PersonalForeign.FirstOrDefaultAsync(x => x.id == user.id);

                    if (nameexist != null)
                    {
                        nameexist.name = name;
                        await context.SaveChangesAsync();
                    }
                }

                if (existingUser == null)
                {
                    return false;
                }

                existingUser.email = user.email;
                existingUser.role = Guid.Parse(user.role);
                existingUser.is_active = user.is_active;
                existingUser.nationality_id = user.nationality_id;
                existingUser.position = user.position;
                existingUser.updated_at = DateTime.UtcNow;

                int result = await context.SaveChangesAsync();

                return result > 0;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error al actualizar el usuario");
                return false;
            }
        }

        public async Task<bool> UpdateActiveUser(Guid id, bool status)
        {
            try
            {
                var existingUser = await context.Users.FirstOrDefaultAsync(x => x.PublicId == id);

                if (existingUser == null)
                {
                    return false;
                }

                existingUser.is_active = status;

                int result = await context.SaveChangesAsync();

                return result > 0;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error al actualizar estado");
                return false;
            }
        }

        public async Task<userCurrentResponse?> GetUserProfile(Guid UUID)
        {
            var id = await context.Users.Where(x => x.PublicId == UUID).Select(x => x.id).FirstOrDefaultAsync();
            var userProfile = await (
                from u in context.Users
                    join p in context.PersonalData
                        on u.id equals p.ID into pd
                from p in pd.DefaultIfEmpty()
                    join n in context.PersonalForeign
                        on u.id equals n.user_id into pf
                from n in pf.DefaultIfEmpty()
                    join r in context.Roles
                        on u.role equals r.id
                 where u.id == id

            select new userCurrentResponse
            {
                id = u.id,
                name = u.nationality_id == 1
                    ? (p.name ?? "").Trim() + " " +
                    (p.lastname ?? "").Trim() + " " +
                    (p.second_Lastname ?? "").Trim()
                    : n.name ?? "",
                role = r.name,
                position = u.position
            }
            ).FirstOrDefaultAsync();

            if (userProfile == null)
            {
                return null;
            }

            return userProfile;
        }
    }
}
