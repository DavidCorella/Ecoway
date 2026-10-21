using EcowayBackend.DA.Config.Users;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace EcowayBackend.API.Security
{
    public class PasswordChangeFilter : IAsyncAuthorizationFilter
    {
        private readonly UsersContext _userContext;

        public PasswordChangeFilter(
            UsersContext userContext)
        {
            _userContext = userContext;
        }

        public async Task OnAuthorizationAsync(
            AuthorizationFilterContext context)
        {
            var userIdClaim =
                context.HttpContext.User
                    .FindFirst(ClaimTypes.NameIdentifier)?.Value;

            // TryParse para evitar una excepcion si el claim viene vacio o mal formado
            if (!Guid.TryParse(userIdClaim, out var userId))
            {
                context.Result = new UnauthorizedResult();
                return;
            }

            // AsNoTracking: este filtro solo lee la bandera, nunca modifica
            // el usuario. Sin esto, si despues el endpoint intenta crear o
            // trackear otra fila con la misma cedula (por ejemplo, alguien
            // duplicando su propia cuenta), EF Core choca contra esta
            // instancia ya trackeada y tira una excepcion que no tiene nada
            // que ver con la base de datos
            var user = await _userContext.Users.AsNoTracking().FirstOrDefaultAsync(x => x.PublicId == userId);

            if (user == null)
            {
                context.Result = new UnauthorizedResult();
                return;
            }

            if (user.mustChangePassword == true)
            {
                context.Result = new UnauthorizedObjectResult(new
                {
                    message = "Debe cambiar su contraseña.",
                    mustChangePassword = true
                });
            }
        }
    }
}