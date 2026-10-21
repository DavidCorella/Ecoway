FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY migrator/ ./
RUN dotnet publish -c Release -o /out

FROM mcr.microsoft.com/dotnet/runtime:9.0
WORKDIR /app
COPY --from=build /out .
COPY migrations/ /migrations/
ENTRYPOINT ["dotnet", "Migrator.dll"]