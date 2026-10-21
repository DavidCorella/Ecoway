using EcowayBackend.BC.BussinesRules.Users.UsersData;
using EcowayBackend.BC.Models.Users.UsersData;

namespace EcowayBackend.Tests.BussinesRules;

public class UserRulesTests
{
    private static UserInput ValidUser() => new()
    {
        id = "1-2345-6789",
        password = "Passw0rd!",
        role = Guid.NewGuid().ToString(),
        position = "Operario",
        nationality_id = 1,
    };

    [Fact]
    public void ValidateUser_ConDatosCompletos_EsValido()
    {
        Assert.True(userRules.ValidateUser(ValidUser()));
    }

    [Fact]
    public void ValidateUser_SinCedula_Falla()
    {
        var input = ValidUser();
        input.id = "";

        Assert.False(userRules.ValidateUser(input));
    }

    [Theory]
    [InlineData("corto1!")]      // menos de 8 caracteres
    [InlineData("password1!")]   // sin mayuscula
    [InlineData("PASSWORD1!")]   // sin minuscula
    [InlineData("Password!!")]   // sin numero
    [InlineData("Password12")]   // sin caracter especial
    public void ValidateUser_ConContrasenaDebil_Falla(string password)
    {
        var input = ValidUser();
        input.password = password;

        Assert.False(userRules.ValidateUser(input));
    }

    [Fact]
    public void ValidateUser_ConCorreoInvalido_Falla()
    {
        var input = ValidUser();
        input.email = "no-es-correo";

        Assert.False(userRules.ValidateUser(input));
    }

    [Fact]
    public void ValidateUser_SinCorreo_EsValido()
    {
        // el correo es opcional
        var input = ValidUser();
        input.email = null;

        Assert.True(userRules.ValidateUser(input));
    }

    [Fact]
    public void ValidateUser_SinRol_Falla()
    {
        var input = ValidUser();
        input.role = "";

        Assert.False(userRules.ValidateUser(input));
    }

    [Fact]
    public void ValidateUser_ConNacionalidadInvalida_Falla()
    {
        var input = ValidUser();
        input.nationality_id = 0;

        Assert.False(userRules.ValidateUser(input));
    }

    [Fact]
    public void ValidPassword_ConContrasenaFuerte_EsValida()
    {
        Assert.True(userRules.ValidPassword("Passw0rd!"));
    }

    [Fact]
    public void ValidPassword_ConContrasenaVacia_Falla()
    {
        Assert.False(userRules.ValidPassword(""));
    }
}
