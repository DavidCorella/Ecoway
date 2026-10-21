using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ApplicationModels;
using Microsoft.AspNetCore.Mvc.Routing;

namespace EcowayBackend.API
{
    // Le agrega "api/" adelante a la ruta de todos los controllers de una
    // sola vez, para no tener que tocar cada [Route("[controller]")] a
    // mano. Hace falta porque Caddy en el servidor manda /api/* para aca
    // sin quitar el prefijo.
    public class ApiRoutePrefixConvention : IApplicationModelConvention
    {
        private readonly AttributeRouteModel _prefix = new(new RouteAttribute("api"));

        public void Apply(ApplicationModel application)
        {
            foreach (var controller in application.Controllers)
            {
                foreach (var selector in controller.Selectors)
                {
                    selector.AttributeRouteModel = selector.AttributeRouteModel != null
                        ? AttributeRouteModel.CombineAttributeRouteModel(_prefix, selector.AttributeRouteModel)
                        : _prefix;
                }
            }
        }
    }
}
