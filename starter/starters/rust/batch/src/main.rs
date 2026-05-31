//! Runner Entry Point
//!
//! Main entry point that dispatches to the appropriate runner
//! based on configuration (runnerMode in config.yaml or RUNNER_MODE env).
//!
//! ## Supported Modes
//! - workflow: Execute all jobs in sequence (default)
//! - cli: Execute single job as CLI command
//!
//! ## Usage
//!
//! ```bash
//! cargo run                      # Run workflow (all jobs)
//! cargo run -- --job hello-world # Run specific job
//! cargo run -- --list            # List available jobs
//! RUNNER_MODE=cli cargo run      # CLI mode
//! ```

use std::process;

use clap::{Parser, Subcommand};
use tracing::{error, Level};
use tracing_subscriber::FmtSubscriber;

use batch::application::register_all_jobs;
use batch::di::AppContext;
use batch::infrastructure::get_config;
use batch::registry::get_all_jobs;
use batch::runner::{run_single_job, run_workflow};
use batch::shared::constants::{exit_codes, RunnerMode};

/// Batch workflow runner CLI
#[derive(Parser)]
#[command(name = "batch")]
#[command(about = "Workflow runner for batch job execution")]
#[command(version)]
struct Cli {
    /// Run a specific job by name
    #[arg(short, long)]
    job: Option<String>,

    /// List all available jobs
    #[arg(short, long)]
    list: bool,

    #[command(subcommand)]
    command: Option<Commands>,
}

#[derive(Subcommand)]
enum Commands {
    /// List all available workflow steps
    List,
    /// Run a specific job
    Run {
        /// Job name to run
        name: String,
    },
}

/// Display help message with available workflow steps
fn show_help() {
    let jobs = get_all_jobs();

    println!("\nWorkflow Runner");
    println!("===============\n");
    println!("Usage:");
    println!("  cargo run                      - Run all workflow steps in sequence");
    println!("  cargo run -- --job <job>       - Run a specific workflow step");
    println!("  cargo run -- --list            - Show this help message\n");
    println!("Available workflow steps:\n");

    if jobs.is_empty() {
        println!("  (no jobs registered)");
    } else {
        let max_name_len = jobs.iter().map(|j| j.name.len()).max().unwrap_or(0);
        for job in &jobs {
            let padding = " ".repeat(max_name_len - job.name.len());
            let schedule = job
                .schedule
                .as_ref()
                .map(|s| format!(" [{}]", s))
                .unwrap_or_default();
            println!(
                "  {}{}  - {}{}",
                job.name, padding, job.description, schedule
            );
        }
    }

    println!("\nExamples:");
    println!("  cargo run                      # Run full workflow");
    println!("  cargo run -- --job hello-world # Run single step");
}

/// Initialize logging based on config
fn init_logging() {
    let config = get_config();
    let level = match config.log_level {
        batch::shared::constants::LogLevel::Trace => Level::TRACE,
        batch::shared::constants::LogLevel::Debug => Level::DEBUG,
        batch::shared::constants::LogLevel::Info => Level::INFO,
        batch::shared::constants::LogLevel::Warn => Level::WARN,
        batch::shared::constants::LogLevel::Error => Level::ERROR,
    };

    let subscriber = FmtSubscriber::builder()
        .with_max_level(level)
        .with_target(false)
        .with_thread_ids(false)
        .with_file(false)
        .with_line_number(false)
        .compact()
        .finish();

    tracing::subscriber::set_global_default(subscriber).expect("Failed to set tracing subscriber");
}

#[tokio::main]
async fn main() {
    // Initialize logging
    init_logging();

    // Register all jobs
    register_all_jobs();

    // Parse CLI arguments
    let cli = Cli::parse();

    // Handle --list flag or list subcommand
    if cli.list || matches!(cli.command, Some(Commands::List)) {
        show_help();
        process::exit(exit_codes::SUCCESS);
    }

    // Create application context
    let ctx = match AppContext::production() {
        Ok(ctx) => ctx,
        Err(e) => {
            error!(error = %e, "Failed to create application context");
            process::exit(exit_codes::CONFIGURATION_ERROR);
        }
    };

    // Determine job to run
    let job_name = cli.job.or(match cli.command {
        Some(Commands::Run { name }) => Some(name),
        _ => None,
    });

    // Get runner mode from config
    let config = get_config();

    let exit_code = if config.runner_mode == RunnerMode::Cli {
        // CLI mode: single command execution
        match job_name {
            Some(name) => run_single_job(&name, ctx).await,
            None => {
                eprintln!("CLI mode requires a job name. Usage: cargo run -- --job <name>");
                show_help();
                exit_codes::FAILURE
            }
        }
    } else {
        // Workflow mode (default)
        match job_name {
            Some(name) => run_single_job(&name, ctx).await,
            None => run_workflow(ctx).await,
        }
    };

    process::exit(exit_code);
}
