using System.Security.Claims;
using Media8.Workstation.Api.Controllers;
using Media8.Workstation.Application.DTOs;
using Media8.Workstation.Domain.Entities;
using Media8.Workstation.Infrastructure.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Media8.Workstation.UnitTests;

public class ProjectsControllerTests
{
    private WorkstationDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<WorkstationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new WorkstationDbContext(options);
    }

    private ProjectsController CreateControllerWithUserClaims(WorkstationDbContext context, Guid userId, string role)
    {
        var controller = new ProjectsController(context);
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Role, role)
        };
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = claimsPrincipal }
        };

        return controller;
    }

    [Fact]
    public async Task GetProjects_ReturnsEmptyPagedResult_WhenNoProjectsExist()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var adminId = Guid.NewGuid();
        var controller = CreateControllerWithUserClaims(context, adminId, "Admin");

        // Act
        var result = await controller.GetProjects(1, 20, null, null, null);

        // Assert
        var actionResult = Assert.IsType<OkObjectResult>(result);
        var pagedResult = Assert.IsType<PagedResultDto<Project>>(actionResult.Value);
        Assert.Empty(pagedResult.Items);
        Assert.Equal(0, pagedResult.TotalCount);
    }

    [Fact]
    public async Task CreateProject_PersistsProjectAndLinksInDatabase()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var adminId = Guid.NewGuid();
        var controller = CreateControllerWithUserClaims(context, adminId, "Admin");

        var request = new CreateProjectRequest
        {
            Title = "Campanha Institucional 2026",
            BriefingText = "Vídeo institucional de 60 segundos.",
            ExternalOrderReference = "ORD-9981",
            AutoIngest = false,
            CreatedByUserId = adminId,
            Links = new List<ProjectLinkDto>
            {
                new ProjectLinkDto { Url = "https://drive.google.com/file/d/testvideo.mp4", LinkType = "Video" }
            }
        };

        // Act
        var result = await controller.CreateProject(request);

        // Assert
        var actionResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var createdProject = Assert.IsType<Project>(actionResult.Value);
        Assert.Equal("Campanha Institucional 2026", createdProject.Title);
        Assert.False(createdProject.AutoIngest);
        Assert.Single(createdProject.Links);

        var dbProject = await context.Projects.Include(p => p.Links).FirstOrDefaultAsync(p => p.ProjectId == createdProject.ProjectId);
        Assert.NotNull(dbProject);
        Assert.Equal("Campanha Institucional 2026", dbProject.Title);
    }

    [Fact]
    public async Task TriggerIngest_EnqueuesNewMediaProcessingJobs()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var adminId = Guid.NewGuid();
        var controller = CreateControllerWithUserClaims(context, adminId, "Admin");

        var project = new Project
        {
            ProjectId = Guid.NewGuid(),
            Title = "Projeto Teste Trigger Ingest",
            AutoIngest = false,
            CreatedByUserId = adminId
        };
        project.Links.Add(new ProjectLink
        {
            ProjectLinkId = Guid.NewGuid(),
            ProjectId = project.ProjectId,
            Url = "https://drive.google.com/file/d/video_camera_a.mp4",
            LinkType = "Video"
        });

        context.Projects.Add(project);
        await context.SaveChangesAsync();

        // Act
        var result = await controller.TriggerIngest(project.ProjectId);

        // Assert
        var actionResult = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(actionResult.Value);

        var assets = await context.WorkstationAssets.Where(a => a.ProjectId == project.ProjectId).ToListAsync();
        Assert.Single(assets);

        var jobs = await context.MediaProcessingJobs.Where(j => j.AssetId == assets[0].AssetId).ToListAsync();
        Assert.Single(jobs);
        Assert.Equal("IngestDownload", jobs[0].JobType);
    }
}
