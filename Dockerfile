FROM mcr.microsoft.com/dotnet/aspnet:10.0
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

COPY publish/ .
RUN rm -f /app/libmp3lame.64.dll /app/libmp3lame.32.dll && \
    ln -s /usr/lib/x86_64-linux-gnu/libmp3lame.so.0 /app/libmp3lame.64.dll && \
    mkdir -p /app/runtimes/linux-x64/native && \
    ln -s /usr/lib/x86_64-linux-gnu/libmp3lame.so.0 /app/runtimes/linux-x64/native/libmp3lame.64.dll

ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 5000

ENTRYPOINT ["dotnet", "Task5_MusicStore.dll"]