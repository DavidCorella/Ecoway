using EcowayBackend.API.Security;
using EcowayBackend.BC.Models.Users.PermissionsAndAuth;
using EcowayBackend.BC.Models.Users.UsersData;
using EcowayBackend.BW.Interfaces.BW.Users.PermisionsAndAuth;
using EcowayBackend.BW.Interfaces.BW.Users.PersonalData;
using EcowayBackend.BW.Interfaces.BW.Users.UsersData;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;


namespace EcowayBackend.API.Controllers
{
    [ApiController]
    [Route("[controller]")]


    public class PersonelDataController : ControllerBase
    {
        private readonly PersonelInterfaceClassBW _getPersonelClassInterfaceBW;

        public PersonelDataController(PersonelInterfaceClassBW getPersonelBW)
        {
            _getPersonelClassInterfaceBW = getPersonelBW;
        }


        // Antes solo tenia Authorize: cualquier usuario logueado, sin
        // importar el rol, podia consultar el nombre de cualquier cedula
        [HttpGet("GetNameUser")]
        [Authorize]
        [ScreenPermission("CD5FAA46-A12C-45CB-B3A6-1E1A79ED0234")]
        public async Task<IActionResult> getNameUser(string id)
        {
            if (id.Length < 1)
                return BadRequest("ID requerido");

            try
            {
                var result = await _getPersonelClassInterfaceBW.getName(id);

                if (result == "ID invalido")
                    return BadRequest(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }


        // mismo caso que GetNameUser
        [HttpGet("GetName")]
        [Authorize]
        [ScreenPermission("CD5FAA46-A12C-45CB-B3A6-1E1A79ED0234")]
        public async Task<IActionResult> getName(string id)
        {
            if (id.Length < 1)
                return BadRequest("ID requerido");

            try
            {
                var result = await _getPersonelClassInterfaceBW.getName(id);

                if (result == "ID invalido")
                    return BadRequest(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Ha ocurrido un error interno." });
            }
        }


    }
}
