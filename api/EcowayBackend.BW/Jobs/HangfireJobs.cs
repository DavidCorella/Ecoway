using EcowayBackend.BW.Interfaces.Services;
using Hangfire;
namespace EcowayBackend.BC.Jobs
{
  
    public static class HangfireJobs
    {
        public static void RegisterJobs()
        {
            RecurringJob.AddOrUpdate<ICurrencyService>(
                "UpdatePrice",
                x => x.UpdateCurrencies(),
                "0 2 * * *"
            );
        }
    }
}
