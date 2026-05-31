mod scaffold;

use clap::Parser;
use std::path::PathBuf;
use std::process;

/// 新規プロジェクトの標準スケルトンを生成するスターターキットCLI。
///
/// 例: starter /path/to/my-project
#[derive(Parser)]
#[command(
    name = "starter",
    version,
    about = "プロジェクト・スターターキット生成CLI"
)]
struct Cli {
    /// 作成先プロジェクトディレクトリのフルパス
    path: PathBuf,

    /// 既存ファイルを上書きする（デフォルトはスキップ）
    #[arg(long)]
    force: bool,
}

fn main() {
    let cli = Cli::parse();

    if let Err(err) = scaffold::run(&cli.path, cli.force) {
        // anyhow のエラーチェーン全体を表示してから非ゼロ終了
        eprintln!("エラー: {err:#}");
        process::exit(1);
    }
}
