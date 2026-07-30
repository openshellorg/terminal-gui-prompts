//! Terminal GUI Prompts — Rust adapter.
//! Uses the TGP core binary when available; falls back to terminal input.
//! Works in CLI, Electron, and Tauri (set `TGP_BIN` to the core binary path if needed).

use std::io::{self, Write};
use std::process::{Command, Stdio};

/// Options for a confirm (yes/no) prompt.
#[derive(Debug, Clone)]
pub struct ConfirmOptions {
    pub message: String,
    pub title: Option<String>,
    pub default_yes: bool,
    pub force_terminal: bool,
}

impl Default for ConfirmOptions {
    fn default() -> Self {
        Self {
            message: String::new(),
            title: Some("Confirm".into()),
            default_yes: true,
            force_terminal: false,
        }
    }
}

/// Options for a text input prompt.
#[derive(Debug, Clone)]
pub struct PromptOptions {
    pub message: String,
    pub title: Option<String>,
    pub default: String,
    pub force_terminal: bool,
}

impl Default for PromptOptions {
    fn default() -> Self {
        Self {
            message: String::new(),
            title: Some("Input".into()),
            default: String::new(),
            force_terminal: false,
        }
    }
}

fn tgp_bin() -> Option<std::path::PathBuf> {
    if let Ok(p) = std::env::var("TGP_BIN") {
        let path = std::path::PathBuf::from(p);
        if path.exists() {
            return Some(path);
        }
    }
    // Look relative to executable or in PATH
    let exe = std::env::current_exe().ok()?;
    let dir = exe.parent()?;
    let name = if cfg!(windows) { "tgp.exe" } else { "tgp" };
    let cand = dir.join(name);
    if cand.exists() {
        return Some(cand);
    }
    let cand = dir.join("..").join("core").join(name);
    if cand.exists() {
        return Some(cand.canonicalize().ok()?);
    }
    which::which(name).ok()
}

fn use_gui(force_terminal: bool) -> bool {
    !force_terminal && tgp_bin().is_some() && atty::is(atty::Stream::Stdout)
}

/// Run the TGP binary and return the first line of stdout.
fn run_tgp(args: &[&str]) -> io::Result<(String, i32)> {
    let bin = tgp_bin().ok_or_else(|| io::Error::new(io::ErrorKind::NotFound, "TGP binary not found"))?;
    let scripts_dir = bin.parent().unwrap_or(std::path::Path::new(".")).join("..").join("scripts");
    let out = Command::new(&bin)
        .args(args)
        .env("TGP_SCRIPTS_DIR", scripts_dir.to_string_lossy().to_string())
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .output()?;
    let line = String::from_utf8_lossy(&out.stdout).trim().lines().next().unwrap_or("").to_string();
    Ok((line, out.status.code().unwrap_or(-1)))
}

/// Confirm (yes/no). Returns `Ok(true)` for yes, `Ok(false)` for no.
/// Always writes the prompt message to stdout first.
pub fn confirm(opts: &ConfirmOptions) -> io::Result<bool> {
    writeln!(io::stdout(), "{}", opts.message.trim())?;
    if use_gui(opts.force_terminal) {
        if let Ok((line, _)) = run_tgp(&[
            "confirm",
            "--message", opts.message.trim(),
            "--title", opts.title.as_deref().unwrap_or("Confirm"),
            "--default", if opts.default_yes { "yes" } else { "no" },
        ]) {
            return Ok(line.to_lowercase().starts_with('y'));
        }
    }
    // Terminal fallback
    let def = if opts.default_yes { " (Y/n)" } else { " (y/N)" };
    write!(io::stdout(), "{}{} ", opts.message.trim(), def)?;
    io::stdout().flush()?;
    let mut buf = String::new();
    io::stdin().read_line(&mut buf)?;
    let s = buf.trim().to_lowercase();
    Ok(match s.as_str() {
        "y" | "yes" => true,
        "n" | "no" => false,
        _ => opts.default_yes,
    })
}

/// Prompt for a single line of text. Always writes the prompt to stdout first.
pub fn prompt(opts: &PromptOptions) -> io::Result<String> {
    writeln!(io::stdout(), "{}", opts.message.trim())?;
    if use_gui(opts.force_terminal) {
        if let Ok((line, code)) = run_tgp(&[
            "input",
            "--message", opts.message.trim(),
            "--title", opts.title.as_deref().unwrap_or("Input"),
            "--default", opts.default.as_str(),
        ]) {
            if code == 0 {
                return Ok(line);
            }
        }
    }
    let suffix = if opts.default.is_empty() { " ".into() } else { format!(" (default: {}) ", opts.default) };
    write!(io::stdout(), "{}", suffix)?;
    io::stdout().flush()?;
    let mut buf = String::new();
    io::stdin().read_line(&mut buf)?;
    let s = buf.trim();
    Ok(if s.is_empty() { opts.default.clone() } else { s.into() })
}
