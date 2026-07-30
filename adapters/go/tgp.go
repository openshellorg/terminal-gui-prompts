// Package tgp is the Go adapter for Terminal GUI Prompts.
// It uses the TGP core binary when available and falls back to terminal input.
package tgp

import (
	"bufio"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

// ConfirmOptions holds options for a yes/no prompt.
type ConfirmOptions struct {
	Message       string
	Title         string
	DefaultYes    bool
	ForceTerminal bool
}

// PromptOptions holds options for a text input prompt.
type PromptOptions struct {
	Message       string
	Title         string
	Default       string
	ForceTerminal bool
}

func tgpBin() (string, bool) {
	if p := os.Getenv("TGP_BIN"); p != "" {
		if _, err := os.Stat(p); err == nil {
			return p, true
		}
	}
	exe, err := os.Executable()
	if err != nil {
		return "", false
	}
	dir := filepath.Dir(exe)
	name := "tgp"
	if isWindows() {
		name = "tgp.exe"
	}
	for _, rel := range []string{name, filepath.Join("..", "core", name)} {
		cand := filepath.Join(dir, rel)
		if _, err := os.Stat(cand); err == nil {
			return cand, true
		}
	}
	if p, err := exec.LookPath(name); err == nil {
		return p, true
	}
	return "", false
}

func isWindows() bool { return os.PathSeparator == '\\' }

func useGUI(forceTerminal bool) bool {
	if forceTerminal {
		return false
	}
	bin, ok := tgpBin()
	_ = bin
	return ok && isTTY(os.Stdout)
}

func isTTY(f *os.File) bool {
	if f == nil {
		return false
	}
	info, err := f.Stat()
	if err != nil {
		return false
	}
	return (info.Mode() & os.ModeCharDevice) == os.ModeCharDevice
}

func runTGP(args []string) (string, int, error) {
	bin, ok := tgpBin()
	if !ok {
		return "", -1, fmt.Errorf("TGP binary not found (set TGP_BIN or add tgp to PATH)")
	}
	cmd := exec.Command(bin, args...)
	var stdout strings.Builder
	cmd.Stdout = &stdout
	cmd.Stderr = nil
	err := cmd.Run()
	line := strings.TrimSpace(stdout.String())
	if idx := strings.Index(line, "\n"); idx >= 0 {
		line = line[:idx]
	}
	code := 0
	if err != nil {
		if exit, ok := err.(*exec.ExitError); ok {
			code = exit.ExitCode()
		} else {
			return "", -1, err
		}
	}
	return line, code, nil
}

// Confirm prompts for yes/no. Writes the message to stdout, then uses the TGP binary or terminal.
func Confirm(opts ConfirmOptions) (bool, error) {
	fmt.Println(strings.TrimRight(opts.Message, " \t"))
	if opts.Title == "" {
		opts.Title = "Confirm"
	}
	if useGUI(opts.ForceTerminal) {
		def := "no"
		if opts.DefaultYes {
			def = "yes"
		}
		line, code, err := runTGP([]string{"confirm", "--message", opts.Message, "--title", opts.Title, "--default", def})
		if err == nil {
			return strings.HasPrefix(strings.ToLower(line), "y"), nil
		}
	}
	// Terminal fallback
	suffix := " (Y/n) "
	if !opts.DefaultYes {
		suffix = " (y/N) "
	}
	fmt.Print(suffix)
	sc := bufio.NewScanner(os.Stdin)
	if !sc.Scan() {
		return opts.DefaultYes, sc.Err()
	}
	s := strings.TrimSpace(strings.ToLower(sc.Text()))
	switch s {
	case "y", "yes":
		return true, nil
	case "n", "no":
		return false, nil
	}
	return opts.DefaultYes, nil
}

// Prompt prompts for a single line. Writes the message to stdout first.
func Prompt(opts PromptOptions) (string, error) {
	fmt.Println(strings.TrimRight(opts.Message, " \t"))
	if opts.Title == "" {
		opts.Title = "Input"
	}
	if useGUI(opts.ForceTerminal) {
		line, code, err := runTGP([]string{"input", "--message", opts.Message, "--title", opts.Title, "--default", opts.Default})
		if err == nil && code == 0 {
			return line, nil
		}
	}
	suffix := " "
	if opts.Default != "" {
		suffix = fmt.Sprintf(" (default: %s) ", opts.Default)
	}
	fmt.Print(suffix)
	sc := bufio.NewScanner(os.Stdin)
	if !sc.Scan() {
		return opts.Default, sc.Err()
	}
	s := strings.TrimSpace(sc.Text())
	if s == "" {
		return opts.Default, nil
	}
	return s, nil
}
