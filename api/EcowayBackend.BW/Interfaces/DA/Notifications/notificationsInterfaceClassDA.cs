using EcowayBackend.BC.Models.Notifications;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcowayBackend.BW.Interfaces.DA.Notifications
{
    public interface notificationsInterfaceClassDA
    {
        Task<List<notificationResponse>> getAllNotifications(List<Guid?> screensid, string? iduser);
        Task<bool> markAsRead(Guid id);
        Task<bool> createNotification(notificationsInput notification);
    }
}
