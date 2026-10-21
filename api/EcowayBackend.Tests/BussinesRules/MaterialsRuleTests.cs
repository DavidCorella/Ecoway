using EcowayBackend.BC.BussinesRules.Materials.Materials;
using EcowayBackend.BC.Models.Materials.Materials;

namespace EcowayBackend.Tests.BussinesRules;

public class MaterialsRuleTests
{
    private static MaterialInput ValidMaterial() => new()
    {
        Description_material = "Papel blanco",
        unit = Guid.NewGuid(),
        physical_state = Guid.NewGuid(),
        classify = Guid.NewGuid(),
        currency = Guid.NewGuid(),
        price = 1.5m,
        max_management_days = 30,
    };

    [Fact]
    public void MaterialsValid_ConDatosCompletos_EsValido()
    {
        Assert.True(MaterialsRule.materialsValid(ValidMaterial()));
    }

    [Fact]
    public void MaterialsValid_ConDescripcionVacia_Falla()
    {
        var input = ValidMaterial();
        input.Description_material = "";

        Assert.False(MaterialsRule.materialsValid(input));
    }

    [Fact]
    public void MaterialsValid_ConDescripcionMuyLarga_Falla()
    {
        var input = ValidMaterial();
        input.Description_material = new string('a', 151);

        Assert.False(MaterialsRule.materialsValid(input));
    }

    [Fact]
    public void MaterialsValid_ConPrecioEnCero_Falla()
    {
        var input = ValidMaterial();
        input.price = 0;

        Assert.False(MaterialsRule.materialsValid(input));
    }

    [Fact]
    public void MaterialsValid_SinUnidad_Falla()
    {
        var input = ValidMaterial();
        input.unit = Guid.Empty;

        Assert.False(MaterialsRule.materialsValid(input));
    }

    [Fact]
    public void MaterialsValid_SinEstadoFisico_Falla()
    {
        var input = ValidMaterial();
        input.physical_state = Guid.Empty;

        Assert.False(MaterialsRule.materialsValid(input));
    }

    [Fact]
    public void MaterialsValid_SinClasificacion_Falla()
    {
        var input = ValidMaterial();
        input.classify = Guid.Empty;

        Assert.False(MaterialsRule.materialsValid(input));
    }

    [Fact]
    public void MaterialsValid_SinMoneda_Falla()
    {
        var input = ValidMaterial();
        input.currency = Guid.Empty;

        Assert.False(MaterialsRule.materialsValid(input));
    }

    [Fact]
    public void MaterialsValid_SinMaximoDiasDeGestion_Falla()
    {
        var input = ValidMaterial();
        input.max_management_days = null;

        Assert.False(MaterialsRule.materialsValid(input));
    }

    [Fact]
    public void MaterialsValid_ConMaximoDiasDeGestionEnCero_Falla()
    {
        var input = ValidMaterial();
        input.max_management_days = 0;

        Assert.False(MaterialsRule.materialsValid(input));
    }
}
