import os
import shutil
import subprocess
import sys
from typing import Optional


def _tgp_bin() -> Optional[str]:
    if p := os.environ.get("TGP_BIN"):
        if os.path.isfile(p):
            return p
    name = "tgp.exe" if sys.platform == "win32" else "tgp"
    if p := shutil.which(name):
        return p
    return None


def has_tgp_binary() -> bool:
    return _tgp_bin() is not None


def _use_gui(force_terminal: bool) -> bool:
    if force_terminal:
        return False
    if not _tgp_bin():
        return False
    try:
        return sys.stdout.isatty()
    except Exception:
        return False


def _run_tgp(args: list[str]) -> tuple[str, int]:
    bin_ = _tgp_bin()
    if not bin_:
        raise FileNotFoundError("TGP binary not found (set TGP_BIN or add tgp to PATH)")
    result = subprocess.run(
        [bin_, *args],
        capture_output=True,
        text=True,
        env={**os.environ},
    )
    line = (result.stdout or "").strip().split("\n")[0] if result.stdout else ""
    return line, result.returncode


def confirm(
    message: str,
    *,
    title: str = "Confirm",
    default: bool = True,
    force_terminal: bool = False,
) -> bool:
    """Prompt for yes/no. Always prints the message to stdout first."""
    print(message.rstrip())
    if _use_gui(force_terminal):
        try:
            line, _ = _run_tgp([
                "confirm", "--message", message, "--title", title,
                "--default", "yes" if default else "no",
            ])
            return line.lower().startswith("y")
        except Exception:
            pass
    suffix = " (Y/n) " if default else " (y/N) "
    sys.stdout.write(suffix)
    sys.stdout.flush()
    try:
        s = (sys.stdin.readline() or "").strip().lower()
    except EOFError:
        return default
    if s in ("y", "yes"):
        return True
    if s in ("n", "no"):
        return False
    return default


def prompt(
    message: str,
    *,
    title: str = "Input",
    default: str = "",
    force_terminal: bool = False,
) -> str:
    """Prompt for a single line. Always prints the message to stdout first."""
    print(message.rstrip())
    if _use_gui(force_terminal):
        try:
            line, code = _run_tgp([
                "input", "--message", message, "--title", title, "--default", default,
            ])
            if code == 0:
                return line
        except Exception:
            pass
    suffix = f" (default: {default}) " if default else " "
    sys.stdout.write(suffix)
    sys.stdout.flush()
    try:
        s = (sys.stdin.readline() or "").strip()
    except EOFError:
        return default
    return s if s else default
