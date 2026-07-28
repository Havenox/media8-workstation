using Microsoft.AspNetCore.Mvc;

namespace Media8.Workstation.Api.Controllers;

/// <summary>
/// Controlador base abstrato da API do Media 8 Workstation.
/// Centraliza o atributo [ApiController] e a rota padronizada global [Route("api/v1/[controller]")].
/// Todos os controladores da API da Workstation devem herdar desta classe.
/// </summary>
[ApiController]
[Route("api/v1/[controller]")]
public abstract class WorkstationBaseController : ControllerBase
{
}
