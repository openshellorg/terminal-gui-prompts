/**
 * TGP core binary. Protocol: tgp confirm|input --message=<text> [--title=] [--default=]
 * Stdout: one line (y|n or text). Exit 0 = OK, 1 = cancel.
 * Uses platform helpers (PowerShell / zenity / osascript).
 */
module tgp.main;

import std.process : execute;
import std.stdio : writeln, stderr, stdout;
import std.file : exists;
import std.path : buildPath, dirName;
import std.getopt : getopt, GetOptException;
import core.stdc.stdlib : getenv;
import std.string : strip, replace;
version (Windows) import core.sys.windows.windows : GetModuleFileNameA;
version (Posix) import core.sys.posix.unistd : readlink;
import std.conv : to;

int main(string[] args) {
    string subcommand = "";
    string message = "";
    string title = "";
    string defaultVal = "";

    try {
        getopt(args,
            "message", &message,
            "title", &title,
            "default", &defaultVal
        );
    } catch (GetOptException e) {
        stderr.writeln("tgp: ", e.msg);
        return 2;
    }

    if (args.length > 1 && (args[1] == "confirm" || args[1] == "input"))
        subcommand = args[1];
    if (subcommand != "confirm" && subcommand != "input") {
        stderr.writeln("Usage: tgp confirm|input --message=<text> [--title=<text>] [--default=...]");
        return 2;
    }
    if (message.length == 0) {
        stderr.writeln("tgp: --message is required");
        return 2;
    }
    if (title.length == 0)
        title = subcommand == "confirm" ? "Confirm" : "Input";
    if (defaultVal.length == 0 && subcommand == "confirm")
        defaultVal = "yes";

    if (subcommand == "confirm")
        return runConfirm(message, title, defaultVal);
    else
        return runInput(message, title, defaultVal);
}

string getExeDir() {
    version (Windows) {
        char[1024] buf = 0;
        if (GetModuleFileNameA(null, buf.ptr, 1024) != 0)
            return dirName(to!string(buf.ptr));
    }
    version (Linux) {
        char[1024] buf = 0;
        if (readlink("/proc/self/exe".ptr, buf.ptr, 1024) > 0)
            return dirName(to!string(buf.ptr));
    }
    version (OSX) { /* could use _NSGetExecutablePath */ }
    return ".";
}

string findScriptsDir(string scriptName) {
    string cand;
    auto ep = getenv("TGP_SCRIPTS_DIR");
    if (ep !is null) {
        cand = to!string(ep);
        if (cand.length > 0 && exists(buildPath(cand, scriptName))) return cand;
    }
    version (Windows) {
        string exeDir = getExeDir();
        cand = buildPath(exeDir, "..", "scripts");
        if (exists(buildPath(cand, scriptName))) return cand;
        cand = buildPath(exeDir, "scripts");
        if (exists(buildPath(cand, scriptName))) return cand;
    }
    if (exists(buildPath("scripts", scriptName))) return "scripts";
    if (exists(buildPath("..", "scripts", scriptName))) return buildPath("..", "scripts");
    return "";
}

int runConfirm(string message, string title, string defaultVal) {
    version (Windows) {
        string scriptsDir = findScriptsDir("Show-ConfirmDialog.ps1");
        string[] cmd;
        if (scriptsDir.length > 0) {
            cmd = ["pwsh", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File",
                buildPath(scriptsDir, "Show-ConfirmDialog.ps1"),
                "-Message", message, "-Title", title, "-Default", defaultVal == "yes" ? "Yes" : "No"];
        } else {
            string ps = `Add-Type -AssemblyName System.Windows.Forms
$r=[System.Windows.Forms.MessageBox]::Show('` ~ message.replace("'", "''") ~ `','` ~ title.replace("'", "''") ~ `',[System.Windows.Forms.MessageBoxButtons]::YesNo,[System.Windows.Forms.MessageBoxIcon]::Question,[System.Windows.Forms.MessageBoxDefaultButton]::` ~ (defaultVal == "yes" ? "Button1" : "Button2") ~ `)
if($r -eq 'Yes'){Write-Output 'y';exit 0}else{Write-Output 'n';exit 1}`;
            cmd = ["pwsh", "-NoProfile", "-Command", ps];
        }
        auto r = execute(cmd);
        string line = r.output.strip;
        if (line.length > 0) stdout.writeln(line[0] == 'y' ? "y" : "n");
        return (line.length > 0 && line[0] == 'y') ? 0 : 1;
    }
    version (Linux) {
        string[] cmd = ["zenity", "--question", "--text=" ~ message, "--title=" ~ title];
        if (defaultVal == "no") cmd ~= "--default-no";
        auto r = execute(cmd);
        stdout.writeln(r.status == 0 ? "y" : "n");
        return r.status;
    }
    version (OSX) {
        string b = defaultVal == "yes" ? "Yes" : "No";
        string script = "display dialog \"" ~ message.replace("\"", "\\\"") ~ "\" with title \"" ~ title.replace("\"", "\\\"") ~ "\" buttons {\"No\", \"Yes\"} default button \"" ~ b ~ "\"";
        auto r = execute(["osascript", "-e", script]);
        string line = r.output.strip;
        stdout.writeln(line.canFind("Yes") ? "y" : "n");
        return line.canFind("Yes") ? 0 : 1;
    }
    return 1;
}

int runInput(string message, string title, string defaultVal) {
    version (Windows) {
        string scriptsDir = findScriptsDir("Show-InputDialog.ps1");
        if (scriptsDir.length == 0) {
            stderr.writeln("tgp: Show-InputDialog.ps1 not found");
            return 1;
        }
        auto r = execute(["pwsh", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File",
            buildPath(scriptsDir, "Show-InputDialog.ps1"),
            "-Message", message, "-Title", title, "-Default", defaultVal]);
        string line = r.output.strip;
        if (line.length > 0) stdout.writeln(line);
        return r.status;
    }
    version (Linux) {
        auto r = execute(["zenity", "--entry", "--text=" ~ message, "--title=" ~ title, "--entry-text=" ~ defaultVal]);
        string line = r.output.strip;
        if (line.length > 0) stdout.writeln(line);
        return r.status;
    }
    version (OSX) {
        string script = "display dialog \"" ~ message.replace("\"", "\\\"") ~ "\" with title \"" ~ title.replace("\"", "\\\"") ~ "\" default answer \"" ~ defaultVal.replace("\"", "\\\"") ~ "\"";
        auto r = execute(["osascript", "-e", script]);
        string line = r.output.strip;
        auto idx = line.indexOf("text returned:");
        if (idx >= 0) { line = line[idx + 14 .. $].strip; stdout.writeln(line); return 0; }
        return 1;
    }
    return 1;
}
