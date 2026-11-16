using DbUp;

var cs = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
         ?? throw new Exception("Falta ConnectionStrings__DefaultConnection");

// En el contenedor las migraciones van en /migrations (ver Dockerfile);
// MIGRATIONS_PATH permite correrlo local apuntando a db/migrations
var migrationsPath = Environment.GetEnvironmentVariable("MIGRATIONS_PATH") ?? "/migrations";

var upgrader = DeployChanges.To
    .PostgresqlDatabase(cs)
    .WithScriptsFromFileSystem(migrationsPath)
    .WithTransactionPerScript()
    .LogToConsole()
    .Build();

var result = upgrader.PerformUpgrade();
if (!result.Successful)
{
    Console.Error.WriteLine(result.Error);
    return 1;
}
Console.WriteLine("Migraciones al día.");
return 0;