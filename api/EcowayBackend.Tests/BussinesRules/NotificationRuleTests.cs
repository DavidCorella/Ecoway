using EcowayBackend.BC.BussinesRules.Notifications;
using EcowayBackend.BC.Models.Notifications;

namespace EcowayBackend.Tests.BussinesRules;

public class NotificationRuleTests
{
    private static notificationsInput ValidNotification() => new()
    {
        title = "Aviso",
        message = "Este es un mensaje de prueba",
    };

    [Fact]
    public void ValidateNotification_ConDatosCompletos_EsValido()
    {
        Assert.True(NotificationRule.ValidateNotification(ValidNotification()));
    }

    [Fact]
    public void ValidateNotification_SinTitulo_Falla()
    {
        var input = ValidNotification();
        input.title = "";

        Assert.False(NotificationRule.ValidateNotification(input));
    }

    [Fact]
    public void ValidateNotification_SinMensaje_Falla()
    {
        var input = ValidNotification();
        input.message = "   ";

        Assert.False(NotificationRule.ValidateNotification(input));
    }

    [Fact]
    public void ValidateNotification_ConTituloDeCientoCincuentaCaracteres_EsValido()
    {
        // la columna Notifications.title es NVARCHAR(150)
        var input = ValidNotification();
        input.title = new string('a', 150);

        Assert.True(NotificationRule.ValidateNotification(input));
    }

    [Fact]
    public void ValidateNotification_ConTituloMuyLargo_Falla()
    {
        var input = ValidNotification();
        input.title = new string('a', 151);

        Assert.False(NotificationRule.ValidateNotification(input));
    }

    [Fact]
    public void ValidateNotification_ConMensajeMuyLargo_Falla()
    {
        // la columna Notifications.message es NVARCHAR(500)
        var input = ValidNotification();
        input.message = new string('a', 501);

        Assert.False(NotificationRule.ValidateNotification(input));
    }
}
