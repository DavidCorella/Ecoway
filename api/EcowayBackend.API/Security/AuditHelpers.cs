using System.Security.Claims;

namespace EcowayBackend.API.Security
{
    // Metodos de extension para sacar datos del usuario logueado y armar la bitacora
    public static class AuditHelpers
    {
        public static Guid? ActorId(this ClaimsPrincipal user)
        {
            return Guid.TryParse(user.FindFirst(ClaimTypes.NameIdentifier)?.Value, out var id)
                ? id
                : null;
        }

        // Nombre del usuario logueado, viene del claim de Name que se
        // agrega al hacer login
        public static string? ActorDisplay(this ClaimsPrincipal user)
        {
            return user.FindFirst(ClaimTypes.Name)?.Value;
        }
    }
}
