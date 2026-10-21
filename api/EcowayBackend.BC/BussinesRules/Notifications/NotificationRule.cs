using EcowayBackend.BC.Models.Notifications;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcowayBackend.BC.BussinesRules.Notifications
{
    public class NotificationRule
    {
        public static bool ValidateNotification(notificationsInput notification)
        {
            if (string.IsNullOrWhiteSpace(notification.title) || string.IsNullOrWhiteSpace(notification.message))
            {
                return false;
            }
            if (notification.title.Length > 150)
            {
                return false;
            }
            if (notification.message.Length > 500)
            {
                return false;
            }
            return true;
        }
    }
}
