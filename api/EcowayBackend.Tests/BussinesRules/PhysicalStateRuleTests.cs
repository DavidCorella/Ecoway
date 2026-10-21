using EcowayBackend.BC.BussinesRules.Materials.PhysicalState;
using EcowayBackend.BC.Models.Materials.PhysicalState;

namespace EcowayBackend.Tests.BussinesRules;

public class PhysicalStateRuleTests
{
    private static physical_stateInput ValidPhysicalState() => new()
    {
        name_physicalState = "Solido",
        Description_physicalState = "Material solido",
    };

    [Fact]
    public void PhysicalStatValid_ConDatosCompletos_EsValido()
    {
        Assert.True(PhysicalStateRule.PhysicalStatValid(ValidPhysicalState()));
    }

    [Fact]
    public void PhysicalStatValid_ConNombreVacio_Falla()
    {
        var input = ValidPhysicalState();
        input.name_physicalState = "";

        Assert.False(PhysicalStateRule.PhysicalStatValid(input));
    }

    [Fact]
    public void PhysicalStatValid_ConDescripcionMuyLarga_Falla()
    {
        // la columna es VARCHAR(100), mas corta que la de Classify
        var input = ValidPhysicalState();
        input.Description_physicalState = new string('a', 101);

        Assert.False(PhysicalStateRule.PhysicalStatValid(input));
    }

    [Fact]
    public void PhysicalStatValid_ConDescripcionDeCienCaracteres_EsValido()
    {
        var input = ValidPhysicalState();
        input.Description_physicalState = new string('a', 100);

        Assert.True(PhysicalStateRule.PhysicalStatValid(input));
    }
}
