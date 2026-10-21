using EcowayBackend.DA.Config.Users;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace EcowayBackend.API.Security
{
    public class ScreenPermissionFilter : IAsyncAuthorizationFilter
    {
        private readonly UsersContext _accessContext;
        private readonly string _screenId;

        public ScreenPermissionFilter(UsersContext accessContext,string screenId)
        {
            _accessContext = accessContext;
            _screenId = screenId;
        }

        public async Task OnAuthorizationAsync(
            AuthorizationFilterContext context)
        {
            var roleClaim =
                context.HttpContext.User.FindFirst(ClaimTypes.Role);

            // Mejor TryParse que Parse, por si el claim viene vacio o mal formado
            if (roleClaim == null || !Guid.TryParse(roleClaim.Value, out var roleId))
            {
                context.Result = new UnauthorizedResult();
                return;
            }

            // _screenId siempre es una constante fija del propio codigo
            // (la pasa el atributo), no dato del usuario, por eso este si va con Parse
            bool permitido =
                await _accessContext.Access.AnyAsync(x =>
                    x.Role_id == roleId &&
                    x.Screen_id == Guid.Parse(_screenId) &&
                    x.Active
                );

            if (!permitido)
            {
                context.Result = new ForbidResult();
            }
        }
    }
}