using EcowayBackend.BC.BussinesRules.Tickets;
using EcowayBackend.BC.Models.Tickets;

namespace EcowayBackend.Tests.BussinesRules;

public class CertificateRuleTests
{
    private static CertificateInput ValidCertificate() => new()
    {
        certificate_number = "1-26",
        company_id = Guid.NewGuid(),
        contact_name = "Juan Perez",
        contact_position = "Gerente",
        contact_phone = "22651234",
        contact_cell = "88881234",
        contact_email = "juan@correo.com",
        certificate_date_from = DateTime.Today,
        certificate_date_to = DateTime.Today,
        issued_date = DateTime.Today,
        ticket_ids = new List<Guid> { Guid.NewGuid() },
        items = new List<CertificateItemInput>
        {
            new() { material_description = "Papel", quantity_kg = 10 }
        }
    };

    [Fact]
    public void ValidateCertificate_ConDatosCompletos_EsValido()
    {
        var ok = CertificateRule.ValidateCertificate(ValidCertificate(), out var error);

        Assert.True(ok);
        Assert.Equal("", error);
    }

    [Fact]
    public void ValidateCertificate_SinActasSeleccionadas_Falla()
    {
        var input = ValidCertificate();
        input.ticket_ids = new List<Guid>();

        var ok = CertificateRule.ValidateCertificate(input, out var error);

        Assert.False(ok);
        Assert.Equal("Debe seleccionar al menos un acta.", error);
    }

    [Fact]
    public void ValidateCertificate_SinMateriales_Falla()
    {
        var input = ValidCertificate();
        input.items = new List<CertificateItemInput>();

        var ok = CertificateRule.ValidateCertificate(input, out var error);

        Assert.False(ok);
        Assert.Equal("El certificado no tiene materiales para incluir.", error);
    }

    [Fact]
    public void ValidateCertificate_ConCantidadEnCero_Falla()
    {
        var input = ValidCertificate();
        input.items[0].quantity_kg = 0;

        var ok = CertificateRule.ValidateCertificate(input, out var error);

        Assert.False(ok);
        Assert.Equal("La cantidad en kilos debe ser mayor que cero.", error);
    }

    [Fact]
    public void ValidateCertificate_ConNombreDeContactoMuyLargo_Falla()
    {
        // la columna en base es VARCHAR(150), un texto mas largo se
        // truncaria al guardar; se rechaza antes con un mensaje claro
        var input = ValidCertificate();
        input.contact_name = new string('A', 151);

        var ok = CertificateRule.ValidateCertificate(input, out var error);

        Assert.False(ok);
        Assert.Equal("El nombre del contacto no puede superar los 150 caracteres.", error);
    }

    [Fact]
    public void ValidateCertificate_ConCorreoInvalido_Falla()
    {
        var input = ValidCertificate();
        input.contact_email = "invalido";

        var ok = CertificateRule.ValidateCertificate(input, out var error);

        Assert.False(ok);
        Assert.Equal("El correo electrónico del contacto no tiene un formato válido.", error);
    }

    [Fact]
    public void ValidateCertificate_ConHastaAnteriorADesde_Falla()
    {
        var input = ValidCertificate();
        input.certificate_date_from = DateTime.Today;
        input.certificate_date_to = DateTime.Today.AddDays(-1);

        var ok = CertificateRule.ValidateCertificate(input, out var error);

        Assert.False(ok);
        Assert.Equal("La fecha \"hasta\" del certificado no puede ser anterior a la fecha \"desde\".", error);
    }

    [Fact]
    public void ValidateCertificate_ConInputNulo_Falla()
    {
        var ok = CertificateRule.ValidateCertificate(null!, out var error);

        Assert.False(ok);
        Assert.Equal("Datos del certificado inválidos.", error);
    }
}
