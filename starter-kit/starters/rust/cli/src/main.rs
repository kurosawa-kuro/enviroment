use anyhow::Result;
use clap::{Parser, Subcommand};

/// A minimal Rust CLI starter (clap + anyhow).
#[derive(Parser)]
#[command(name = "rust-cli", version, about, long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Print a greeting
    Greet {
        /// Who to greet
        #[arg(default_value = "world")]
        name: String,
    },
}

fn main() -> Result<()> {
    let cli = Cli::parse();

    match cli.command {
        Commands::Greet { name } => {
            println!("Hello, {name}!");
        }
    }

    Ok(())
}
