using EcowayBackend.BC.BussinesRules.Materials.Units;
using EcowayBackend.BC.Models.Materials.Unit;

namespace EcowayBackend.Tests.BussinesRules;

public class UnitRuleTests
{
    private static unitInput ValidUnit() => new()
    {
        name_unit = "kg",
        description_unit = "Kilogramos",
    };

    [Fact]
    public void UnitValid_ConDatosCompletos_EsValido()
    {
        Assert.True(UnitRule.unitValid(ValidUnit()));
    }

    [Fact]
    public void UnitValid_ConNombreDeCuatroCaracteres_EsValido()
    {
        // el nombre de la unidad tiene que ser corto (abreviaturas como "kg", "lb")
        var input = ValidUnit();
        input.name_unit = "abcd";

        Assert.True(UnitRule.unitValid(input));
    }

    [Fact]
    public void UnitValid_ConNombreDeCincoCaracteres_Falla()
    {
        var input = ValidUnit();
        input.name_unit = "abcde";

        Assert.False(UnitRule.unitValid(input));
    }

    [Fact]
    public void UnitValid_ConNombreVacio_Falla()
    {
        var input = ValidUnit();
        input.name_unit = "";

        Assert.False(UnitRule.unitValid(input));
    }

    [Fact]
    public void UnitValid_ConDescripcionVacia_Falla()
    {
        var input = ValidUnit();
        input.description_unit = "";

        Assert.False(UnitRule.unitValid(input));
    }

    [Fact]
    public void IdValid_ConGuidVacio_Falla()
    {
        Assert.False(UnitRule.idValid(Guid.Empty));
    }

    [Fact]
    public void IdValid_ConGuidValido_EsValido()
    {
        Assert.True(UnitRule.idValid(Guid.NewGuid()));
    }
}
