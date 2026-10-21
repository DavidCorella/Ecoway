using EcowayBackend.BC.Models.Notifications;
using EcowayBackend.BW.Interfaces.DA.Notifications;
using EcowayBackend.DA.Config.Users;
using EcowayBackend.DA.Entities.Notificacions;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace EcowayBackend.DA.Accions.Notifications
{
    public class notificationsClassDA : notificationsInterfaceClassDA
    {

        private readonly UsersContext _notificationContext;
        public notificationsClassDA(UsersContext context)
        {
            _notificationContext = context;
        }
  
           public async Task<List<notificationResponse>> getAllNotifications( List<Guid?>? screensid, string? iduser)
            {

            return await _notificationContext.Notifications
                .Where(a =>
                    (
                        screensid != null && screensid.Contains(a.screen_id)
                        || (!string.IsNullOrEmpty(iduser)) && a.user_id == iduser
                    )
                    && !a.is_read
                )
                .Select(a => new notificationResponse
                {
                    title = a.title,
                    message = a.message,
                    created_at = a.created_at,
                    id = a.id,
                    action = a.action,
                    reference = a.reference,
                })
                .ToListAsync();
            }

        public async Task<bool> markAsRead(Guid id)
        {
            var notification = await _notificationContext.Notifications.FirstOrDefaultAsync(n => n.id == id);
            if (notification != null)
            {
               notification.is_read = true;
               await _notificationContext.SaveChangesAsync();
               return true;
            }
            return false;
        }
        public async Task<bool> createNotification(notificationsInput notification)
        {
            var result = await _notificationContext.Notifications.AddAsync(new NotificationsEntityDA {
                                                                                                    created_at = notification.created_at,
                                                                                                    message = notification.message,
                                                                                                    screen_id = Guid.Parse(notification.screen_id),
                                                                                                    user_id = notification.user_id,
                                                                                                    title = notification.title,
                                                                                                    reference = notification.reference,
                                                                                                    action = notification.action
                                                                                                     });
            if (result != null)
            {
                await _notificationContext.SaveChangesAsync();
                return true;
            }
            return false;
        }

    }
    
}
