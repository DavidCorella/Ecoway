using EcowayBackend.BC.BussinesRules.Users.PermissionsAndAuth;

namespace EcowayBackend.Tests.BussinesRules;

public class RoleRuleTests
{
    [Theory]
    [InlineData("Admin")]
    [InlineData("Supervisor")]
    public void RoleIDValid_ConNombreValido_EsValido(string name)
    {
        Assert.True(RoleRule.RoleIDValid(name));
    }

    [Theory]
    [InlineData("")]
    [InlineData("AB")]
    public void RoleIDValid_ConNombreMuyCorto_Falla(string name)
    {
        Assert.False(RoleRule.RoleIDValid(name));
    }

    [Fact]
    public void RoleIDValid_ConNombreMuyLargo_Falla()
    {
        // la columna Roles.name es VARCHAR(100)
        var nombreLargo = new string('a', 101);

        Assert.False(RoleRule.RoleIDValid(nombreLargo));
    }

    [Fact]
    public void RoleIDValid_ConNombreDeCienCaracteres_EsValido()
    {
        var nombreLimite = new string('a', 100);

        Assert.True(RoleRule.RoleIDValid(nombreLimite));
    }

    [Fact]
    public void RoleID_ConGuidVacio_Falla()
    {
        Assert.False(RoleRule.RoleID(Guid.Empty));
    }

    [Fact]
    public void RoleID_ConGuidValido_EsValido()
    {
        Assert.True(RoleRule.RoleID(Guid.NewGuid()));
    }
}
