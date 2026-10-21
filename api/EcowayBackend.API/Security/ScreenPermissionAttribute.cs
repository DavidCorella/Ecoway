using Microsoft.AspNetCore.Mvc;

namespace EcowayBackend.API.Security
{
    public class ScreenPermissionAttribute : TypeFilterAttribute
    {
        public ScreenPermissionAttribute(string screenId)
            : base(typeof(ScreenPermissionFilter))
        {
            Arguments = new object[]
            {
                screenId
            };
        }
    }
}