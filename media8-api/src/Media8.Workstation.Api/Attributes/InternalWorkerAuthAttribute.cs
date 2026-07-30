using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Media8.Workstation.Api.Attributes;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class InternalWorkerAuthAttribute : Attribute, IAsyncActionFilter
{
    private const string HeaderName = "X-Internal-Secret";

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var configuration = context.HttpContext.RequestServices.GetRequiredService<IConfiguration>();
        var expectedSecret = configuration["INTERNAL_WORKER_SECRET"] ?? "W0rk3rS3cr3tKeyM3dia8PAM2026!";

        if (!context.HttpContext.Request.Headers.TryGetValue(HeaderName, out var extractedSecret) ||
            string.IsNullOrWhiteSpace(extractedSecret) ||
            !string.Equals(extractedSecret, expectedSecret, StringComparison.Ordinal))
        {
            context.Result = new UnauthorizedObjectResult(new { message = "Acesso proibido: Cabeçalho X-Internal-Secret inválido ou ausente." });
            return;
        }

        await next();
    }
}
