using EcowayBackend.BC.BussinesRules.Users.UsersData;
using EcowayBackend.BC.Models;
using EcowayBackend.BC.Models.Users.UsersData;
using EcowayBackend.BW.Interfaces.BW.Users.UsersData;
using EcowayBackend.BW.Interfaces.DA.Users.UsersData;


namespace EcowayBackend.BW.CU.Users.UsersData
{

    public class getUsersClass : UsersInterfaceClassBW
    {

        private readonly UsersInterfaceClassDA _getUsersClassInterfaceDA;

        public getUsersClass(UsersInterfaceClassDA _getUsersClassInterfaceDA)
        {
            this._getUsersClassInterfaceDA = _getUsersClassInterfaceDA;
        }
        public async Task<PagedResult<userResponse>> getUsers(string? search, string? role, string? status, int page, int pageSize)
        {
            return await _getUsersClassInterfaceDA.getUsers(search, role, status, page, pageSize);
        }

        public async Task<List<userLookupResponse>> getActiveResponsibles()
        {
            return await _getUsersClassInterfaceDA.getActiveResponsibles();
        }

        public Task<bool> createUser(UserInput user, string name)
        {
            return userRules.ValidateUser(user) ?
                _getUsersClassInterfaceDA.createUser(user, name) : Task.FromResult(false);
        }
        // No hay metodo para borrar un usuario, solo se puede activar o inactivar
        public Task<bool> UpdateUser(userInputEdit user, string? name)
        {
            return userRules.ValidateUser(user) ?
                _getUsersClassInterfaceDA.UpdateUser(user, name) : Task.FromResult(false);
        }
        public Task<bool> UpdateActiveUser(Guid id, bool status) {
            return userRules.ValidateChangeStatus(id) ?
            _getUsersClassInterfaceDA.UpdateActiveUser(id,status) : Task.FromResult(false);

        }
        public Task<userCurrentResponse?> GetUserProfile(Guid id) {
            return userRules.ValidateChangeStatus(id) ?
                _getUsersClassInterfaceDA.GetUserProfile(id) : Task.FromResult<userCurrentResponse?>(null);
        }
    }
}
