FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /app

COPY Media8.Workstation.slnx ./
COPY src/Media8.Workstation.Domain/src/Media8.Workstation.Domain/Media8.Workstation.Domain.csproj src/Media8.Workstation.Domain/
COPY src/Media8.Workstation.Application/Media8.Workstation.Application.csproj src/Media8.Workstation.Application/
COPY src/Media8.Workstation.Infrastructure/Media8.Workstation.Infrastructure.csproj src/Media8.Workstation.Infrastructure/
COPY src/Media8.Workstation.Api/Media8.Workstation.Api.csproj src/Media8.Workstation.Api/

RUN dotnet restore src/Media8.Workstation.Api/Media8.Workstation.Api.csproj

COPY . ./
RUN dotnet publish src/Media8.Workstation.Api/Media8.Workstation.Api.csproj -c Release -o /app/out

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/out .

EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000
ENTRYPOINT ["dotnet", "Media8.Workstation.Api.dll"]
