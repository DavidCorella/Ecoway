using Microsoft.AspNetCore.Mvc.Filters;

namespace EcowayBackend.API.Security
{
    // Los uploads de imagen usan multipart/form-data, y el navegador
    // manda ese tipo de peticion sin pedir permiso de CORS aunque venga
    // de otro sitio. Eso deja abierta la puerta a que un formulario
    // malicioso fuerce una subida usando la cookie de sesion de la
    // victima (la cookie es SameSite=None porque el front y el API
    // quedan en dominios distintos). Un formulario HTML normal no puede
    // mandar cabeceras propias, asi que si esta cabecera llega es porque
    // el pedido si vino del frontend real
    public class RequireAjaxRequestAttribute : ActionFilterAttribute
    {
        public override void OnActionExecuting(ActionExecutingContext context)
        {
            var header = context.HttpContext.Request.Headers["X-Requested-With"];

            if (header != "XMLHttpRequest")
            {
                context.Result = new Microsoft.AspNetCore.Mvc.BadRequestObjectResult(new
                {
                    message = "Solicitud inválida."
                });
                return;
            }

            base.OnActionExecuting(context);
        }
    }
}
