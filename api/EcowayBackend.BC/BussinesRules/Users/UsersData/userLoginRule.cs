using EcowayBackend.BC.Models.Users.UsersData;

namespace EcowayBackend.BC.BussinesRules.Users.UsersData
{
    public static class userLoginRule
    {
        public static bool userValid(userLoginInput user)
        {
            return user != null &&
                !string.IsNullOrEmpty(user.id) &&
                !string.IsNullOrEmpty(user.password);
        }
    }
}
