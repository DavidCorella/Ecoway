using EcowayBackend.BC.BussinesRules.Tickets;
using EcowayBackend.BC.Models.Tickets;

namespace EcowayBackend.Tests.BussinesRules;

public class QuotationRuleTests
{
    private static QuotationInput ValidQuotation() => new()
    {
        quotation_number = "1-26",
        quotation_date = DateTime.Today,
        company_id = Guid.NewGuid(),
        contact_name = "Juan Perez",
        contact_position = "Gerente",
        contact_phone = "22651234",
        contact_cell = "88881234",
        contact_email = "juan@correo.com",
        delivery_condition = "Sin carga",
        payment_terms = "15 dias",
        ownership_conditions = "El cliente mantiene la propiedad",
        incident_responsibility = "Es del cliente",
        force_majeure_conditions = "Se avisa antes",
        other_conditions = "Ninguna",
        signer_name = "Carlos Rincon",
        signer_position = "Gerente general",
        tax_rate = 13,
        currency = "USD",
        exchange_rate = 520,
        validity_days = 30,
        items = new List<QuotationItemInput>
        {
            new() { material_description = "Papel", quantity_kg = 10, cost = 50 }
        },
        freights = new List<QuotationFreightInput>
        {
            new() { cost = 100, description = "Flete unico" }
        }
    };

    [Fact]
    public void ValidateQuotation_ConDatosCompletos_EsValido()
    {
        var ok = QuotationRule.ValidateQuotation(ValidQuotation(), out var error);

        Assert.True(ok);
        Assert.Equal("", error);
    }

    [Fact]
    public void ValidateQuotation_SinFletes_EsValido()
    {
        // el flete es opcional, puede no haber ninguno
        var input = ValidQuotation();
        input.freights = new List<QuotationFreightInput>();

        var ok = QuotationRule.ValidateQuotation(input, out var error);

        Assert.True(ok);
    }

    [Fact]
    public void ValidateQuotation_ConFleteNegativo_Falla()
    {
        var input = ValidQuotation();
        input.freights[0].cost = -1;

        var ok = QuotationRule.ValidateQuotation(input, out var error);

        Assert.False(ok);
        Assert.Equal("El costo de cada flete no puede ser negativo.", error);
    }

    [Fact]
    public void ValidateQuotation_ConCantidadDeFleteEnCero_Falla()
    {
        var input = ValidQuotation();
        input.freights[0].quantity = 0;

        var ok = QuotationRule.ValidateQuotation(input, out var error);

        Assert.False(ok);
        Assert.Equal("La cantidad de cada flete debe ser mayor que cero.", error);
    }

    [Fact]
    public void ValidateQuotation_ConNombreDeContactoMuyLargo_Falla()
    {
        // la columna en base es VARCHAR(150), un texto mas largo se
        // truncaria al guardar; se rechaza antes con un mensaje claro
        var input = ValidQuotation();
        input.contact_name = new string('A', 151);

        var ok = QuotationRule.ValidateQuotation(input, out var error);

        Assert.False(ok);
        Assert.Equal("El nombre del contacto no puede superar los 150 caracteres.", error);
    }

    [Fact]
    public void ValidateQuotation_ConNumeroConLetras_Falla()
    {
        var input = ValidQuotation();
        input.quotation_number = "ABC-26";

        var ok = QuotationRule.ValidateQuotation(input, out var error);

        Assert.False(ok);
        Assert.Equal("El número de cotización solo puede contener números y guiones.", error);
    }

    [Fact]
    public void ValidateQuotation_ConCorreoInvalido_Falla()
    {
        var input = ValidQuotation();
        input.contact_email = "no-es-un-correo";

        var ok = QuotationRule.ValidateQuotation(input, out var error);

        Assert.False(ok);
        Assert.Equal("El correo electrónico del contacto no tiene un formato válido.", error);
    }

    [Theory]
    [InlineData(5)]
    [InlineData(20)]
    public void ValidateQuotation_ConImpuestoNoPermitido_Falla(decimal taxRate)
    {
        var input = ValidQuotation();
        input.tax_rate = taxRate;

        var ok = QuotationRule.ValidateQuotation(input, out var error);

        Assert.False(ok);
        Assert.Equal("El impuesto debe ser 13% o 0%.", error);
    }

    [Fact]
    public void ValidateQuotation_ConMonedaInvalida_Falla()
    {
        var input = ValidQuotation();
        input.currency = "EUR";

        var ok = QuotationRule.ValidateQuotation(input, out var error);

        Assert.False(ok);
        Assert.Equal("La moneda debe ser colones (CRC) o dólares (USD).", error);
    }

    [Fact]
    public void ValidateQuotation_ConTipoDeCambioEnCero_Falla()
    {
        var input = ValidQuotation();
        input.exchange_rate = 0;

        var ok = QuotationRule.ValidateQuotation(input, out var error);

        Assert.False(ok);
        Assert.Equal("El tipo de cambio debe ser mayor a cero.", error);
    }

    [Fact]
    public void ValidateQuotation_SinMateriales_Falla()
    {
        var input = ValidQuotation();
        input.items = new List<QuotationItemInput>();

        var ok = QuotationRule.ValidateQuotation(input, out var error);

        Assert.False(ok);
        Assert.Equal("Debe registrar al menos un material cotizado.", error);
    }

    [Fact]
    public void ValidateQuotation_ConValidezEnCero_Falla()
    {
        var input = ValidQuotation();
        input.validity_days = 0;

        var ok = QuotationRule.ValidateQuotation(input, out var error);

        Assert.False(ok);
        Assert.Equal("La validez de la oferta debe ser mayor a cero días.", error);
    }

    [Fact]
    public void ValidateQuotation_SinDescripcionDeServicio_EsValido()
    {
        // service_description es el unico campo de texto que puede quedar vacio
        var input = ValidQuotation();
        input.service_description = null;

        var ok = QuotationRule.ValidateQuotation(input, out var error);

        Assert.True(ok);
    }
}
