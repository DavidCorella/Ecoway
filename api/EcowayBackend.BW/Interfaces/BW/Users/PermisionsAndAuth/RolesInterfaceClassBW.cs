using EcowayBackend.BC.Models.Users.PermissionsAndAuth;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcowayBackend.BW.Interfaces.BW.Users.PermisionsAndAuth
{
    public interface RolesInterfaceClassBW
    {
        Task<List<roleResponse>> getRoles();
        Task<roleResponse?> createRoles(roleInput role);
        Task<List<Screen>> getScreen();
        Task<bool> GetAccess(Guid roleId, Guid screenId);
        Task<bool> SaveAccess(List<accessInput> permissions);
        Task<bool> deleteRole(Guid id);
        Task<List<string>> GetScreensByRole(Guid roleId);
        Task<List<Guid?>> GetScreensByRoleIds(Guid roleId);
    }
}
