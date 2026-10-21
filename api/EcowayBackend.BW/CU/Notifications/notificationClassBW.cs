using EcowayBackend.BC.BussinesRules.Notifications;
using EcowayBackend.BC.Models.Notifications;
using EcowayBackend.BW.Interfaces.BW.Notification;
using EcowayBackend.BW.Interfaces.DA.Notifications;
using EcowayBackend.BW.Interfaces.DA.Users;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcowayBackend.BW.CU.Notifications
{
    public class notificationClassBW : notificationsInterfaceClassBW
    {
        private readonly notificationsInterfaceClassDA NotificationsClassInterfaceDA;

        public notificationClassBW(notificationsInterfaceClassDA getNotificationsClassInterfaceDA)
        {
            this.NotificationsClassInterfaceDA = getNotificationsClassInterfaceDA;
        }
        public Task<List<notificationResponse>> getAllNotifications(List<Guid?>? screensid, string? iduser)
        {
            return NotificationsClassInterfaceDA.getAllNotifications(screensid, iduser);
        }

        public Task<bool> markAsRead(Guid id) {
            return NotificationsClassInterfaceDA.markAsRead(id);
        }
        public Task<bool> createNotification(notificationsInput notification) {
            return NotificationRule.ValidateNotification(notification) 
                ? NotificationsClassInterfaceDA.createNotification(notification) 
                : Task.FromResult(false);
        }
    }
}
