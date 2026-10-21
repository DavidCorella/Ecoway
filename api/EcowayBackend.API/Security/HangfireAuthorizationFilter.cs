using EcowayBackend.DA.Config.Users;
using Hangfire.Dashboard;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace EcowayBackend.API.Security
{
    // Solo deja entrar a /hangfire a quien tenga permiso sobre la
    // pantalla de administracion (Usuarios/Roles/Permisos)
    public class HangfireAuthorizationFilter : IDashboardAuthorizationFilter
    {
        private static readonly Guid AdminScreenId =
            Guid.Parse("CD5FAA46-A12C-45CB-B3A6-1E1A79ED0234");

        public bool Authorize(DashboardContext context)
        {
            var httpContext = context.GetHttpContext();

            if (httpContext.User?.Identity?.IsAuthenticated != true)
                return false;

            var roleClaim = httpContext.User.FindFirst(ClaimTypes.Role)?.Value;

            if (string.IsNullOrEmpty(roleClaim) || !Guid.TryParse(roleClaim, out var roleId))
                return false;

            var accessContext = httpContext.RequestServices.GetRequiredService<UsersContext>();

            return accessContext.Access.Any(x =>
                x.Role_id == roleId &&
                x.Screen_id == AdminScreenId &&
                x.Active);
        }
    }
}
