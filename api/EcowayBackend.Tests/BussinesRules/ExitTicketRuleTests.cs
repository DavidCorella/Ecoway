using EcowayBackend.BC.BussinesRules.Tickets;
using EcowayBackend.BC.Models.Tickets;

namespace EcowayBackend.Tests.BussinesRules;

public class ExitTicketRuleTests
{
    private static ExitTicketInput ValidExitTicket() => new()
    {
        exit_ticket_number = "1-26",
        destination_company_id = Guid.NewGuid(),
        exit_date = DateTime.Today,
        receiver_responsible_name = "Juan Perez",
        receiver_responsible_id = "1-2345-6789",
        ecoway_responsible_name = "Maria Rodriguez",
        ecoway_responsible_id = "2-3456-7890",
        items = new List<ExitTicketItemInput>
        {
            new() { material_description = "Papel", quantity_kg = 10 }
        }
    };

    [Fact]
    public void ValidateExitTicket_ConDatosCompletos_EsValido()
    {
        var ok = ExitTicketRule.ValidateExitTicket(ValidExitTicket(), out var error);

        Assert.True(ok);
        Assert.Equal("", error);
    }

    [Fact]
    public void ValidateExitTicket_SinNumeroDeActa_Falla()
    {
        var input = ValidExitTicket();
        input.exit_ticket_number = "   ";

        var ok = ExitTicketRule.ValidateExitTicket(input, out var error);

        Assert.False(ok);
        Assert.Equal("El número de acta es obligatorio.", error);
    }

    [Fact]
    public void ValidateExitTicket_SinEmpresaDestino_Falla()
    {
        var input = ValidExitTicket();
        input.destination_company_id = Guid.Empty;

        var ok = ExitTicketRule.ValidateExitTicket(input, out var error);

        Assert.False(ok);
        Assert.Equal("Debe seleccionar una empresa de destino.", error);
    }

    [Fact]
    public void ValidateExitTicket_SinMateriales_Falla()
    {
        var input = ValidExitTicket();
        input.items = new List<ExitTicketItemInput>();

        var ok = ExitTicketRule.ValidateExitTicket(input, out var error);

        Assert.False(ok);
        Assert.Equal("Debe registrar al menos un material entregado.", error);
    }

    [Fact]
    public void ValidateExitTicket_ConCantidadNegativa_Falla()
    {
        var input = ValidExitTicket();
        input.items[0].quantity_kg = -5;

        var ok = ExitTicketRule.ValidateExitTicket(input, out var error);

        Assert.False(ok);
        Assert.Equal("La cantidad entregada en kilos debe ser mayor que cero.", error);
    }

    [Fact]
    public void ValidateExitTicket_SinResponsableEcoway_Falla()
    {
        var input = ValidExitTicket();
        input.ecoway_responsible_id = "";

        var ok = ExitTicketRule.ValidateExitTicket(input, out var error);

        Assert.False(ok);
        Assert.Equal("Debe indicar el responsable por EcoWay.", error);
    }
}
