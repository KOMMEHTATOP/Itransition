FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["CourseworkItransition/backend/InventoryApi.csproj", "backend/"]
RUN dotnet restore "backend/InventoryApi.csproj"
COPY CourseworkItransition/backend/ backend/
WORKDIR /src/backend
RUN dotnet publish -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "InventoryApi.dll"]