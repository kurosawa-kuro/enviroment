use anyhow::{Context, Result};
use std::fs;
use std::path::Path;

/// 作成先ルート直下に必ず作成するディレクトリ。
/// `src` はテンプレートにファイルを持たない空ディレクトリなので、ここで明示的に作る。
const DIRS: &[&str] = &["env", "src", "doc"];

/// (出力相対パス, 埋め込みテンプレート内容)。
const FILES: &[(&str, &str)] = &[
    (".gitignore", include_str!("../templates/.gitignore")),
    ("CLAUDE.md", include_str!("../templates/CLAUDE.md")),
    ("AGENTS.md", include_str!("../templates/AGENTS.md")),
    ("Makefile", include_str!("../templates/Makefile")),
    ("README.md", include_str!("../templates/README.md")),
    ("doppler.yaml", include_str!("../templates/doppler.yaml")),
    (
        "env/config.yaml",
        include_str!("../templates/env/config.yaml"),
    ),
    (
        "env/secret.yaml",
        include_str!("../templates/env/secret.yaml"),
    ),
    (
        "doc/01_仕様と設計.md",
        include_str!("../templates/doc_01.md"),
    ),
    (
        "doc/02_移行ロードマップ.md",
        include_str!("../templates/doc_02.md"),
    ),
    (
        "doc/03_実装カタログ.md",
        include_str!("../templates/doc_03.md"),
    ),
    ("doc/04_運用.md", include_str!("../templates/doc_04.md")),
    ("doc/README.md", include_str!("../templates/doc_README.md")),
];

/// 指定ディレクトリ配下に標準スケルトンを生成する。
///
/// - ルートが無ければ作成する。
/// - 既存ファイルはデフォルトでスキップ（`force` 指定時のみ上書き）。
pub fn run(target: &Path, force: bool) -> Result<()> {
    // 1. 作成先ルートを作成（存在すればそのまま）
    fs::create_dir_all(target)
        .with_context(|| format!("作成先ディレクトリを作成できません: {}", target.display()))?;

    // 2. ディレクトリ構成を再現
    for dir in DIRS {
        let path = target.join(dir);
        fs::create_dir_all(&path)
            .with_context(|| format!("ディレクトリを作成できません: {}", path.display()))?;
    }

    // 3. テンプレートファイルを書き出し（既存はスキップ）
    let mut created = 0usize;
    let mut skipped = 0usize;
    for (rel, content) in FILES {
        let path = target.join(rel);
        if path.exists() && !force {
            println!("  skipped: {rel}");
            skipped += 1;
            continue;
        }
        // 念のため親ディレクトリを保証（DIRS に含まれない階層が増えても安全）
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)
                .with_context(|| format!("ディレクトリを作成できません: {}", parent.display()))?;
        }
        fs::write(&path, content)
            .with_context(|| format!("ファイルを書き込めません: {}", path.display()))?;
        println!("  created: {rel}");
        created += 1;
    }

    // 4. 完了サマリと作成プロジェクトパスを表示
    println!();
    println!("生成完了: {created} 件作成 / {skipped} 件スキップ");
    println!("プロジェクトパス: {}", target.display());
    Ok(())
}
