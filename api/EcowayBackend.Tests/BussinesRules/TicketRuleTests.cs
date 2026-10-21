using EcowayBackend.BC.BussinesRules.Tickets;
using EcowayBackend.BC.Models.Tickets;

namespace EcowayBackend.Tests.BussinesRules;

public class TicketRuleTests
{
    private static TicketInput ValidTicket() => new()
    {
        ticket_number = "1-26",
        company_id = Guid.NewGuid(),
        ticket_date = DateTime.Today,
        client_responsible_name = "Juan Perez",
        client_responsible_id = "1-2345-6789",
        ecoway_responsible_name = "Maria Rodriguez",
        ecoway_responsible_id = "2-3456-7890",
        freight_count = 1,
        items = new List<TicketItemInput>
        {
            new() { material_description = "Papel", quantity_kg = 10 }
        }
    };

    [Fact]
    public void ValidateTicket_ConDatosCompletos_EsValido()
    {
        var ok = TicketRule.ValidateTicket(ValidTicket(), out var error);

        Assert.True(ok);
        Assert.Equal("", error);
    }

    [Fact]
    public void ValidateTicket_SinNumeroDeActa_Falla()
    {
        var input = ValidTicket();
        input.ticket_number = "";

        var ok = TicketRule.ValidateTicket(input, out var error);

        Assert.False(ok);
        Assert.Equal("El número de acta es obligatorio.", error);
    }

    [Fact]
    public void ValidateTicket_SinEmpresa_Falla()
    {
        var input = ValidTicket();
        input.company_id = Guid.Empty;

        var ok = TicketRule.ValidateTicket(input, out var error);

        Assert.False(ok);
        Assert.Equal("Debe seleccionar una empresa generadora.", error);
    }

    [Fact]
    public void ValidateTicket_SinMateriales_Falla()
    {
        var input = ValidTicket();
        input.items = new List<TicketItemInput>();

        var ok = TicketRule.ValidateTicket(input, out var error);

        Assert.False(ok);
        Assert.Equal("Debe registrar al menos un material recolectado.", error);
    }

    [Fact]
    public void ValidateTicket_ConCantidadEnCero_Falla()
    {
        var input = ValidTicket();
        input.items[0].quantity_kg = 0;

        var ok = TicketRule.ValidateTicket(input, out var error);

        Assert.False(ok);
        Assert.Equal("La cantidad recolectada en kilos debe ser mayor que cero.", error);
    }

    [Fact]
    public void ValidateTicket_ConFreightCountNegativo_Falla()
    {
        var input = ValidTicket();
        input.freight_count = -1;

        var ok = TicketRule.ValidateTicket(input, out var error);

        Assert.False(ok);
        Assert.Equal("La cantidad de fletes no puede ser negativa.", error);
    }

    [Fact]
    public void ValidateTicket_ConFreightCountEnCero_EsValido()
    {
        // freight_count en 0 es valido: hay actas que no necesitaron flete
        var input = ValidTicket();
        input.freight_count = 0;

        var ok = TicketRule.ValidateTicket(input, out var error);

        Assert.True(ok);
    }

    [Fact]
    public void ValidateTicket_SinImagen_EsValido()
    {
        // la foto del acta es opcional
        var input = ValidTicket();
        input.image_path = null;

        var ok = TicketRule.ValidateTicket(input, out var error);

        Assert.True(ok);
    }

    [Fact]
    public void ValidateTicket_ConInputNulo_Falla()
    {
        var ok = TicketRule.ValidateTicket(null!, out var error);

        Assert.False(ok);
        Assert.Equal("Datos del acta inválidos.", error);
    }
}
