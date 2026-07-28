using Media8.Workstation.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Media8.Workstation.Infrastructure.Data;

public class WorkstationDbContext : DbContext
{
    public WorkstationDbContext(DbContextOptions<WorkstationDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<ProjectEditor> ProjectEditors => Set<ProjectEditor>();
    public DbSet<ProjectLink> ProjectLinks => Set<ProjectLink>();

    // Backward compatibility Set
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderEditor> OrderEditors => Set<OrderEditor>();
    public DbSet<WorkstationAsset> WorkstationAssets => Set<WorkstationAsset>();
    public DbSet<TimecodeMarker> TimecodeMarkers => Set<TimecodeMarker>();
    public DbSet<MediaProcessingJob> MediaProcessingJobs => Set<MediaProcessingJob>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Map Table Names strictly in PascalCase
        modelBuilder.Entity<User>().ToTable("Users");
        modelBuilder.Entity<Project>().ToTable("Projects");
        modelBuilder.Entity<ProjectEditor>().ToTable("ProjectEditors");
        modelBuilder.Entity<ProjectLink>().ToTable("ProjectLinks");
        modelBuilder.Entity<Order>().ToTable("Orders");
        modelBuilder.Entity<OrderEditor>().ToTable("OrderEditors");
        modelBuilder.Entity<WorkstationAsset>().ToTable("WorkstationAssets");
        modelBuilder.Entity<TimecodeMarker>().ToTable("TimecodeMarkers");
        modelBuilder.Entity<MediaProcessingJob>().ToTable("MediaProcessingJobs");

        // User Configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.UserId);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.Name).HasMaxLength(150).IsRequired();
            entity.Property(e => e.Email).HasMaxLength(255).IsRequired();
            entity.Property(e => e.PasswordHash).HasMaxLength(255).IsRequired();
            entity.Property(e => e.Role).HasMaxLength(50).HasDefaultValue("Editor");
        });

        // Project Configuration
        modelBuilder.Entity<Project>(entity =>
        {
            entity.HasKey(e => e.ProjectId);
            entity.Property(e => e.Title).HasMaxLength(255).IsRequired();
            entity.Property(e => e.ExternalOrderReference).HasMaxLength(100);
            entity.Property(e => e.Deadline);
            entity.Property(e => e.Status).HasMaxLength(50).HasDefaultValue("InProduction");
            entity.Property(e => e.IsDeleted).HasDefaultValue(false);

            entity.HasOne(e => e.CreatedByUser)
                .WithMany()
                .HasForeignKey(e => e.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ProjectEditor Junction Configuration
        modelBuilder.Entity<ProjectEditor>(entity =>
        {
            entity.HasKey(e => e.ProjectEditorId);
            entity.HasIndex(e => new { e.ProjectId, e.UserId }).IsUnique();

            entity.HasOne(e => e.Project)
                .WithMany(p => p.AssignedEditors)
                .HasForeignKey(e => e.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ProjectLink Configuration
        modelBuilder.Entity<ProjectLink>(entity =>
        {
            entity.HasKey(e => e.ProjectLinkId);
            entity.Property(e => e.Url).IsRequired();
            entity.Property(e => e.LinkType).HasMaxLength(50).HasDefaultValue("Folder");

            entity.HasOne(e => e.Project)
                .WithMany(p => p.Links)
                .HasForeignKey(e => e.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Order Configuration (Backward compatibility)
        modelBuilder.Entity<Order>(entity =>
        {
            entity.HasKey(e => e.OrderId);
            entity.Property(e => e.Title).HasMaxLength(255).IsRequired();
            entity.Property(e => e.Status).HasMaxLength(50).HasDefaultValue("Draft");

            entity.HasOne(e => e.CreatedByUser)
                .WithMany(u => u.CreatedOrders)
                .HasForeignKey(e => e.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // OrderEditor Junction Configuration
        modelBuilder.Entity<OrderEditor>(entity =>
        {
            entity.HasKey(e => e.OrderEditorId);
            entity.HasIndex(e => new { e.OrderId, e.UserId }).IsUnique();

            entity.HasOne(e => e.Order)
                .WithMany(o => o.AssignedEditors)
                .HasForeignKey(e => e.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.User)
                .WithMany(u => u.AssignedOrders)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // WorkstationAsset Configuration
        modelBuilder.Entity<WorkstationAsset>(entity =>
        {
            entity.HasKey(e => e.AssetId);
            entity.Property(e => e.Title).HasMaxLength(255).IsRequired();
            entity.Property(e => e.OriginalFileName).HasMaxLength(255).IsRequired();
            entity.Property(e => e.ExternalSourceUrl).IsRequired();
            entity.Property(e => e.MimeType).HasMaxLength(100).HasDefaultValue("video/mp4");
            entity.Property(e => e.TimecodeStart).HasMaxLength(12).HasDefaultValue("00:00:00:00");
            entity.Property(e => e.Status).HasMaxLength(50).HasDefaultValue("Pending");

            entity.HasOne(e => e.Order)
                .WithMany(o => o.Assets)
                .HasForeignKey(e => e.OrderId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // TimecodeMarker Configuration
        modelBuilder.Entity<TimecodeMarker>(entity =>
        {
            entity.HasKey(e => e.MarkerId);
            entity.Property(e => e.InTimecode).HasMaxLength(12).HasDefaultValue("00:00:00:00");
            entity.Property(e => e.OutTimecode).HasMaxLength(12).HasDefaultValue("00:00:00:00");
            entity.Property(e => e.Label).HasMaxLength(255).IsRequired();
            entity.Property(e => e.ColorHex).HasMaxLength(7).HasDefaultValue("#FF0000");

            entity.HasOne(e => e.Asset)
                .WithMany(a => a.Markers)
                .HasForeignKey(e => e.AssetId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.CreatedByUser)
                .WithMany(u => u.Markers)
                .HasForeignKey(e => e.CreatedByUserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // MediaProcessingJob Configuration
        modelBuilder.Entity<MediaProcessingJob>(entity =>
        {
            entity.HasKey(e => e.JobId);
            entity.Property(e => e.JobType).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Status).HasMaxLength(50).HasDefaultValue("Pending");
            entity.Property(e => e.Priority).HasDefaultValue(10);
            entity.Property(e => e.MaxAttempts).HasDefaultValue(3);
            entity.Property(e => e.LockedByWorkerId).HasMaxLength(100);

            entity.HasOne(e => e.Asset)
                .WithMany(a => a.Jobs)
                .HasForeignKey(e => e.AssetId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
