using EcowayBackend.BC.Models.Users.PermissionsAndAuth;


namespace EcowayBackend.BW.Interfaces.DA.Users.PermisionsAndAuth
{
    public interface RolesInterfaceClassDA
    {
        Task<List<roleResponse>> getRoles();
        Task<roleResponse?> createRoles(roleInput role);
        Task<List<Screen>> getScreens();
        Task<bool> GetAccess(Guid roleId, Guid screenId);
        Task<bool> SaveAccess(List<accessInput> permissions);
        Task<bool> deleteRole(Guid id);
        Task<List<string>> GetScreensByRole(Guid roleId);
        Task<List<Guid?>> GetScreensByRoleIds(Guid roleId);
    }
}
