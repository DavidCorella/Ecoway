using EcowayBackend.BC.Jobs;
using EcowayBackend.BW.CU.Materials.Classify;
using EcowayBackend.BW.CU.Materials.Currency;
using EcowayBackend.BW.CU.Materials.Materials;
using EcowayBackend.BW.CU.Materials.PhysicalState;
using EcowayBackend.BW.CU.Materials.Units;
using EcowayBackend.BW.CU.Logs;
using EcowayBackend.BW.CU.Tickets;
using EcowayBackend.BW.CU.Notifications;
using EcowayBackend.BW.CU.Users.PermissionsAndAuth;
using EcowayBackend.BW.CU.Users.PersonalData;
using EcowayBackend.BW.CU.Users.UsersData;
using EcowayBackend.BW.Interfaces.BW.Materials.Classify;
using EcowayBackend.BW.Interfaces.BW.Materials.Currency;
using EcowayBackend.BW.Interfaces.BW.Materials.Materials;
using EcowayBackend.BW.Interfaces.BW.Materials.PhysicalState;
using EcowayBackend.BW.Interfaces.BW.Materials.Unit;
using EcowayBackend.BW.Interfaces.BW.Logs;
using EcowayBackend.BW.Interfaces.BW.Tickets;
using EcowayBackend.BW.Interfaces.BW.Notification;
using EcowayBackend.BW.Interfaces.BW.Users.PermisionsAndAuth;
using EcowayBackend.BW.Interfaces.BW.Users.PersonalData;
using EcowayBackend.BW.Interfaces.BW.Users.UsersData;
using EcowayBackend.BW.Interfaces.DA.Materials.Classify;
using EcowayBackend.BW.Interfaces.DA.Materials.Currency;
using EcowayBackend.BW.Interfaces.DA.Materials.Materials;
using EcowayBackend.BW.Interfaces.DA.Materials.PhysicalState;
using EcowayBackend.BW.Interfaces.DA.Materials.Units;
using EcowayBackend.BW.Interfaces.DA.Logs;
using EcowayBackend.BW.Interfaces.DA.Tickets;
using EcowayBackend.BW.Interfaces.DA.Notifications;
using EcowayBackend.BW.Interfaces.DA.Users.PermisionsAndAuth;
using EcowayBackend.BW.Interfaces.DA.Users.PersonalData;
using EcowayBackend.BW.Interfaces.DA.Users.UsersData;
using EcowayBackend.BW.Interfaces.Services;
using EcowayBackend.BW.Services;
using EcowayBackend.DA.Accions.Materials;
using EcowayBackend.DA.Accions.Materials.Classify;
using EcowayBackend.DA.Accions.Materials.Currency;
using EcowayBackend.DA.Accions.Materials.Units;
using EcowayBackend.DA.Accions.Logs;
using EcowayBackend.DA.Accions.Tickets;
using EcowayBackend.DA.Accions.Notifications;
using EcowayBackend.DA.Accions.Users;
using EcowayBackend.DA.Accions.Users.PersonalData;
using EcowayBackend.DA.Accions.Users.UsersData;
using EcowayBackend.DA.Config.Materials;
using EcowayBackend.DA.Config.Users;
using EcowayBackend.DA.Config.Logs;
using EcowayBackend.DA.Config.Tickets;
using EcowayBackend.API;
using EcowayBackend.API.Hubs;
using EcowayBackend.API.Security;
using EcowayBackend.BC.Realtime;
using Hangfire;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);


builder.Services
    .AddAuthentication(
        CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.Name = "EcowayAuth";
        options.Cookie.HttpOnly = true;
        options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
        options.Cookie.SameSite = SameSiteMode.None;

        // La sesion expira sola a los 15 min de inactividad, pero es
        // deslizante: cada request dentro de ese tiempo reinicia el conteo
        options.ExpireTimeSpan = TimeSpan.FromMinutes(15);
        options.SlidingExpiration = true;

        options.LoginPath = "/userLogin/login";

        options.Events.OnRedirectToLogin = context =>
        {
            context.Response.StatusCode = 401;
            return Task.CompletedTask;
        };

        options.Events.OnRedirectToAccessDenied = context =>
        {
            context.Response.StatusCode = 403;
            return Task.CompletedTask;
        };
    });

// Solo el frontend configurado puede llamar al API, no cualquier origen
var allowedOrigins =
    builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:3000" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // 🔥 obligatorio
    });
});

// Limite de intentos en login y recuperacion de contraseña, para evitar fuerza bruta
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddFixedWindowLimiter("auth", opt =>
    {
        opt.PermitLimit = 5;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueLimit = 0;
    });
});

builder.Services.AddHttpClient();
builder.Services.AddControllers(options =>
{
    options.Conventions.Add(new ApiRoutePrefixConvention());
});
// Para que otras PCs conectadas se enteren al toque cuando algo cambia
// (crear un material, una acta, etc.) sin tener que refrescar el
// navegador. Usa la misma cookie de sesion que el resto del API
builder.Services.AddSignalR();
builder.Services.AddSingleton<IDataChangeNotifier, DataChangeNotifier>();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddTransient<userLoginInterfaceClassBW, userLoginClass>();
builder.Services.AddTransient<userLoginInterfaceClassDA, userLoginClassDA>();
builder.Services.AddTransient<UsersInterfaceClassBW, getUsersClass>();
builder.Services.AddTransient<UsersInterfaceClassDA, UsersClassDA>();
builder.Services.AddTransient<PersonelInterfaceClassBW, PersonalDataClassBW>();
builder.Services.AddTransient<PersonelInterfaceClassDA, PersonalClassDA>();
builder.Services.AddTransient<RolesInterfaceClassBW, RolesClassBW>();
builder.Services.AddTransient<RolesInterfaceClassDA, RolesClassDA>();
builder.Services.AddTransient<notificationsInterfaceClassDA, notificationsClassDA>();
builder.Services.AddTransient<notificationsInterfaceClassBW, notificationClassBW>();
builder.Services.AddTransient<CurrencyInterfaceClassDA, CurrencyClassDA>();
builder.Services.AddTransient<CurrencyInterfaceClassBW, CurrencyClassBW>();
builder.Services.AddTransient<UnitInterfaceClassBW, UnitClassBW>();
builder.Services.AddTransient<UnitInterfaceClassDA, unitClassDA>();
builder.Services.AddTransient<classifyInterfaceClassBW, classifyClassBW>();
builder.Services.AddTransient<classifyInterfaceClassDA, classifyClassDA>();
builder.Services.AddTransient<physicalStateInterfaceClassDA, PhysicalStateClassDA>();
builder.Services.AddTransient<physicalStateInterfaceClassBW, physicalStateClassBW>();
builder.Services.AddTransient<MaterialsInterfaceClassDA, materialsClassDA>();
builder.Services.AddTransient<materialsInterfaceClassBW, materialsClassBW>();
builder.Services.AddTransient<ICurrencyService, CurrencyService>();
builder.Services.AddTransient<LogsInterfaceClassBW, LogsClassBW>();
builder.Services.AddTransient<LogsInterfaceClassDA, LogsClassDA>();
builder.Services.AddTransient<CompanyInterfaceClassBW, CompanyClassBW>();
builder.Services.AddTransient<CompanyInterfaceClassDA, CompanyClassDA>();
builder.Services.AddTransient<TicketInterfaceClassBW, TicketClassBW>();
builder.Services.AddTransient<TicketInterfaceClassDA, TicketClassDA>();
builder.Services.AddTransient<ExitTicketInterfaceClassBW, ExitTicketClassBW>();
builder.Services.AddTransient<ExitTicketInterfaceClassDA, ExitTicketClassDA>();
builder.Services.AddTransient<QuotationInterfaceClassBW, QuotationClassBW>();
builder.Services.AddTransient<QuotationInterfaceClassDA, QuotationClassDA>();
builder.Services.AddTransient<CertificateInterfaceClassBW, CertificateClassBW>();
builder.Services.AddTransient<CertificateInterfaceClassDA, CertificateClassDA>();
builder.Services.AddTransient<CollectionSummaryInterfaceClassBW, CollectionSummaryClassBW>();
builder.Services.AddTransient<CollectionSummaryInterfaceClassDA, CollectionSummaryClassDA>();
// Un contexto de EF por dominio (Users, Materials, Logs, Tickets)
builder.Services.AddDbContext<UsersContext>(options => {
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        sql => sql.EnableRetryOnFailure());
    if (builder.Environment.IsDevelopment())
        options.EnableSensitiveDataLogging();
});
builder.Services.AddDbContext<MaterialsContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        sql => sql.EnableRetryOnFailure()));
builder.Services.AddDbContext<LogsContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        sql => sql.EnableRetryOnFailure()));
builder.Services.AddDbContext<TicketsContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        sql => sql.EnableRetryOnFailure()));
builder.Services.AddAuthorization();
builder.Services.AddHangfire(config =>
{
    config.UseSqlServerStorage(
        builder.Configuration.GetConnectionString("DefaultConnection"));
});

builder.Services.AddHangfireServer();
var app = builder.Build();

// Manejador global de excepciones, asi el frontend siempre recibe JSON
// y nunca una pagina de error en HTML
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        var feature = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>();
        var logger = context.RequestServices
            .GetRequiredService<ILoggerFactory>()
            .CreateLogger("GlobalExceptionHandler");

        if (feature?.Error != null)
        {
            logger.LogError(feature.Error, "Excepción no controlada");

            var logsService = context.RequestServices.GetRequiredService<LogsInterfaceClassBW>();
            await logsService.LogError(
                feature.Error.Message,
                context.Request.Path,
                feature.Error.ToString(),
                StatusCodes.Status500InternalServerError);
        }

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;

        await context.Response.WriteAsJsonAsync(new
        {
            message = "Ha ocurrido un error interno."
        });
    });
});

// Swagger solo en desarrollo, no tiene sentido exponerlo en produccion
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
// Solo en produccion: en desarrollo el HTTPS es con certificado local
// y HSTS puede dejar el navegador forzando https en localhost despues
if (!app.Environment.IsDevelopment())
    app.UseHsts();

// Cabeceras de seguridad para todas las respuestas. El API solo devuelve
// JSON o archivos, no paginas propias, asi que no necesita cargar scripts
// ni estilos (Swagger si los necesita, por eso queda afuera)
app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["X-Frame-Options"] = "DENY";
    context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";

    // Hangfire tambien tiene su propia pagina con CSS y JS, igual que
    // Swagger, entonces tambien queda afuera de la politica estricta
    if (!context.Request.Path.StartsWithSegments("/swagger") &&
        !context.Request.Path.StartsWithSegments("/hangfire"))
        context.Response.Headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'";

    await next();
});

app.UseCors("AllowFrontend");
app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

// Va despues de UseAuthentication/UseAuthorization porque el filtro
// del dashboard necesita que HttpContext.User ya este cargado
app.UseHangfireDashboard("/hangfire", new DashboardOptions
{
    Authorization = new[] { new HangfireAuthorizationFilter() }
});

app.MapControllers();
// Bajo /api porque Caddy en produccion manda /api/* para aca sin quitar
// el prefijo (mismo motivo que ApiRoutePrefixConvention en los controllers)
app.MapHub<DataHub>("/api/hubs/data").RequireCors("AllowFrontend");
HangfireJobs.RegisterJobs();

app.Run();
