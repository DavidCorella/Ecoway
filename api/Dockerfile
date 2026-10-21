FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY EcowayBackend.API/*.csproj EcowayBackend.API/
COPY EcowayBackend.BC/*.csproj EcowayBackend.BC/
COPY EcowayBackend.BW/*.csproj EcowayBackend.BW/
COPY EcowayBackend.DA/*.csproj EcowayBackend.DA/
RUN dotnet restore EcowayBackend.API/EcowayBackend.API.csproj

COPY . .
RUN dotnet publish EcowayBackend.API/EcowayBackend.API.csproj -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app .
ENV ASPNETCORE_URLS=http://+:5000
ENTRYPOINT ["dotnet", "EcowayBackend.API.dll"]
