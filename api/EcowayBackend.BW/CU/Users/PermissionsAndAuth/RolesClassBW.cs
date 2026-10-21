using EcowayBackend.BC.BussinesRules.Users.PermissionsAndAuth;
using EcowayBackend.BC.Models.Users.PermissionsAndAuth;
using EcowayBackend.BW.Interfaces.BW.Users.PermisionsAndAuth;
using EcowayBackend.BW.Interfaces.DA.Users.PermisionsAndAuth;


namespace EcowayBackend.BW.CU.Users.PermissionsAndAuth
{
    public class RolesClassBW : RolesInterfaceClassBW
    {
        private readonly RolesInterfaceClassDA _getRolesClassInterfaceDA;

        public RolesClassBW(RolesInterfaceClassDA _getRolesClassInterfaceDA)
        {
            this._getRolesClassInterfaceDA = _getRolesClassInterfaceDA;
        }

        public Task<roleResponse?> createRoles(roleInput role)
        {
            return RoleRule.RoleIDValid(role.name) ? _getRolesClassInterfaceDA.createRoles(role) : Task.FromResult<roleResponse?>(null);
        }

        public Task<List<roleResponse>> getRoles()
        {
           return _getRolesClassInterfaceDA.getRoles();
        }

        public Task<List<Screen>> getScreen()
        {
            return _getRolesClassInterfaceDA.getScreens();
        }

        public Task<bool> GetAccess(Guid roleId, Guid screenId) {
            return _getRolesClassInterfaceDA.GetAccess(roleId, screenId);
        }

        public Task<bool> SaveAccess(List<accessInput> permissions){
            return _getRolesClassInterfaceDA.SaveAccess(permissions);
        }

        public Task<bool> deleteRole(Guid id) {
            return RoleRule.RoleID(id) ? _getRolesClassInterfaceDA.deleteRole(id) : Task.FromResult(false);
        }
        public Task<List<string>> GetScreensByRole(Guid roleId) {
            return RoleRule.RoleID(roleId) ? _getRolesClassInterfaceDA.GetScreensByRole(roleId) : Task.FromResult(new List<string>());
        }
        public Task<List<Guid?>> GetScreensByRoleIds(Guid roleId)
        {
            return RoleRule.RoleID(roleId) ? _getRolesClassInterfaceDA.GetScreensByRoleIds(roleId) : Task.FromResult(new List<Guid?>());
        }
    }
}
