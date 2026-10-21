using EcowayBackend.BC.Models.Notifications;

namespace EcowayBackend.BW.Interfaces.BW.Notification
{
    public interface notificationsInterfaceClassBW
    {
        Task<List<notificationResponse>> getAllNotifications(List<Guid?>? screensid, string? iduser);
        Task<bool> markAsRead(Guid id);
        Task<bool> createNotification(notificationsInput notification);
    }
}
