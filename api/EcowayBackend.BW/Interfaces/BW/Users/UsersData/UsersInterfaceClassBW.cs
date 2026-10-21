using EcowayBackend.BC.Models;
using EcowayBackend.BC.Models.Users.UsersData;


namespace EcowayBackend.BW.Interfaces.BW.Users.UsersData
{
    public interface UsersInterfaceClassBW
    {
        Task<PagedResult<userResponse>> getUsers(string? search, string? role, string? status, int page, int pageSize);
        Task<List<userLookupResponse>> getActiveResponsibles();
        Task<bool> createUser(UserInput user, string name);
        // No hay metodo para borrar usuarios, solo se pueden activar o
        // inactivar con UpdateActiveUser
        Task<bool> UpdateUser(userInputEdit user, string? name);
        Task<bool> UpdateActiveUser(Guid id, bool status);
        Task<userCurrentResponse?> GetUserProfile(Guid id);
    }
}

