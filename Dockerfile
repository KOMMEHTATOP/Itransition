FROM mcr.microsoft.com/dotnet/sdk:10.0-preview AS build
WORKDIR /src

# Copy csproj and restore
COPY Task5_MusicStore/Task5_MusicStore.csproj Task5_MusicStore/
RUN dotnet restore Task5_MusicStore/Task5_MusicStore.csproj

# Copy project files and publish
COPY Task5_MusicStore/ Task5_MusicStore/
RUN dotnet publish Task5_MusicStore/Task5_MusicStore.csproj -c Release -o /app/publish

# Runtime image
FROM mcr.microsoft.com/dotnet/aspnet:10.0-preview AS runtime
WORKDIR /app

# Install native dependencies for SkiaSharp and NAudio.Lame
RUN apt-get update && apt-get install -y --no-install-recommends \
    libfontconfig1 \
        fontconfig \
    libfreetype6 \
    libmp3lame0 \
    && rm -rf /var/lib/apt/lists/*

# Install custom font
COPY Task5_MusicStore/Assets/Fonts/*.ttf /usr/local/share/fonts/
RUN fc-cache -f -v

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 5000

ENTRYPOINT ["dotnet", "Task5_MusicStore.dll"]