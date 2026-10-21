using EcowayBackend.BC.BussinesRules.Materials.Classify;
using EcowayBackend.BC.Models.Materials.Classify;

namespace EcowayBackend.Tests.BussinesRules;

public class ClassifyRuleTests
{
    private static classifyInput ValidClassify() => new()
    {
        name_classify = "Metal",
        Description_classify = "Residuos metalicos en general",
    };

    [Fact]
    public void ClassifyValid_ConDatosCompletos_EsValido()
    {
        Assert.True(ClassifyRule.classifyValid(ValidClassify()));
    }

    [Fact]
    public void ClassifyValid_ConNombreVacio_Falla()
    {
        var input = ValidClassify();
        input.name_classify = "";

        Assert.False(ClassifyRule.classifyValid(input));
    }

    [Fact]
    public void ClassifyValid_ConNombreMuyLargo_Falla()
    {
        var input = ValidClassify();
        input.name_classify = new string('a', 51);

        Assert.False(ClassifyRule.classifyValid(input));
    }

    [Fact]
    public void ClassifyValid_ConDescripcionMuyLarga_Falla()
    {
        var input = ValidClassify();
        input.Description_classify = new string('a', 151);

        Assert.False(ClassifyRule.classifyValid(input));
    }

    [Fact]
    public void ClassifyValid_ConDescripcionVacia_Falla()
    {
        var input = ValidClassify();
        input.Description_classify = "";

        Assert.False(ClassifyRule.classifyValid(input));
    }
}
