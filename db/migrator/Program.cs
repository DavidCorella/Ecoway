using DbUp;

var cs = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
         ?? throw new Exception("Falta ConnectionStrings__DefaultConnection");

var upgrader = DeployChanges.To
    .SqlDatabase(cs)
    .WithScriptsFromFileSystem("/migrations")
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