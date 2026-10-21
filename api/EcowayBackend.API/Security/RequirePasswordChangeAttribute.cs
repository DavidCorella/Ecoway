using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using EcowayBackend.DA.Config;

namespace EcowayBackend.API.Security
{
    public class RequirePasswordChangeAttribute : TypeFilterAttribute
    {
        public RequirePasswordChangeAttribute()
            : base(typeof(PasswordChangeFilter))
        {
        }
    }
}