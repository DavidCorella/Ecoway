using EcowayBackend.BC.BussinesRules.Tickets;
using EcowayBackend.BC.Models.Tickets;

namespace EcowayBackend.Tests.BussinesRules;

public class CollectionSummaryRuleTests
{
    private static CollectionSummaryInput ValidSummary()
    {
        var ticketId = Guid.NewGuid();

        return new()
        {
            summary_number = "1-26",
            company_id = Guid.NewGuid(),
            date_from = new DateTime(2026, 1, 1),
            date_to = new DateTime(2026, 1, 31),
            period_label = "Enero 2026",
            contact_name = "Juan Perez",
            contact_position = "Gerente",
            contact_phone = "22651234",
            contact_cell = "88881234",
            contact_email = "juan@correo.com",
            tax_rate = 13,
            currency = "USD",
            exchange_rate = 520,
            ticket_ids = new List<Guid> { ticketId },
            material_prices = new List<CollectionSummaryMaterialPriceInput>
            {
                new() { material_description = "Papel", price_per_kg = 1.5m }
            },
            // La cantidad no va en el input: el servidor la calcula del
            // freight_count de la acta (ticket_id)
            freights = new List<CollectionSummaryFreightInput>
            {
                new() { ticket_id = ticketId, cost = 100, description = "Flete 1" }
            }
        };
    }

    [Fact]
    public void ValidateSummary_ConDatosCompletos_EsValido()
    {
        var ok = CollectionSummaryRule.ValidateSummary(ValidSummary(), out var error);

        Assert.True(ok);
        Assert.Equal("", error);
    }

    [Fact]
    public void ValidateSummary_ConFechaFinalAnteriorALaInicial_Falla()
    {
        var input = ValidSummary();
        input.date_from = new DateTime(2026, 2, 1);
        input.date_to = new DateTime(2026, 1, 1);

        var ok = CollectionSummaryRule.ValidateSummary(input, out var error);

        Assert.False(ok);
        Assert.Equal("La fecha final no puede ser anterior a la inicial.", error);
    }

    [Fact]
    public void ValidateSummary_SinActasSeleccionadas_Falla()
    {
        var input = ValidSummary();
        input.ticket_ids = new List<Guid>();

        var ok = CollectionSummaryRule.ValidateSummary(input, out var error);

        Assert.False(ok);
        Assert.Equal("Debe seleccionar al menos un acta.", error);
    }

    [Fact]
    public void ValidateSummary_SinFletes_EsValido()
    {
        // el flete es opcional, puede no haber ninguno (igual que en
        // Actas y Cotizaciones)
        var input = ValidSummary();
        input.freights = new List<CollectionSummaryFreightInput>();

        var ok = CollectionSummaryRule.ValidateSummary(input, out var error);

        Assert.True(ok);
    }

    [Fact]
    public void ValidateSummary_ConNombreDeContactoMuyLargo_Falla()
    {
        // la columna en base es VARCHAR(150), un texto mas largo se
        // truncaria al guardar; se rechaza antes con un mensaje claro
        var input = ValidSummary();
        input.contact_name = new string('A', 151);

        var ok = CollectionSummaryRule.ValidateSummary(input, out var error);

        Assert.False(ok);
        Assert.Equal("El nombre del contacto no puede superar los 150 caracteres.", error);
    }

    [Fact]
    public void ValidateSummary_ConFleteDeActaNoIncluida_Falla()
    {
        // el flete debe corresponder a una de las actas marcadas en el
        // resumen, no puede apuntar a una acta ajena
        var input = ValidSummary();
        input.freights[0].ticket_id = Guid.NewGuid();

        var ok = CollectionSummaryRule.ValidateSummary(input, out var error);

        Assert.False(ok);
        Assert.Equal("Cada flete debe corresponder a una acta incluida en el resumen.", error);
    }

    [Fact]
    public void ValidateSummary_ConFleteNegativo_Falla()
    {
        var input = ValidSummary();
        input.freights[0].cost = -1;

        var ok = CollectionSummaryRule.ValidateSummary(input, out var error);

        Assert.False(ok);
        Assert.Equal("El costo de cada flete no puede ser negativo.", error);
    }

    [Fact]
    public void ValidateSummary_SinPreciosDeMaterial_Falla()
    {
        var input = ValidSummary();
        input.material_prices = new List<CollectionSummaryMaterialPriceInput>();

        var ok = CollectionSummaryRule.ValidateSummary(input, out var error);

        Assert.False(ok);
        Assert.Equal("Las actas elegidas no tienen materiales para incluir.", error);
    }

    [Fact]
    public void ValidateSummary_ConPrecioPorKiloNegativo_Falla()
    {
        var input = ValidSummary();
        input.material_prices[0].price_per_kg = -1;

        var ok = CollectionSummaryRule.ValidateSummary(input, out var error);

        Assert.False(ok);
        Assert.Equal("El precio por kilo no puede ser negativo.", error);
    }

    [Fact]
    public void ValidateSummary_ConEtiquetaDePeriodoVacia_Falla()
    {
        var input = ValidSummary();
        input.period_label = "";

        var ok = CollectionSummaryRule.ValidateSummary(input, out var error);

        Assert.False(ok);
        Assert.Equal("La etiqueta del período es obligatoria.", error);
    }
}
